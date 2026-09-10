using MediatR;

namespace Quarry.Application.Catalog;

public sealed record BrowseFrameworksQuery(int PageSize) : IRequest<CatalogPage>;
