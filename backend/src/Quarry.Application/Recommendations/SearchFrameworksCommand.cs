using MediatR;

namespace Quarry.Application.Recommendations;

public sealed record SearchFrameworksCommand(string Query, string? Technology) : IRequest<FrameworkSearchResult>;
