using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

internal static class TestEmbeddingProfile
{
    public static OllamaEmbeddingOptions Options => new() { Model = "test-model", ModelDigest = new string('b', 64), Dimensions = 2 };
    public static string Key => Options.CompatibilityKey;
}
