using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed class RetireFrameworkCommandHandler(IFrameworkRetirementRepository repository)
    : IRequestHandler<RetireFrameworkCommand, FrameworkRetirementResult>
{
    public Task<FrameworkRetirementResult> Handle(RetireFrameworkCommand request, CancellationToken cancellationToken)
    {
        Framework.NextRevision(request.ExpectedRevision);
        return repository.RetireAsync(request.Id, request.ExpectedRevision!, request.Kind, request.ActorId, request.CorrelationId, cancellationToken);
    }
}
