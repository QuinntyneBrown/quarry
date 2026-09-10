using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed class PublishFrameworkCommandHandler : IRequestHandler<PublishFrameworkCommand, PublicationResult>
{
    private readonly IFrameworkPublicationRepository _repository;
    public PublishFrameworkCommandHandler(IFrameworkPublicationRepository repository) => _repository = repository;

    public Task<PublicationResult> Handle(PublishFrameworkCommand request, CancellationToken cancellationToken)
    {
        Framework.NextRevision(request.ExpectedRevision);
        return _repository.PublishAsync(request.Id, request.ExpectedRevision!, request.Evidence, request.ActorId, request.CorrelationId, cancellationToken);
    }
}
