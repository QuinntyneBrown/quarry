using System.Net;
using System.Net.Http.Headers;
using System.Text;

namespace Quarry.Api.AcceptanceTests;

public sealed class UnknownLengthContent(string body) : HttpContent
{
    private readonly byte[] _bytes = Encoding.UTF8.GetBytes(body);

    public static UnknownLengthContent Json(string body)
    {
        var content = new UnknownLengthContent(body);
        content.Headers.ContentType = new MediaTypeHeaderValue("application/json");
        return content;
    }

    protected override bool TryComputeLength(out long length) { length = 0; return false; }

    protected override Task SerializeToStreamAsync(Stream stream, TransportContext? context)
        => stream.WriteAsync(_bytes).AsTask();
}
