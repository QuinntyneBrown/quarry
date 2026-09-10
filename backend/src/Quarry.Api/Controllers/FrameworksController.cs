using System.Data.Common;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Mvc;
using MediatR;
using Quarry.Application.Catalog;
using Quarry.Api.Contracts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/frameworks")]
[EnableRateLimiting("catalog-read")]
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
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<CatalogPageResponse>> GetFrameworks([FromQuery] int pageSize = 24, [FromQuery] string? technology = null, [FromQuery] string? cursor = null, [FromQuery] string? expectedRevision = null, CancellationToken cancellationToken = default)
    {
        if (Request.Query.Keys.Any(key => key.Equals("page", StringComparison.OrdinalIgnoreCase)
            || key.Equals("pageNumber", StringComparison.OrdinalIgnoreCase) || key.Equals("page-number", StringComparison.OrdinalIgnoreCase)))
            return BadRequest(new SafeErrorResponse("unsupported_pagination", HttpContext.TraceIdentifier));

        if (pageSize is < 1 or > 24)
        {
            return BadRequest(new SafeErrorResponse("invalid_page_size", HttpContext.TraceIdentifier));
        }

        if (!string.IsNullOrWhiteSpace(technology) && !SupportedTechnologies.Contains(technology, StringComparer.Ordinal))
        {
            return BadRequest(new SafeErrorResponse("invalid_technology", HttpContext.TraceIdentifier));
        }

        technology = string.IsNullOrWhiteSpace(technology) ? null : technology;
        if (!CatalogCursor.TryDecode(cursor, out var position) || position is not null && position.Technology != technology)
        {
            return BadRequest(new SafeErrorResponse("invalid_cursor", HttpContext.TraceIdentifier));
        }

        if (expectedRevision is not null && !CatalogCursor.IsValidRevision(expectedRevision))
            return BadRequest(new SafeErrorResponse("invalid_catalog_revision", HttpContext.TraceIdentifier));

        try
        {
            var page = await _sender.Send(new BrowseFrameworksQuery(pageSize, technology, cursor, expectedRevision), cancellationToken);
            return Ok(new CatalogPageResponse(page.Items, page.Total, page.HasNextPage, page.NextCursor, page.CatalogRevision));
        }
        catch (CatalogRevisionChangedException)
        {
            return Conflict(new SafeErrorResponse("catalog_revision_changed", HttpContext.TraceIdentifier));
        }
        catch (InvalidCatalogCursorException)
        {
            return BadRequest(new SafeErrorResponse("invalid_cursor", HttpContext.TraceIdentifier));
        }
        catch (DbException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }

    [HttpGet("{id:guid}")]
    [ProducesResponseType<FrameworkDetails>(StatusCodes.Status200OK)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status404NotFound)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<FrameworkDetails>> GetFrameworkDetails(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var details = await _sender.Send(new GetFrameworkDetailsQuery(id), cancellationToken);
            return details is null
                ? NotFound(new SafeErrorResponse("framework_not_found", HttpContext.TraceIdentifier))
                : Ok(details);
        }
        catch (DbException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }
}
