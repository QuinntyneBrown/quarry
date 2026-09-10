using Quarry.Application.Operations;

namespace Quarry.Api.Contracts;

public sealed record OperatorDiagnosticsResponse(string CorrelationId, ServiceHealthReport Health);
