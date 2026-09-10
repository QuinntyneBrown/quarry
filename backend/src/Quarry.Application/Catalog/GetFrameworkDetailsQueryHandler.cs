using MediatR;

namespace Quarry.Application.Catalog;

public sealed class GetFrameworkDetailsQueryHandler : IRequestHandler<GetFrameworkDetailsQuery, FrameworkDetails?>
{
    private readonly IFrameworkDetailsReader _detailsReader;

    public GetFrameworkDetailsQueryHandler(IFrameworkDetailsReader detailsReader)
    {
        _detailsReader = detailsReader;
    }

    public Task<FrameworkDetails?> Handle(GetFrameworkDetailsQuery request, CancellationToken cancellationToken)
    {
        return _detailsReader.GetAsync(request.Id, cancellationToken);
    }
}
