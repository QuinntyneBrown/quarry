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
    public async Task<ActionResult<CatalogPageResponse>> GetFrameworks([FromQuery] int pageSize = 24, CancellationToken cancellationToken = default)
    {
        var page = await _sender.Send(new BrowseFrameworksQuery(Math.Clamp(pageSize, 1, 24)), cancellationToken);
        return Ok(new CatalogPageResponse(page.Items, page.Total, page.HasNextPage, page.NextCursor, page.CatalogRevision));
    }
}
