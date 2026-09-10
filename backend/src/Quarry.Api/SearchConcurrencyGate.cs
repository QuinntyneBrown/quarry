namespace Quarry.Api;

public sealed class SearchConcurrencyGate
{
    private readonly SemaphoreSlim _semaphore;

    public SearchConcurrencyGate(int maximumConcurrency)
    {
        _semaphore = new SemaphoreSlim(maximumConcurrency, maximumConcurrency);
    }

    public bool TryEnter()
    {
        return _semaphore.Wait(0);
    }

    public void Exit()
    {
        _semaphore.Release();
    }
}
