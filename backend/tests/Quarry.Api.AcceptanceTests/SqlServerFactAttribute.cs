namespace Quarry.Api.AcceptanceTests;

public sealed class SqlServerFactAttribute : FactAttribute
{
    public SqlServerFactAttribute()
    {
        if (string.IsNullOrWhiteSpace(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL")))
        {
            Skip = "Set QUARRY_TEST_SQL to run against SQL Server in a temporary database.";
        }
    }
}
