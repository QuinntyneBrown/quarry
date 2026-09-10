using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public interface IFrameworkDraftRepository
{
    Task<bool> CreateAsync(Framework framework, string actorId, string correlationId, CancellationToken cancellationToken);
    Task<FrameworkDraft?> GetAsync(Guid id, CancellationToken cancellationToken);
}
