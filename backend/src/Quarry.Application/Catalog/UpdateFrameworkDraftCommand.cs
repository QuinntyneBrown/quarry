using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed record UpdateFrameworkDraftCommand(Guid Id, string? ExpectedRevision, FrameworkMetadata? Metadata,
    string ActorId, string CorrelationId) : IRequest<DraftUpdateResult>;
