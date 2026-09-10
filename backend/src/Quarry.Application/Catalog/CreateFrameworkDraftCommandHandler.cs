using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed class CreateFrameworkDraftCommandHandler : IRequestHandler<CreateFrameworkDraftCommand, FrameworkDraft?>
{
    private readonly IFrameworkDraftRepository _repository;
    public CreateFrameworkDraftCommandHandler(IFrameworkDraftRepository repository) => _repository = repository;

    public async Task<FrameworkDraft?> Handle(CreateFrameworkDraftCommand request, CancellationToken cancellationToken)
    {
        var framework = Framework.CreateDraft(request.Id, request.Metadata);
        var created = await _repository.CreateAsync(framework, request.ActorId, request.CorrelationId, cancellationToken);
        return created ? new FrameworkDraft(framework.Id, framework.Revision, "draft", framework.ComponentCount, framework.Metadata) : null;
    }
}
