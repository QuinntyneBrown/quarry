namespace Quarry.Api.AcceptanceTests;

public sealed class SqlOllamaFactAttribute : FactAttribute
{
    public SqlOllamaFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL"))
            || Environment.GetEnvironmentVariable("QUARRY_TEST_OLLAMA") != "1")
            Skip = "Set QUARRY_TEST_SQL and QUARRY_TEST_OLLAMA=1 to run the real SQL/Ollama integration check.";
    }
}
