using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Quarry.Api.AcceptanceTests;

public sealed class RecordingLogProvider : ILoggerProvider
{
    public ConcurrentQueue<RecordedLogEntry> Entries { get; } = new();
    public ILogger CreateLogger(string categoryName) => new RecordingLogger(categoryName, Entries);
    public void Dispose() { }
}
