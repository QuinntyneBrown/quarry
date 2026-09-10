using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Quarry.Application.Recommendations;

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
        await _sender.Send(new RebuildFrameworkSearchIndexCommand(), cancellationToken);
        return Accepted();
    }
}
