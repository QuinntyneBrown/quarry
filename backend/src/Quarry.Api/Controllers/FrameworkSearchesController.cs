using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;
using Quarry.Application.Recommendations;
using Quarry.Application.Catalog;
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
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status400BadRequest)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status413PayloadTooLarge)]
    [ProducesResponseType<SafeErrorResponse>(StatusCodes.Status503ServiceUnavailable)]
    public async Task<IActionResult> Search([FromBody] FrameworkSearchRequest request, CancellationToken cancellationToken)
    {
        var query = request.Query?.Trim();
        if (query is null || query.Length > 500)
        {
            return BadRequest(new MetadataValidationResponse("invalid_search_query", HttpContext.TraceIdentifier,
                new Dictionary<string, string[]> { ["query"] = ["Use a project description of 500 characters or fewer."] }));
        }

        if (!string.IsNullOrWhiteSpace(request.Technology) && !SupportedTechnologies.Contains(request.Technology, StringComparer.Ordinal))
        {
            return BadRequest(new SafeErrorResponse("invalid_technology", HttpContext.TraceIdentifier));
        }

        if (query.Length == 0)
        {
            try
            {
                var page = await _sender.Send(new BrowseFrameworksQuery(24,
                    string.IsNullOrWhiteSpace(request.Technology) ? null : request.Technology, null), cancellationToken);
                return Ok(new CatalogPageResponse(page.Items, page.Total, page.HasNextPage, page.NextCursor, page.CatalogRevision));
            }
            catch (DbException)
            {
                return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
            }
        }

        if (!_concurrencyGate.TryEnter())
        {
            _logger.LogWarning("Semantic search rejected because the service is busy. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            Response.Headers.RetryAfter = "1";
            return StatusCode(StatusCodes.Status429TooManyRequests, new SafeErrorResponse("search_service_busy", HttpContext.TraceIdentifier));
        }

        try
        {
            return Ok(await _sender.Send(new SearchFrameworksCommand(query, request.Technology), cancellationToken));
        }
        catch (SearchCatalogChangingException)
        {
            _logger.LogWarning("Semantic search catalog changed repeatedly. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_changing", HttpContext.TraceIdentifier));
        }
        catch (EmbeddingCompatibilityException)
        {
            _logger.LogWarning("Semantic search embedding compatibility failed. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("embedding_model_incompatible", HttpContext.TraceIdentifier));
        }
        catch (HttpRequestException)
        {
            _logger.LogWarning("Semantic search embedding service unavailable. CorrelationId: {CorrelationId}", HttpContext.TraceIdentifier);
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("embedding_service_unavailable", HttpContext.TraceIdentifier));
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
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
