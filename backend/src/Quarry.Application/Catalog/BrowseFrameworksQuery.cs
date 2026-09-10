using MediatR;

namespace Quarry.Application.Catalog;

public sealed record BrowseFrameworksQuery(int PageSize, string? Technology) : IRequest<CatalogPage>;
