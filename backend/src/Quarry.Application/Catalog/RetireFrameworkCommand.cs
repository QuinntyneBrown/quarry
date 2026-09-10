using MediatR;

namespace Quarry.Application.Catalog;

public sealed record RetireFrameworkCommand(Guid Id, string? ExpectedRevision, FrameworkRetirementKind Kind,
    string ActorId, string CorrelationId) : IRequest<FrameworkRetirementResult>;
