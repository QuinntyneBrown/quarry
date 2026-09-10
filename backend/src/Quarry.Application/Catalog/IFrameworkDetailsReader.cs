namespace Quarry.Application.Catalog;

public interface IFrameworkDetailsReader
{
    Task<FrameworkDetails?> GetAsync(Guid id, CancellationToken cancellationToken);
}
