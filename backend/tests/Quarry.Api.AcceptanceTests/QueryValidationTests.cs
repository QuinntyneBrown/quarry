// Acceptance Test
// Traces to: L2-026, L2-029, L2-041
// Description: Query validation counts UTF-16 units and returns a safe field error before embedding.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class QueryValidationTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(1)]
    [InlineData(500)]
    [InlineData(501)]
    [InlineData(-1)]
    public async Task TrimmedQueryBoundariesIdentifyInvalidFieldsBeforeEmbedding(int length)
    {
        var provider = new IndexingTestEmbeddingProvider { FailNext = true };
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder =>
        {
            builder.UseSetting("Catalog:SeedDevelopmentEvaluationData", "true");
            builder.ConfigureTestServices(services => services.AddSingleton<ITextEmbeddingProvider>(provider));
        });
        using var client = factory.CreateClient();
        var query = length < 0 ? null : "  " + string.Concat(Enumerable.Repeat("🙂", length / 2)) + (length % 2 == 1 ? "a" : "") + "  ";
        using var response = await client.PostAsJsonAsync("/api/framework-searches", new { query });
        Assert.Equal(length == 0 ? HttpStatusCode.OK : length is 1 or 500 ? HttpStatusCode.ServiceUnavailable : HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal(length is 1 or 500 ? 1 : 0, provider.Calls);
        if (length is < 0 or > 500)
        {
            var body = await response.Content.ReadAsStringAsync();
            using var error = JsonDocument.Parse(body);
            Assert.Equal("invalid_search_query", error.RootElement.GetProperty("code").GetString());
            Assert.NotEmpty(error.RootElement.GetProperty("errors").GetProperty("query").EnumerateArray());
            Assert.False(string.IsNullOrWhiteSpace(error.RootElement.GetProperty("correlationId").GetString()));
            Assert.DoesNotContain("🙂", body);
        }
    }
}
