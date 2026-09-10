using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;
using Quarry.Infrastructure.Persistence;
using Quarry.Application.Operations;
using Microsoft.EntityFrameworkCore;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("health")]
public sealed class HealthController : ControllerBase
{
    private readonly QuarryDbContext _dbContext;

    public HealthController(QuarryDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("live")]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    public ActionResult<HealthResponse> GetLiveness()
    {
        return Ok(new HealthResponse("healthy"));
    }

    [HttpGet("ready")]
    [HttpGet("catalog")]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<HealthResponse>> GetReadiness(CancellationToken cancellationToken)
    {
        try
        {
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(TimeSpan.FromSeconds(3));
            _ = await _dbContext.CatalogState.AsNoTracking().Where(item => item.Id == 1).Select(item => item.Revision).SingleAsync(deadline.Token);
            _ = await _dbContext.FrameworkRevisions.AsNoTracking().Where(item => item.IsPublished).CountAsync(deadline.Token);
            return Ok(new HealthResponse("healthy"));
        }
        catch
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new HealthResponse("unhealthy"));
        }
    }

    [HttpGet("search")]
    public async Task<ActionResult<HealthResponse>> GetSearchReadiness([FromServices] IServiceHealthReader health, CancellationToken cancellationToken)
    {
        var report = await health.GetAsync(cancellationToken);
        return StatusCode(report.SearchStatus == "healthy" ? 200 : 503, new HealthResponse(report.SearchStatus));
    }

    [HttpGet("indexing")]
    public async Task<ActionResult<HealthResponse>> GetIndexingReadiness([FromServices] IServiceHealthReader health, CancellationToken cancellationToken)
    {
        var report = await health.GetAsync(cancellationToken, probeEmbedding: false);
        return StatusCode(report.IndexingStatus == "healthy" ? 200 : 503, new HealthResponse(report.IndexingStatus));
    }
}
