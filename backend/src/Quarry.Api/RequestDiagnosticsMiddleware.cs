using System.Diagnostics;
using Microsoft.AspNetCore.Mvc.Controllers;

namespace Quarry.Api;

public sealed class RequestDiagnosticsMiddleware(RequestDelegate next, ILogger<RequestDiagnosticsMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var started = Stopwatch.GetTimestamp();
        var failed = false;
        var canceled = false;
        try { await next(context); }
        catch (OperationCanceledException) when (context.RequestAborted.IsCancellationRequested)
        {
            canceled = true;
            throw;
        }
        catch
        {
            failed = true;
            throw;
        }
        finally
        {
            var action = context.GetEndpoint()?.Metadata.GetMetadata<ControllerActionDescriptor>();
            var operation = action is null ? "unmatched" : $"{action.ControllerName}.{action.ActionName}";
            var status = canceled ? 499 : failed ? 500 : context.Response.StatusCode;
            var outcome = canceled ? "canceled" : status >= 500 ? "failed" : status >= 400 ? "rejected" : "succeeded";
            var category = status switch
            {
                < 400 => "none", 400 => "invalid_request", 401 => "unauthenticated", 403 => "forbidden",
                404 => "not_found", 409 => "conflict", 413 => "body_too_large", 429 => "rate_limited",
                499 => "client_canceled", 503 => "service_unavailable", 504 => "request_timeout", _ => "request_failed"
            };
            logger.LogInformation("Request {CorrelationId} {Operation}: {Outcome}, {ErrorCategory}, status {StatusCode}, {DurationMs} ms",
                context.TraceIdentifier, operation, outcome, category, status, Stopwatch.GetElapsedTime(started).TotalMilliseconds);
        }
    }
}
