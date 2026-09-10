using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Indexing.Worker;

public sealed class Worker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<Worker> _logger;

    public Worker(IServiceScopeFactory scopeFactory, ILogger<Worker> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await IndexPublishedFrameworksAsync(stoppingToken);
            }
            catch (HttpRequestException)
            {
                _logger.LogWarning("Embedding service is unavailable while indexing published frameworks.");
            }
            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }

    private async Task IndexPublishedFrameworksAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<QuarryDbContext>();
        var embeddingProvider = scope.ServiceProvider.GetRequiredService<ITextEmbeddingProvider>();
        var frameworks = await dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished).ToListAsync(cancellationToken);
        foreach (var framework in frameworks)
        {
            var tags = JsonSerializer.Deserialize<List<string>>(framework.TagsJson) ?? [];
            var embedding = await embeddingProvider.EmbedAsync($"Description: {framework.Description}\nTags: {string.Join(", ", tags)}", cancellationToken);
            var current = await dbContext.FrameworkRevisions.SingleOrDefaultAsync(item => item.Id == framework.Id && item.IsPublished, cancellationToken);
            if (current is null || current.Revision != framework.Revision)
            {
                continue;
            }

            var vector = await dbContext.FrameworkVectors.SingleOrDefaultAsync(item => item.FrameworkId == framework.Id, cancellationToken);
            if (vector is null)
            {
                vector = new FrameworkVectorEntity { FrameworkId = framework.Id };
                dbContext.FrameworkVectors.Add(vector);
            }
            vector.SourceRevision = framework.Revision;
            vector.Model = embedding.Model;
            vector.Dimensions = embedding.Values.Count;
            vector.ValuesJson = JsonSerializer.Serialize(embedding.Values);
            vector.IndexedAtUtc = DateTimeOffset.UtcNow;
            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}
