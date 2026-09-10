using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace Quarry.Api.AcceptanceTests;

public sealed class RecordingLogger(string category, ConcurrentQueue<RecordedLogEntry> entries) : ILogger
{
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => logLevel != LogLevel.None;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        var properties = state is IEnumerable<KeyValuePair<string, object?>> values
            ? values.ToDictionary(item => item.Key, item => item.Value)
            : new Dictionary<string, object?>();
        entries.Enqueue(new RecordedLogEntry(category, formatter(state, exception), properties, exception?.ToString()));
    }
}
