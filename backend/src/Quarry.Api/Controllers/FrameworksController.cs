using Microsoft.AspNetCore.Mvc;
using MediatR;
using Quarry.Application.Catalog;
using Quarry.Api.Contracts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/frameworks")]
public sealed class FrameworksController : ControllerBase
{
    private readonly ISender _sender;

    public FrameworksController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType<CatalogPageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CatalogPageResponse>> GetFrameworks([FromQuery] int pageSize = 24, CancellationToken cancellationToken = default)
    {
        if (pageSize is < 1 or > 24)
        {
            return BadRequest(new SafeErrorResponse("invalid_page_size", HttpContext.TraceIdentifier));
        }

        var page = await _sender.Send(new BrowseFrameworksQuery(pageSize), cancellationToken);
        return Ok(new CatalogPageResponse(page.Items, page.Total, page.HasNextPage, page.NextCursor, page.CatalogRevision));
    }
}
