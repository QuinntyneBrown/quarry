namespace Quarry.Api.AcceptanceTests;

public sealed record RecordedLogEntry(string Category, string Message, IReadOnlyDictionary<string, object?> Properties, string? Exception);
