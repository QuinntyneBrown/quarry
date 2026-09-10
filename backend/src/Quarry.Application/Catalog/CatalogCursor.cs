using System.Text;

namespace Quarry.Application.Catalog;

public static class CatalogCursor
{
    public static string Encode(int offset)
    {
        return Convert.ToBase64String(Encoding.UTF8.GetBytes(offset.ToString(System.Globalization.CultureInfo.InvariantCulture)));
    }

    public static bool TryDecode(string? cursor, out int offset)
    {
        offset = 0;
        if (string.IsNullOrWhiteSpace(cursor))
        {
            return true;
        }

        try
        {
            return int.TryParse(Encoding.UTF8.GetString(Convert.FromBase64String(cursor)), System.Globalization.NumberStyles.None, System.Globalization.CultureInfo.InvariantCulture, out offset) && offset >= 0;
        }
        catch (FormatException)
        {
            return false;
        }
    }
}
