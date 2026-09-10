using Microsoft.Extensions.Configuration;
using Quarry.Application.Catalog;

namespace Quarry.Infrastructure.Catalog;

public sealed class DevelopmentFrameworkCatalogReader : IFrameworkCatalogReader, IFrameworkDetailsReader
{
    private readonly IConfiguration _configuration;

    public DevelopmentFrameworkCatalogReader(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public Task<CatalogPage> BrowseAsync(int pageSize, string? technology, CancellationToken cancellationToken)
    {
        if (!bool.TryParse(_configuration["Catalog:SeedDevelopmentEvaluationData"], out var seed) || !seed)
        {
            return Task.FromResult(new CatalogPage([], 0, false, null, "0"));
        }

        var atlas = new FrameworkSummary(
            Guid.Parse("3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f"),
            "Atlas",
            "An accessible published framework for evaluation.",
            "React",
            ["Accessible"],
            2,
            "1");
        var items = string.IsNullOrWhiteSpace(technology) || string.Equals(atlas.Technology, technology, StringComparison.OrdinalIgnoreCase)
            ? new List<FrameworkSummary> { atlas }
            : [];
        return Task.FromResult(new CatalogPage(items, items.Count, false, null, "1"));
    }

    public Task<FrameworkDetails?> GetAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id != Guid.Parse("3a23bcd2-2b42-492d-a95e-1dd1e3e3cc3f") || !bool.TryParse(_configuration["Catalog:SeedDevelopmentEvaluationData"], out var seed) || !seed)
        {
            return Task.FromResult<FrameworkDetails?>(null);
        }

        var summary = new FrameworkSummary(id, "Atlas", "An accessible published framework for evaluation.", "React", ["Accessible"], 2, "1");
        return Task.FromResult<FrameworkDetails?>(new FrameworkDetails(summary));
    }
}
