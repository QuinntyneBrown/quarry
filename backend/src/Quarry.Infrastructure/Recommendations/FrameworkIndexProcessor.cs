using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using System.Diagnostics;
using System.Text.Json;

namespace Quarry.Infrastructure.Recommendations;

public sealed class FrameworkIndexProcessor
{
    private readonly QuarryDbContext _database;
    private readonly SqlIndexWorkRepository _repository;
    private readonly ITextEmbeddingProvider _provider;
    private readonly string _model;
    private readonly int _dimensions;
    private readonly ILogger<FrameworkIndexProcessor> _logger;

    public FrameworkIndexProcessor(QuarryDbContext database, SqlIndexWorkRepository repository, ITextEmbeddingProvider provider,
        IOptions<OllamaEmbeddingOptions> options, ILogger<FrameworkIndexProcessor> logger)
    {
        _database = database;
        _repository = repository;
        _provider = provider;
        _model = options.Value.CompatibilityKey;
        _dimensions = options.Value.Dimensions;
        _logger = logger;
    }

    public async Task<bool> ProcessNextAsync(CancellationToken cancellationToken)
    {
        var work = await _repository.ClaimAsync(_model, cancellationToken);
        if (work is null) return false;
        var started = Stopwatch.GetTimestamp();
        var outcome = "failed";
        var category = "none";
        try
        {
            var framework = await _database.FrameworkRevisions.AsNoTracking()
                .SingleOrDefaultAsync(item => item.Id == work.FrameworkId, cancellationToken);
            if (framework is null || !framework.IsPublished || framework.Revision != work.SourceRevision)
            {
                await _repository.SupersedeAsync(work, cancellationToken);
                outcome = "superseded";
                return true;
            }
            var tags = JsonSerializer.Deserialize<List<string>>(framework.TagsJson) ?? [];
            using var deadline = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken);
            deadline.CancelAfter(TimeSpan.FromSeconds(5));
            var embedding = await _provider.EmbedAsync(FrameworkEmbeddingInput.ForFramework(framework.Description, tags), deadline.Token);
            if (embedding.Model != _model || embedding.Values.Count != _dimensions) throw new EmbeddingCompatibilityException();
            outcome = await _repository.CompleteAsync(work, embedding, cancellationToken) ? "completed" : "superseded";
        }
        catch (OperationCanceledException) when (!cancellationToken.IsCancellationRequested)
        {
            category = "embedding_timeout";
            await _repository.FailAsync(work, category, cancellationToken);
        }
        catch (EmbeddingCompatibilityException)
        {
            category = "embedding_model_incompatible";
            await _repository.FailAsync(work, category, cancellationToken);
        }
        catch (HttpRequestException)
        {
            category = "embedding_service_unavailable";
            await _repository.FailAsync(work, category, cancellationToken);
        }
        catch (Exception error) when (error is JsonException or InvalidDataException)
        {
            category = "invalid_embedding_data";
            await _repository.FailAsync(work, category, cancellationToken);
        }
        finally
        {
            _logger.LogInformation("Index work {WorkId} for framework {FrameworkId} revision {SourceRevision}: {Outcome}, {ErrorCategory}, {DurationMs} ms",
                work.Id, work.FrameworkId, work.SourceRevision, outcome, category, Stopwatch.GetElapsedTime(started).TotalMilliseconds);
        }
        return true;
    }
}
