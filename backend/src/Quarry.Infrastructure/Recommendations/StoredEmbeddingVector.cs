using System.Text.Json;

namespace Quarry.Infrastructure.Recommendations;

internal static class StoredEmbeddingVector
{
    public static float[]? Read(string json, int dimensions)
    {
        try
        {
            var values = JsonSerializer.Deserialize<float[]>(json);
            return values?.Length == dimensions && values.All(float.IsFinite) && values.Any(value => value != 0)
                ? values : null;
        }
        catch (JsonException) { return null; }
    }
}
