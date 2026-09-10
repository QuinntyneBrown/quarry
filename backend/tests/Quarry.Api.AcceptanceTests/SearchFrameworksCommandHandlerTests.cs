// Acceptance Test
// Traces to: L2-005, L2-007, L2-014, L2-041
// Description: Semantic search uses a compatible query vector and returns ranked capability-grounded results.
using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SearchFrameworksCommandHandlerTests
{
    [Fact]
    public async Task HandleReturnsGroundedRankedItemsAndIncompleteStatus()
    {
        var handler = new SearchFrameworksCommandHandler(new SearchTestEmbeddingProvider(), new SearchTestVectorRepository(), new CosineSimilarityRanker(), new SearchTestDetailsReader());

        var result = await handler.Handle(new SearchFrameworksCommand("Accessible forms", "React"), CancellationToken.None);

        var item = Assert.Single(result.Items);
        Assert.Equal(1, item.Rank);
        Assert.Equal("Supports accessible controls.", item.Explanation);
        Assert.Equal(["accessible-controls"], item.SupportingCapabilityIds);
        Assert.True(result.IsIndexIncomplete);
    }
}
