using Quarry.Api.Contracts;

namespace Quarry.Api;

public sealed class RequestBodyLimitMiddleware(RequestDelegate next)
{
    private const int MaximumBytes = 16 * 1024;

    public async Task InvokeAsync(HttpContext context)
    {
        if (context.Request.ContentLength is > MaximumBytes)
        {
            await RejectAsync(context);
            return;
        }
        if (context.Request.ContentLength == 0
            || context.Features.Get<Microsoft.AspNetCore.Http.Features.IHttpRequestBodyDetectionFeature>()?.CanHaveBody == false)
        {
            await next(context);
            return;
        }

        // Read at most the limit plus one byte before MVC binds or dispatches the request.
        // This also bounds chunked bodies without relying on a Content-Length header.
        var bytes = new byte[MaximumBytes + 1];
        var count = 0;
        while (count < bytes.Length)
        {
            var read = await context.Request.Body.ReadAsync(bytes.AsMemory(count), context.RequestAborted);
            if (read == 0) break;
            count += read;
        }
        if (count > MaximumBytes)
        {
            await RejectAsync(context);
            return;
        }

        var originalBody = context.Request.Body;
        await using var bufferedBody = new MemoryStream(bytes, 0, count, writable: false);
        context.Request.Body = bufferedBody;
        try { await next(context); }
        finally { context.Request.Body = originalBody; }
    }

    private static async Task RejectAsync(HttpContext context)
    {
        context.Response.StatusCode = StatusCodes.Status413PayloadTooLarge;
        await context.Response.WriteAsJsonAsync(new SafeErrorResponse("request_body_too_large", context.TraceIdentifier), context.RequestAborted);
    }
}
