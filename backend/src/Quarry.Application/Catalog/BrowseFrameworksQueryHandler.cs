using MediatR;

namespace Quarry.Application.Catalog;

public sealed class BrowseFrameworksQueryHandler : IRequestHandler<BrowseFrameworksQuery, CatalogPage>
{
    private readonly IFrameworkCatalogReader _catalogReader;

    public BrowseFrameworksQueryHandler(IFrameworkCatalogReader catalogReader)
    {
        _catalogReader = catalogReader;
    }

    public Task<CatalogPage> Handle(BrowseFrameworksQuery request, CancellationToken cancellationToken)
    {
        return _catalogReader.BrowseAsync(request.PageSize, request.Technology, request.Cursor, cancellationToken);
    }
}
