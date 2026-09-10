using MediatR;

namespace Quarry.Application.Catalog;

public sealed record GetFrameworkDetailsQuery(Guid Id) : IRequest<FrameworkDetails?>;
