namespace Quarry.Application.Recommendations;

public static class FrameworkEmbeddingInput
{
    public const string Version = "quarry-embedding-v1";

    public static string ForQuery(string query)
    {
        return $"{Version}\nQuery: {query}";
    }

    public static string ForFramework(string description, IReadOnlyList<string> tags)
    {
        return $"{Version}\nDescription: {description}\nTags: {string.Join(", ", tags)}";
    }
}
