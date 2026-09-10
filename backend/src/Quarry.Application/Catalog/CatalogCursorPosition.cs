namespace Quarry.Application.Catalog;

public sealed record CatalogCursorPosition(string LastName, Guid LastId, string? Technology, string Revision);
