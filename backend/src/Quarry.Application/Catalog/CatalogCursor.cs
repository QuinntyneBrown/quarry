using System.Text.Json;

namespace Quarry.Application.Catalog;

public static class CatalogCursor
{
    public static string Encode(CatalogCursorPosition position) => Convert.ToBase64String(JsonSerializer.SerializeToUtf8Bytes(position));

    public static bool IsValidRevision(string value) => value.Length is > 0 and <= 30
        && (value == "0" || value[0] != '0') && value.All(character => character is >= '0' and <= '9');

    public static bool TryDecode(string? cursor, out CatalogCursorPosition? position)
    {
        position = null;
        if (cursor is null)
        {
            return true;
        }

        try
        {
            if (cursor.Length is 0 or > 4096) return false;
            position = JsonSerializer.Deserialize<CatalogCursorPosition>(Convert.FromBase64String(cursor));
            return position is { LastName.Length: > 0 and <= 200, Revision: not null } && position.LastId != Guid.Empty
                && IsValidRevision(position.Revision)
                && position.Technology is null or "React" or "Angular" or "Vue" or "Web Components";
        }
        catch (Exception error) when (error is FormatException or JsonException)
        {
            return false;
        }
    }
}
