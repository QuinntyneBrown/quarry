using MediatR;

namespace Quarry.Application.Recommendations;

public sealed record RebuildFrameworkSearchIndexCommand(string ActorId, string CorrelationId) : IRequest;
