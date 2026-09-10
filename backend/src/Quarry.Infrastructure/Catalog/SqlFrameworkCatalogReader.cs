using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Catalog;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkCatalogReader : IFrameworkCatalogReader
{
    private readonly QuarryDbContext _dbContext;

    public SqlFrameworkCatalogReader(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CatalogPage> BrowseAsync(int pageSize, string? technology, CancellationToken cancellationToken)
    {
        var query = _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished);
        if (!string.IsNullOrWhiteSpace(technology))
        {
            query = query.Where(item => item.Technology == technology);
        }

        var total = await query.CountAsync(cancellationToken);
        var entries = await query
            .OrderBy(item => item.Name)
            .ThenBy(item => item.Id)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        var items = entries.Select(item => new FrameworkSummary(
            item.Id,
            item.Name,
            item.Description,
            item.Technology,
            JsonSerializer.Deserialize<List<string>>(item.TagsJson) ?? [],
            item.ComponentCount,
            item.Revision)).ToList();
        return new CatalogPage(items, total, total > items.Count, null, "0");
    }
}
