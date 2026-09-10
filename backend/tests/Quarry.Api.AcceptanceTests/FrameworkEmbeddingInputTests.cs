// Acceptance Test
// Traces to: L2-005, L2-041
// Description: Query and catalog metadata use fixed, versioned embedding input construction.
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class FrameworkEmbeddingInputTests
{
    [Fact]
    public void BuildUsesStableVersionedLabelsForQueriesAndFrameworkMetadata()
    {
        Assert.Equal("quarry-embedding-v1\nQuery: Accessible forms", FrameworkEmbeddingInput.ForQuery("Accessible forms"));
        Assert.Equal("quarry-embedding-v1\nDescription: Accessible framework\nTags: Accessible, Forms", FrameworkEmbeddingInput.ForFramework("Accessible framework", ["Accessible", "Forms"]));
    }
}
