namespace Quarry.Infrastructure.Recommendations;

public sealed class OllamaEmbeddingOptions
{
    public const string SectionName = "Embeddings";

    public string Endpoint { get; set; } = "http://localhost:11434/";

    public string Model { get; set; } = "embeddinggemma:300m";
}
