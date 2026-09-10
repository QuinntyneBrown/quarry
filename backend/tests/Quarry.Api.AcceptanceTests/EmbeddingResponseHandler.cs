using System.Net;

namespace Quarry.Api.AcceptanceTests;

internal sealed class EmbeddingResponseHandler : HttpMessageHandler
{
    public string? RequestBody { get; private set; }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        RequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent("{\"embeddings\":[[0.25,0.75]]}")
        };
    }
}
