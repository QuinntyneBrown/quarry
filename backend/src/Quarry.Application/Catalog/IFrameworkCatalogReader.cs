namespace Quarry.Application.Catalog;

public interface IFrameworkCatalogReader
{
    Task<CatalogPage> BrowseAsync(int pageSize, CancellationToken cancellationToken);
}
