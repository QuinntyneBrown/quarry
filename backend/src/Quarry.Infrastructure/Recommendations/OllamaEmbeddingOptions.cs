using Quarry.Application.Recommendations;
using System.Globalization;

namespace Quarry.Infrastructure.Recommendations;

public sealed class OllamaEmbeddingOptions
{
    public const string SectionName = "Embeddings";

    public string Endpoint { get; set; } = "http://localhost:11434/";

    public string Model { get; set; } = "embeddinggemma:300m";
    public string ModelDigest { get; set; } = "85462619ee721b466c5927d109d4cb765861907d5417b9109caebc4e614679f1";
    public int Dimensions { get; set; } = 768;

    public string CompatibilityKey
    {
        get
        {
            if (string.IsNullOrWhiteSpace(Model) || Model.Length > 100 || Model.Contains('@')
                || ModelDigest is not { Length: 64 } || !ModelDigest.All(Uri.IsHexDigit) || Dimensions is < 1 or > 4096)
                throw new InvalidOperationException("Configure a model name, a SHA-256 model digest, and 1–4096 dimensions.");
            return $"{Model}@{ModelDigest.ToLowerInvariant()}/{Dimensions.ToString(CultureInfo.InvariantCulture)}/{FrameworkEmbeddingInput.Version}";
        }
    }
}
