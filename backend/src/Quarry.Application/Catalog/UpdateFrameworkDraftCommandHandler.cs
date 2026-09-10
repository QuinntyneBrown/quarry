using MediatR;
using Quarry.Domain.Catalog;

namespace Quarry.Application.Catalog;

public sealed class UpdateFrameworkDraftCommandHandler : IRequestHandler<UpdateFrameworkDraftCommand, DraftUpdateResult>
{
    private readonly IFrameworkDraftRepository _repository;
    public UpdateFrameworkDraftCommandHandler(IFrameworkDraftRepository repository) => _repository = repository;

    public async Task<DraftUpdateResult> Handle(UpdateFrameworkDraftCommand request, CancellationToken cancellationToken)
    {
        if (request.Metadata is null)
            throw new FrameworkValidationException(new Dictionary<string, string[]> { ["metadata"] = ["Metadata is required."] });
        var framework = Framework.ReviseDraft(request.Id, request.ExpectedRevision, request.Metadata);
        var status = await _repository.UpdateAsync(framework, request.ExpectedRevision!, request.ActorId, request.CorrelationId, cancellationToken);
        return new DraftUpdateResult(status, status == DraftUpdateStatus.Updated
            ? new FrameworkDraft(framework.Id, framework.Revision, "draft", framework.ComponentCount, framework.Metadata) : null);
    }
}
