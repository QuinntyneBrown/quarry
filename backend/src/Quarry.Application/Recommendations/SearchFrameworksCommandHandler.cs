using MediatR;
using Quarry.Application.Catalog;

namespace Quarry.Application.Recommendations;

public sealed class SearchFrameworksCommandHandler : IRequestHandler<SearchFrameworksCommand, FrameworkSearchResult>
{
    private const double RelevanceThreshold = 0.5d;
    private readonly ITextEmbeddingProvider _embeddingProvider;
    private readonly IFrameworkVectorRepository _vectorRepository;
    private readonly CosineSimilarityRanker _ranker;
    private readonly IFrameworkDetailsReader _detailsReader;

    public SearchFrameworksCommandHandler(ITextEmbeddingProvider embeddingProvider, IFrameworkVectorRepository vectorRepository, CosineSimilarityRanker ranker, IFrameworkDetailsReader detailsReader)
    {
        _embeddingProvider = embeddingProvider;
        _vectorRepository = vectorRepository;
        _ranker = ranker;
        _detailsReader = detailsReader;
    }

    public async Task<FrameworkSearchResult> Handle(SearchFrameworksCommand request, CancellationToken cancellationToken)
    {
        var embedding = await _embeddingProvider.EmbedAsync(FrameworkEmbeddingInput.ForQuery(request.Query), cancellationToken);
        var snapshot = await _vectorRepository.GetSnapshotAsync(request.Technology, embedding.Model, embedding.Values.Count, cancellationToken);
        var rankings = _ranker.Rank(embedding.Values, snapshot.Candidates, request.Technology, RelevanceThreshold);
        var items = new List<FrameworkSearchResultItem>();
        foreach (var ranking in rankings)
        {
            var details = await _detailsReader.GetAsync(ranking.FrameworkId, cancellationToken);
            if (details is null)
            {
                continue;
            }

            var capability = details.Capabilities.FirstOrDefault();
            items.Add(new FrameworkSearchResultItem(
                details.Summary.Id,
                details.Summary.Name,
                details.Summary.Description,
                details.Summary.Technology,
                details.Summary.Tags,
                details.Summary.ComponentCount,
                details.Summary.Revision,
                items.Count + 1,
                capability?.Description ?? "Published framework metadata matches the current catalog.",
                capability is null ? [] : [capability.Id]));
        }

        return new FrameworkSearchResult(items, items.FirstOrDefault()?.Revision ?? "0", snapshot.IsIncomplete);
    }
}
