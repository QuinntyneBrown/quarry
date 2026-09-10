using MediatR;

namespace Quarry.Application.Catalog;

public sealed record BrowseFrameworksQuery(int PageSize, string? Technology, string? Cursor, string? ExpectedRevision = null) : IRequest<CatalogPage>;
