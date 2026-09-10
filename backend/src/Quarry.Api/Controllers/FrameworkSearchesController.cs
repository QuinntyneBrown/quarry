using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/framework-searches")]
public sealed class FrameworkSearchesController : ControllerBase
{
    private static readonly string[] SupportedTechnologies = ["React", "Angular", "Vue", "Web Components"];

    [HttpPost]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public ActionResult Search([FromBody] FrameworkSearchRequest request)
    {
        var query = request.Query?.Trim();
        if (string.IsNullOrWhiteSpace(query) || query.Length > 500)
        {
            return BadRequest(new SafeErrorResponse("invalid_search_query", HttpContext.TraceIdentifier));
        }

        if (!string.IsNullOrWhiteSpace(request.Technology) && !SupportedTechnologies.Contains(request.Technology, StringComparer.Ordinal))
        {
            return BadRequest(new SafeErrorResponse("invalid_technology", HttpContext.TraceIdentifier));
        }

        return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("embedding_service_unavailable", HttpContext.TraceIdentifier));
    }
}
