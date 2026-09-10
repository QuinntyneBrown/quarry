using System.Text.Json;
using System.Data;
using System.Globalization;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Catalog;
using Quarry.Infrastructure.Persistence;

namespace Quarry.Infrastructure.Catalog;

public sealed class SqlFrameworkCatalogReader : IFrameworkCatalogReader, IFrameworkDetailsReader
{
    private readonly QuarryDbContext _dbContext;

    public SqlFrameworkCatalogReader(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CatalogPage> BrowseAsync(int pageSize, string? technology, string? cursor, CancellationToken cancellationToken)
    {
        CatalogCursor.TryDecode(cursor, out var offset);
        await using var transaction = await _dbContext.Database.BeginTransactionAsync(IsolationLevel.Serializable, cancellationToken);
        var catalogRevision = await _dbContext.CatalogState.AsNoTracking().Where(item => item.Id == 1).Select(item => item.Revision).SingleAsync(cancellationToken);
        var query = _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished);
        if (!string.IsNullOrWhiteSpace(technology))
        {
            query = query.Where(item => item.Technology == technology);
        }

        var total = await query.CountAsync(cancellationToken);
        var entries = await query
            .OrderBy(item => item.Name)
            .ThenBy(item => item.Id)
            .Skip(offset)
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
        var nextOffset = offset + items.Count;
        await transaction.CommitAsync(cancellationToken);
        return new CatalogPage(items, total, nextOffset < total, nextOffset < total ? CatalogCursor.Encode(nextOffset) : null, catalogRevision.ToString(CultureInfo.InvariantCulture));
    }

    public async Task<FrameworkDetails?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var entry = await _dbContext.FrameworkRevisions.AsNoTracking().SingleOrDefaultAsync(item => item.Id == id && item.IsPublished, cancellationToken);
        if (entry is null)
        {
            return null;
        }

        var summary = new FrameworkSummary(entry.Id, entry.Name, entry.Description, entry.Technology, JsonSerializer.Deserialize<List<string>>(entry.TagsJson) ?? [], entry.ComponentCount, entry.Revision);
        return new FrameworkDetails(
            summary,
            JsonSerializer.Deserialize<List<FrameworkCapability>>(entry.CapabilitiesJson) ?? [],
            JsonSerializer.Deserialize<List<string>>(entry.UseCasesJson) ?? [],
            JsonSerializer.Deserialize<List<FrameworkComponentDescriptor>>(entry.ComponentsJson) ?? []);
    }
}
