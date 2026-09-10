using MediatR;

namespace Quarry.Application.Recommendations;

public sealed class RebuildFrameworkSearchIndexCommandHandler : IRequestHandler<RebuildFrameworkSearchIndexCommand>
{
    private readonly IFrameworkSearchIndexMaintenance _maintenance;

    public RebuildFrameworkSearchIndexCommandHandler(IFrameworkSearchIndexMaintenance maintenance)
    {
        _maintenance = maintenance;
    }

    public Task Handle(RebuildFrameworkSearchIndexCommand request, CancellationToken cancellationToken)
    {
        return _maintenance.RebuildAsync(cancellationToken);
    }
}
