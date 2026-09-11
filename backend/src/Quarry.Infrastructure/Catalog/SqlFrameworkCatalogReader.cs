using System.Text.Json;
using System.Data;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Catalog;
using Quarry.Domain.Catalog;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkCatalogReader : IFrameworkCatalogReader, IFrameworkDetailsReader
{
    private readonly QuarryDbContext _dbContext;

    public SqlFrameworkCatalogReader(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CatalogPage> BrowseAsync(int pageSize, string? technology, string? cursor, CancellationToken cancellationToken, string? expectedRevision = null)
    {
        if (!CatalogCursor.TryDecode(cursor, out var position) || position is not null && position.Technology != technology)
            throw new InvalidCatalogCursorException();
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var catalogRevision = await _dbContext.CatalogState.AsNoTracking().Where(item => item.Id == 1).Select(item => item.Revision).SingleAsync(cancellationToken);
        var revision = catalogRevision.ToString(CultureInfo.InvariantCulture);
        if (expectedRevision is not null && expectedRevision != revision || position is not null && position.Revision != revision)
            throw new CatalogRevisionChangedException();
        var query = _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished);
        if (!string.IsNullOrWhiteSpace(technology))
        {
            query = query.Where(item => item.Technology == technology);
        }

        // Read only sort keys for ordering; SQL locale collation must not determine public order.
        var keys = (await query.Select(item => new { item.Id, item.Name }).ToListAsync(cancellationToken))
            .OrderBy(item => item.Name, StringComparer.OrdinalIgnoreCase)
            .ThenBy(item => item.Id.ToString("D"), StringComparer.Ordinal).ToList();
        var offset = 0;
        if (position is not null)
        {
            var previous = keys.FindIndex(item => item.Id == position.LastId && item.Name == position.LastName);
            if (previous < 0) throw new InvalidCatalogCursorException();
            offset = previous + 1;
        }
        var pageKeys = keys.Skip(offset).Take(pageSize).ToList();
        var ids = pageKeys.Select(item => item.Id).ToArray();
        var entries = await query.Where(item => ids.Contains(item.Id)).ToDictionaryAsync(item => item.Id, cancellationToken);
        var items = pageKeys.Select(key => entries[key.Id]).Select(item => new FrameworkSummary(
            item.Id,
            item.Name,
            item.Description,
            item.Technology,
            JsonSerializer.Deserialize<List<string>>(item.TagsJson) ?? [],
            item.ComponentCount,
            item.Revision)).ToList();
        var nextOffset = offset + items.Count;
        await transaction.CommitAsync(cancellationToken);
        var hasNextPage = nextOffset < keys.Count;
        return new CatalogPage(items, keys.Count, hasNextPage,
            hasNextPage ? CatalogCursor.Encode(new CatalogCursorPosition(items[^1].Name, items[^1].Id, technology, revision)) : null, revision);
    }

    public async Task<FrameworkDetails?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var entry = await _dbContext.FrameworkRevisions.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id && item.IsPublished, cancellationToken);
        if (entry is null)
        {
            return null;
        }

        var summary = new FrameworkSummary(entry.Id, entry.Name, entry.Description, entry.Technology, JsonSerializer.Deserialize<List<string>>(entry.TagsJson) ?? [], entry.ComponentCount, entry.Revision);
        var preview = entry.PreviewJson is null ? null : JsonSerializer.Deserialize<FrameworkPreviewDefinition>(entry.PreviewJson);
        return new FrameworkDetails(
            summary,
            JsonSerializer.Deserialize<List<FrameworkCapability>>(entry.CapabilitiesJson) ?? [],
            JsonSerializer.Deserialize<List<string>>(entry.UseCasesJson) ?? [],
            JsonSerializer.Deserialize<List<FrameworkComponentDescriptor>>(entry.ComponentsJson) ?? [],
            preview is null ? null : new PreviewManifest(entry.Id, entry.Revision, preview.PreviewUri!,
                preview.ComponentIds!.Select(id => id!).ToArray(), preview.BuildId!, preview.ProtocolVersion, preview.IsIllustrative!.Value),
            entry.DesignSystemUri);
    }
}
