namespace Quarry.Application.Operations;

public interface IServiceHealthReader
{
    Task<ServiceHealthReport> GetAsync(CancellationToken cancellationToken, bool probeEmbedding = true);
}
