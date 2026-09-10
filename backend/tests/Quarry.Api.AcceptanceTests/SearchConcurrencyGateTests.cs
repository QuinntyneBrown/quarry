// Acceptance Test
// Traces to: L2-033, L2-041
// Description: Semantic-search admission is bounded before provider work begins.
using Quarry.Api;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchConcurrencyGateTests
{
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
