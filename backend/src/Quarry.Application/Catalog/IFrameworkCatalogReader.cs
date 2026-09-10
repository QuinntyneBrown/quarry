namespace Quarry.Application.Catalog;

public interface IFrameworkCatalogReader
{
    Task<CatalogPage> BrowseAsync(int pageSize, string? technology, string? cursor, CancellationToken cancellationToken);
}
