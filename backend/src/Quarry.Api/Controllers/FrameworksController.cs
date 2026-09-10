using Microsoft.AspNetCore.Mvc;
using MediatR;
using Quarry.Application.Catalog;
using Quarry.Api.Contracts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/frameworks")]
public sealed class FrameworksController : ControllerBase
{
    private static readonly string[] SupportedTechnologies = ["React", "Angular", "Vue", "Web Components"];

    private readonly ISender _sender;

    public FrameworksController(ISender sender)
    {
        _sender = sender;
    }

    [HttpGet]
    [ProducesResponseType<CatalogPageResponse>(StatusCodes.Status200OK)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status400BadRequest)]
    public async Task<ActionResult<CatalogPageResponse>> GetFrameworks([FromQuery] int pageSize = 24, [FromQuery] string? technology = null, CancellationToken cancellationToken = default)
    {
        if (pageSize is < 1 or > 24)
        {
            return BadRequest(new SafeErrorResponse("invalid_page_size", HttpContext.TraceIdentifier));
        }

        if (!string.IsNullOrWhiteSpace(technology) && !SupportedTechnologies.Contains(technology, StringComparer.Ordinal))
        {
            return BadRequest(new SafeErrorResponse("invalid_technology", HttpContext.TraceIdentifier));
        }

        var page = await _sender.Send(new BrowseFrameworksQuery(pageSize, technology), cancellationToken);
        return Ok(new CatalogPageResponse(page.Items, page.Total, page.HasNextPage, page.NextCursor, page.CatalogRevision));
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<FrameworkDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<FrameworkDetails>> GetFrameworkDetails(Guid id, CancellationToken cancellationToken)
    {
        var details = await _sender.Send(new GetFrameworkDetailsQuery(id), cancellationToken);
        return details is null
            ? NotFound(new SafeErrorResponse("framework_not_found", HttpContext.TraceIdentifier))
            : Ok(details);
    }
}
