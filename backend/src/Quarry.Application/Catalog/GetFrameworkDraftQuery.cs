using MediatR;

namespace Quarry.Application.Catalog;

public sealed record GetFrameworkDraftQuery(Guid Id) : IRequest<FrameworkDraft?>;
