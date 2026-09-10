using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;
using Quarry.Application.Recommendations;
using MediatR;
using System.Data.Common;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.AspNetCore.Http.Timeouts;

namespace Quarry.Api.Controllers;

[ApiController]
[Route("api/framework-searches")]
[EnableRateLimiting("framework-search")]
[RequestTimeout("framework-search")]
public sealed class FrameworkSearchesController : ControllerBase
{
    private static readonly string[] SupportedTechnologies = ["React", "Angular", "Vue", "Web Components"];
    private readonly ISender _sender;
    private readonly SearchConcurrencyGate _concurrencyGate;
    private readonly ILogger<FrameworkSearchesController> _logger;

    public FrameworkSearchesController(ISender sender, SearchConcurrencyGate concurrencyGate, ILogger<FrameworkSearchesController> logger)
    {
        _sender = sender;
        _concurrencyGate = concurrencyGate;
        _logger = logger;
    }

    [HttpPost]
    [RequestSizeLimit(16 * 1024)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<ActionResult<FrameworkSearchResult>> Search([FromBody] FrameworkSearchRequest request, CancellationToken cancellationToken)
    {
        if (Request.ContentLength is > 16 * 1024)
        {
            return StatusCode(StatusCodes.Status413PayloadTooLarge, new SafeErrorResponse("request_body_too_large", HttpContext.TraceIdentifier));
        }

        var query = request.Query?.Trim();
        if (string.IsNullOrWhiteSpace(query) || query.Length > 500)
        {
            return BadRequest(new SafeErrorResponse("invalid_search_query", HttpContext.TraceIdentifier));
        }

        if (!string.IsNullOrWhiteSpace(request.Technology) && !SupportedTechnologies.Contains(request.Technology, StringComparer.Ordinal))
        {
            return BadRequest(new SafeErrorResponse("invalid_technology", HttpContext.TraceIdentifier));
        }

        if (!_concurrencyGate.TryEnter())
        {
            _logger.LogWarning("Semantic search rejected because the service is busy. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("search_service_busy", HttpContext.TraceIdentifier));
        }

        try
        {
            return Ok(await _sender.Send(new SearchFrameworksCommand(query, request.Technology), cancellationToken));
        }
        catch (HttpRequestException)
        {
            _logger.LogWarning("Semantic search embedding service unavailable. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("embedding_service_unavailable", HttpContext.TraceIdentifier));
        }
        catch (TaskCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            _logger.LogWarning("Semantic search embedding request timed out. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("embedding_service_unavailable", HttpContext.TraceIdentifier));
        }
        catch (DbException)
        {
            _logger.LogWarning("Semantic search catalog service unavailable. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
        finally
        {
            _concurrencyGate.Exit();
        }
    }
}
