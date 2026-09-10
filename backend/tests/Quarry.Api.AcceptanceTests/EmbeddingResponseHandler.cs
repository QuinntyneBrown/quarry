using System.Net;
using System.Text.Json;

namespace Quarry.Api.AcceptanceTests;

internal sealed class EmbeddingResponseHandler : HttpMessageHandler
{
    public string? RequestBody { get; private set; }
    public string Digest { get; set; } = "85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1";
    public string? DigestAfterEmbedding { get; set; }
    public string? ResponseJson { get; set; }
    public int EmbedCalls { get; private set; }
    public int TagCalls { get; private set; }

    protected override async Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken)
    {
        if (request.RequestUri!.AbsolutePath == "/api/tags")
        {
            TagCalls++;
            return new HttpResponseMessage(HttpStatusCode.OK)
            {
                Content = new StringContent(JsonSerializer.Serialize(new { models = new[] { new { name = "embeddinggemma:300m", digest = EmbedCalls > 0 ? DigestAfterEmbedding ?? Digest : Digest } } }))
            };
        }
        EmbedCalls++;
        RequestBody = request.Content is null ? null : await request.Content.ReadAsStringAsync(cancellationToken);
        return new HttpResponseMessage(HttpStatusCode.OK)
        {
            Content = new StringContent(ResponseJson ?? JsonSerializer.Serialize(new { model = "embeddinggemma:300m", embeddings = new[] { Enumerable.Repeat(0.25f, 768).ToArray() } }))
        };
    }
}
