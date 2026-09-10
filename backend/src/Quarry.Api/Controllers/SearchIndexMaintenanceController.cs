using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Quarry.Application.Recommendations;
using Quarry.Api.Contracts;
using System.Data.Common;
using Microsoft.EntityFrameworkCore;

namespace Quarry.Api.Controllers;

[ApiController]
[Authorize(Policy = "maintenance")]
[Route("api/maintenance/search-index")]
public sealed class SearchIndexMaintenanceController : ControllerBase
{
    private readonly ISender _sender;

    public SearchIndexMaintenanceController(ISender sender)
    {
        _sender = sender;
    }

    [HttpPost("rebuild")]
    public async Task<ActionResult> Rebuild(CancellationToken cancellationToken)
    {
        try
        {
            await _sender.Send(new RebuildFrameworkSearchIndexCommand(User.FindFirst("sub")!.Value, HttpContext.TraceIdentifier), cancellationToken);
            return Accepted();
        }
        catch (DbException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
        catch (DbUpdateException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }
}
