namespace Quarry.Application.Catalog;

public sealed record DraftUpdateResult(DraftUpdateStatus Status, FrameworkDraft? Draft);
