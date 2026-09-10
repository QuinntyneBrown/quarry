using System.Data.Common;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Indexing.Worker;

public sealed class Worker : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<Worker> _logger;
    private readonly string _model;

    public Worker(IServiceScopeFactory scopeFactory, ILogger<Worker> logger, IOptions<OllamaEmbeddingOptions> options)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
        _model = options.Value.Model;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        var nextSchedule = DateTimeOffset.MinValue;
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                if (DateTimeOffset.UtcNow >= nextSchedule)
                {
                    using var scope = _scopeFactory.CreateScope();
                    await scope.ServiceProvider.GetRequiredService<SqlIndexWorkRepository>().EnqueueMissingAsync(_model, stoppingToken);
                    nextSchedule = DateTimeOffset.UtcNow.AddSeconds(5);
                }
                var processed = await Task.WhenAll(ProcessNextAsync(stoppingToken), ProcessNextAsync(stoppingToken));
                if (processed.Any(value => value)) continue;
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested)
            {
                break;
            }
            catch (Exception error) when (error is DbException or DbUpdateException)
            {
                _logger.LogWarning("Index work database is unavailable; pending work and expired leases will be retried.");
            }
            await Task.Delay(TimeSpan.FromSeconds(1), stoppingToken);
        }
    }

    private async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        using var scope = _scopeFactory.CreateScope();
        return await scope.ServiceProvider.GetRequiredService<FrameworkIndexProcessor>().ProcessNextAsync(cancellationToken);
    }
}
