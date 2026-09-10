using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Quarry.Api.Contracts;
using Quarry.Application.Operations;

namespace Quarry.Api.Controllers;

[ApiController]
[Authorize(Policy = "maintenance")]
[Route("api/maintenance/diagnostics")]
public sealed class OperatorDiagnosticsController(IServiceHealthReader health) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<OperatorDiagnosticsResponse>> Get(CancellationToken cancellationToken)
        => Ok(new OperatorDiagnosticsResponse(HttpContext.TraceIdentifier, await health.GetAsync(cancellationToken)));
}
