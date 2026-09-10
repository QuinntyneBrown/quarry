using MediatR;

namespace Quarry.Application.Catalog;

public sealed class GetFrameworkDraftQueryHandler : IRequestHandler<GetFrameworkDraftQuery, FrameworkDraft?>
{
    private readonly IFrameworkDraftRepository _repository;
    public GetFrameworkDraftQueryHandler(IFrameworkDraftRepository repository) => _repository = repository;
    public Task<FrameworkDraft?> Handle(GetFrameworkDraftQuery request, CancellationToken cancellationToken) => _repository.GetAsync(request.Id, cancellationToken);
}
