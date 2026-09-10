using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;
using Quarry.Infrastructure.Persistence;

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
    [ProducesResponseType<HealthResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<HealthResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<HealthResponse>> GetReadiness(CancellationToken cancellationToken)
    {
        try
        {
            return await _dbContext.Database.CanConnectAsync(cancellationToken)
                ? Ok(new HealthResponse("healthy"))
                : StatusCode(StatusCodes.Status503ServiceUnavailable, new HealthResponse("unhealthy"));
        }
        catch
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new HealthResponse("unhealthy"));
        }
    }
}
