using Quarry.Application.Catalog;

namespace Quarry.Api.AcceptanceTests;

internal sealed class SearchTestDetailsReader : IFrameworkDetailsReader
{
    public Task<FrameworkDetails?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        var summary = new FrameworkSummary(id, "Atlas", "Accessible framework.", "React", ["Accessible"], 2, "1");
        return Task.FromResult<FrameworkDetails?>(new FrameworkDetails(summary, [new FrameworkCapability("accessible-controls", "Supports accessible controls.")], ["Internal tools"], []));
    }
}
