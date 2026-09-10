using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed record PublishFrameworkCommand(Guid Id, string? ExpectedRevision, IReadOnlyList<PublicationEvidence?>? Evidence,
    string ActorId, string CorrelationId) : IRequest<PublicationResult>;
