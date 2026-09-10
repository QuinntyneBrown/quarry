using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/frameworks")]
public sealed class FrameworksController : ControllerBase
{
    [HttpGet]
    [ProducesResponseType<CatalogPageResponse>(StatusCodes.Status200OK)]
    public ActionResult<CatalogPageResponse> GetFrameworks()
    {
        return Ok(new CatalogPageResponse([], 0, false, null, "0"));
    }
}
