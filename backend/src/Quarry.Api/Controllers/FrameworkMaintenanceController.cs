using System.Data.Common;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Quarry.Api.Contracts;
using Quarry.Application.Catalog;
using Quarry.Domain.Catalog;

namespace Quarry.Api.Controllers;

[ApiController]
[Authorize(Policy = "maintenance")]
[Route("api/maintenance/frameworks")]
public sealed class FrameworkMaintenanceController : ControllerBase
{
    private readonly ISender _sender;
    public FrameworkMaintenanceController(ISender sender) => _sender = sender;

    [HttpPost]
    [RequestSizeLimit(1024 * 1024)]
    public async Task<ActionResult<FrameworkDraft>> Create(CreateFrameworkDraftRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var metadata = new FrameworkMetadata(request.Name, request.Description, request.Technology, request.Tags,
                request.Capabilities, request.UseCases, request.Components);
            var result = await _sender.Send(new CreateFrameworkDraftCommand(request.Id, metadata, User.FindFirst("sub")!.Value, HttpContext.TraceIdentifier), cancellationToken);
            return result is null
                ? Conflict(new MetadataValidationResponse("framework_already_exists", HttpContext.TraceIdentifier, new Dictionary<string, string[]> { ["id"] = ["This framework ID already exists."] }))
                : CreatedAtAction(nameof(Get), new { id = result.Id }, result);
        }
        catch (FrameworkValidationException error)
        {
            return BadRequest(new MetadataValidationResponse("invalid_framework_metadata", HttpContext.TraceIdentifier, error.Errors));
        }
        catch (Exception error) when (error is DbException or DbUpdateException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }

    [HttpPut("{id:guid}")]
    [RequestSizeLimit(1024 * 1024)]
    public async Task<ActionResult<FrameworkDraft>> Update(Guid id, UpdateFrameworkDraftRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _sender.Send(new UpdateFrameworkDraftCommand(id, request.ExpectedRevision, request.Metadata,
                User.FindFirst("sub")!.Value, HttpContext.TraceIdentifier), cancellationToken);
            return result.Status switch
            {
                DraftUpdateStatus.Updated => Ok(result.Draft),
                DraftUpdateStatus.NotFound => NotFound(new SafeErrorResponse("framework_not_found", HttpContext.TraceIdentifier)),
                _ => Conflict(new MetadataValidationResponse("revision_conflict", HttpContext.TraceIdentifier,
                    new Dictionary<string, string[]> { ["expectedRevision"] = ["The draft changed. Reload it before updating."] }))
            };
        }
        catch (FrameworkValidationException error)
        {
            return BadRequest(new MetadataValidationResponse("invalid_framework_metadata", HttpContext.TraceIdentifier, error.Errors));
        }
        catch (Exception error) when (error is DbException or DbUpdateException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }

    [HttpPost("{id:guid}/publish")]
    [RequestSizeLimit(1024 * 1024)]
    public async Task<ActionResult<FrameworkPublicationResponse>> Publish(Guid id, PublishFrameworkRequest request, CancellationToken cancellationToken)
    {
        try
        {
            var result = await _sender.Send(new PublishFrameworkCommand(id, request.ExpectedRevision, request.Evidence,
                User.FindFirst("sub")!.Value, HttpContext.TraceIdentifier), cancellationToken);
            return result.Status switch
            {
                PublicationStatus.Published => Ok(new FrameworkPublicationResponse(id, result.Revision!, result.CatalogRevision!, "published")),
                PublicationStatus.NotFound => NotFound(new SafeErrorResponse("framework_not_found", HttpContext.TraceIdentifier)),
                _ => Conflict(new MetadataValidationResponse("revision_conflict", HttpContext.TraceIdentifier,
                    new Dictionary<string, string[]> { ["expectedRevision"] = ["The draft changed. Reload it before publishing."] }))
            };
        }
        catch (FrameworkValidationException error)
        {
            return BadRequest(new MetadataValidationResponse("invalid_publication", HttpContext.TraceIdentifier, error.Errors));
        }
        catch (Exception error) when (error is DbException or DbUpdateException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<FrameworkDraft>> Get(Guid id, CancellationToken cancellationToken)
    {
        try
        {
            var draft = await _sender.Send(new GetFrameworkDraftQuery(id), cancellationToken);
            return draft is null ? NotFound(new SafeErrorResponse("framework_not_found", HttpContext.TraceIdentifier)) : Ok(draft);
        }
        catch (DbException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new SafeErrorResponse("catalog_service_unavailable", HttpContext.TraceIdentifier));
        }
    }
}
