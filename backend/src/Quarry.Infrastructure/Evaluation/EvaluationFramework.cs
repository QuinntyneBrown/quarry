using Quarry.Domain.Catalog;

namespace Quarry.Infrastructure.Evaluation;

public sealed record EvaluationFramework(Guid Id, string Fixture, FrameworkMetadata Metadata);
