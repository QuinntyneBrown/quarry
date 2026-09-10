using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public interface IFrameworkPublicationRepository
{
    Task<PublicationResult> PublishAsync(Guid id, string expectedRevision, IReadOnlyList<PublicationEvidence?>? evidence,
        string actorId, string correlationId, CancellationToken cancellationToken);
}
