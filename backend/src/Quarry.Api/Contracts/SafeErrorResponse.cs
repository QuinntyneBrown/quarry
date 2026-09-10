namespace Quarry.Api.Contracts;

public sealed record SafeErrorResponse(string Code, string CorrelationId);
