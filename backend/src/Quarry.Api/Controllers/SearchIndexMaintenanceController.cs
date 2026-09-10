using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Quarry.Api.Controllers;

[ApiController]
[Authorize(Policy = "maintenance")]
[Route("api/maintenance/search-index")]
public sealed class SearchIndexMaintenanceController : ControllerBase
{
    [HttpPost("rebuild")]
    public ActionResult Rebuild()
    {
        return Accepted();
    }
}
