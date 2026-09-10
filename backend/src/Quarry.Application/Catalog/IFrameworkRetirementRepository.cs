namespace Quarry.Application.Catalog;

public interface IFrameworkRetirementRepository
{
    Task<FrameworkRetirementResult> RetireAsync(Guid id, string expectedRevision, FrameworkRetirementKind kind,
        string actorId, string correlationId, CancellationToken cancellationToken);
}
