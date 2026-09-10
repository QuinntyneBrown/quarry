using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed record CreateFrameworkDraftCommand(Guid Id, FrameworkMetadata Metadata, string ActorId, string CorrelationId) : IRequest<FrameworkDraft?>;
