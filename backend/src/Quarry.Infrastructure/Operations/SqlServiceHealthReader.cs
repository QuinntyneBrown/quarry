using System.Data;
using System.Data.Common;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Quarry.Application.Operations;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Infrastructure.Operations;

public sealed class SqlServiceHealthReader(QuarryDbContext database, ITextEmbeddingProvider embeddings,
    IOptions<OllamaEmbeddingOptions> options) : IServiceHealthReader
{
    public async Task<ServiceHealthReport> GetAsync(CancellationToken cancellationToken, bool probeEmbedding = true)
    {
        using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
        deadline.CancelAfter(TimeSpan.FromSeconds(8));
        IndexHealthReport index;
        string model;
        try
        {
            await using var transaction = await database.Database.BeginTransactionAsync(IsolationLevel.Serializable, deadline.Token);
            _ = await database.CatalogState.AsNoTracking().Where(item => item.Id == 1).Select(item => item.Revision).SingleAsync(deadline.Token);
            var rows = await (from framework in database.FrameworkRevisions.AsNoTracking()
                where framework.IsPublished
                join vector in database.FrameworkVectors.AsNoTracking() on framework.Id equals vector.FrameworkId into vectors
                from vector in vectors.DefaultIfEmpty()
                join snapshot in database.PublishedFrameworkSnapshots.AsNoTracking()
                    on new { FrameworkId = framework.Id, framework.Revision } equals new { snapshot.FrameworkId, snapshot.Revision } into snapshots
                from snapshot in snapshots.DefaultIfEmpty()
                select new { framework.Id, framework.Revision, Vector = vector, PublishedAtUtc = (DateTimeOffset?)snapshot.PublishedAtUtc }).ToListAsync(deadline.Token);
            try
            {
                model = options.Value.CompatibilityKey;
                if (!Uri.TryCreate(options.Value.Endpoint, UriKind.Absolute, out var endpoint)
                    || endpoint.Scheme is not ("http" or "https") || endpoint.UserInfo.Length != 0)
                    throw new InvalidOperationException();
            }
            catch (InvalidOperationException)
            {
                return new ServiceHealthReport("healthy", "unhealthy", "unknown", ["embedding_configuration_invalid"], null);
            }
            var work = await (from item in database.IndexWorkItems.AsNoTracking()
                join framework in database.FrameworkRevisions.AsNoTracking() on item.FrameworkId equals framework.Id
                where framework.IsPublished && item.SourceRevision == framework.Revision && item.Model == model
                    && (item.State == "pending" || item.State == "leased")
                select item).ToListAsync(deadline.Token);
            await transaction.CommitAsync(deadline.Token);
            var now = DateTimeOffset.UtcNow;
            var revisions = rows.Select(row =>
            {
                var searchable = row.Vector is { } vector && vector.SourceRevision == row.Revision && vector.Model == model
                    && vector.Dimensions == options.Value.Dimensions && ValidVector(vector.ValuesJson, vector.Dimensions);
                var pendingSince = row.PublishedAtUtc ?? work.Where(item => item.FrameworkId == row.Id).Select(item => (DateTimeOffset?)item.CreatedAtUtc).Min();
                double? age = !searchable && pendingSince is { } since ? Math.Max(0, (now - since).TotalSeconds) : null;
                return new FrameworkIndexHealth(row.Id, row.Revision, row.Vector?.SourceRevision, searchable, age);
            }).OrderBy(item => item.FrameworkId).ToArray();
            var pending = revisions.Where(item => !item.IsSearchable).ToArray();
            index = new IndexHealthReport(revisions.Length, revisions.Length - pending.Length, pending.Length,
                work.Count(item => item.LastError is not null), pending.Select(item => item.PendingAgeSeconds).DefaultIfEmpty().Max(),
                pending.Any(item => item.PendingAgeSeconds > 60), revisions);
        }
        catch (ArgumentException)
        {
            return new ServiceHealthReport("unhealthy", "unhealthy", "unhealthy", ["catalog_configuration_invalid"], null);
        }
        catch (Exception error) when (error is DbException or InvalidOperationException or OperationCanceledException)
        {
            cancellationToken.ThrowIfCancellationRequested();
            return new ServiceHealthReport("unhealthy", "unhealthy", "unhealthy", ["catalog_unavailable"], null);
        }

        var indexingStatus = index.PendingCount == 0 ? "healthy" : "degraded";
        var issues = new List<string>();
        if (index.PendingCount != 0) issues.Add("index_incomplete");
        if (index.FreshnessTargetBreached) issues.Add("index_freshness_exceeded");
        var searchStatus = indexingStatus;
        if (probeEmbedding)
        {
            try
            {
                var probe = await embeddings.EmbedAsync("quarry-health-v1", deadline.Token).WaitAsync(deadline.Token);
                if (probe.Model != model || probe.Values.Count != options.Value.Dimensions
                    || probe.Values.Any(value => !float.IsFinite(value)) || !probe.Values.Any(value => value != 0))
                    throw new EmbeddingCompatibilityException();
            }
            catch (Exception error) when (error is HttpRequestException or OperationCanceledException or EmbeddingCompatibilityException or InvalidOperationException)
            {
                cancellationToken.ThrowIfCancellationRequested();
                searchStatus = "unhealthy";
                issues.Add(error is EmbeddingCompatibilityException ? "embedding_incompatible" : "embedding_unavailable");
            }
        }
        return new ServiceHealthReport("healthy", searchStatus, indexingStatus, issues, index);
    }

    private static bool ValidVector(string json, int dimensions)
    {
        try
        {
            var values = JsonSerializer.Deserialize<float[]>(json);
            return values?.Length == dimensions && values.All(float.IsFinite) && values.Any(value => value != 0);
        }
        catch (JsonException) { return false; }
    }
}
