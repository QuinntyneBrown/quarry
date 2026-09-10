// Acceptance Test
// Traces to: L2-033, L2-041
// Description: Semantic-search admission is bounded before provider work begins.
using Quarry.Api;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.AspNetCore.TestHost;
using Microsoft.Extensions.DependencyInjection;
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchConcurrencyGateTests
{
    [Fact]
    public async Task HttpAdmissionRejectsWithoutEmbeddingAndClientCancellationFreesASlot()
    {
        var provider = new ControlledSearchEmbeddingProvider();
        using var factory = new WebApplicationFactory<Program>().WithWebHostBuilder(builder => builder.ConfigureTestServices(services =>
        {
            services.AddSingleton<ITextEmbeddingProvider>(provider);
            services.AddSingleton<IFrameworkVectorRepository, SearchTestVectorRepository>();
        }));
        using var client = factory.CreateClient();
        using var canceled = new CancellationTokenSource();
        var first = client.PostAsJsonAsync("/api/framework-searches", new { query = "First held search" }, canceled.Token);
        var pending = Enumerable.Range(0, 15).Select(index => client.PostAsJsonAsync("/api/framework-searches", new { query = $"Held search {index}" })).ToArray();
        try
        {
            await provider.SixteenStarted.WaitAsync(TimeSpan.FromSeconds(3));
            var rejected = await client.PostAsJsonAsync("/api/framework-searches", new { query = "Overflow search" });
            Assert.Equal(HttpStatusCode.TooManyRequests, rejected.StatusCode);
            Assert.Equal(TimeSpan.FromSeconds(1), rejected.Headers.RetryAfter?.Delta);
            Assert.Equal(16, provider.Calls);
            canceled.Cancel();
            await Assert.ThrowsAnyAsync<OperationCanceledException>(() => first);
            var replacement = client.PostAsJsonAsync("/api/framework-searches", new { query = "Replacement search" });
            await provider.SeventeenStarted.WaitAsync(TimeSpan.FromSeconds(1));
            provider.Release();
            Assert.Equal(HttpStatusCode.OK, (await replacement).StatusCode);
        }
        finally
        {
            provider.Release();
            try { await first; } catch (OperationCanceledException) { }
            await Task.WhenAll(pending);
        }
    }

    [Fact]
    public void GateRejectsTheSeventeenthConcurrentSearch()
    {
        var gate = new SearchConcurrencyGate(16);

        for (var request = 0; request < 16; request++)
        {
            Assert.True(gate.TryEnter());
        }

        Assert.False(gate.TryEnter());

        for (var request = 0; request < 16; request++)
        {
            gate.Exit();
        }
    }
}
