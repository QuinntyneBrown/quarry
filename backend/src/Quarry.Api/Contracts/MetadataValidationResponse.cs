namespace Quarry.Api.Contracts;

public sealed record MetadataValidationResponse(string Code, string CorrelationId, IReadOnlyDictionary<string, string[]> Errors);
