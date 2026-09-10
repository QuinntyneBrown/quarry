using Quarry.Application.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class ControlledSearchEmbeddingProvider : ITextEmbeddingProvider
{
    private readonly TaskCompletionSource _release = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly TaskCompletionSource _sixteen = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private readonly TaskCompletionSource _seventeen = new(TaskCreationOptions.RunContinuationsAsynchronously);
    private int _calls;
    public int Calls => Volatile.Read(ref _calls);
    public Task SixteenStarted => _sixteen.Task;
    public Task SeventeenStarted => _seventeen.Task;
    public void Release() => _release.TrySetResult();

    public async Task<TextEmbedding> EmbedAsync(string input, CancellationToken cancellationToken)
    {
        var calls = Interlocked.Increment(ref _calls);
        if (calls == 16) _sixteen.TrySetResult();
        if (calls == 17) _seventeen.TrySetResult();
        await _release.Task.WaitAsync(cancellationToken);
        return new TextEmbedding("test-model", [1, 0]);
    }
}
