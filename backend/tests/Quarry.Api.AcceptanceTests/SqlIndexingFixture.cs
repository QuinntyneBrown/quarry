using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

namespace Quarry.Api.AcceptanceTests;

public sealed class SqlIndexingFixture : IAsyncDisposable
{
    private readonly DbContextOptions<QuarryDbContext> _options;
    public Guid FrameworkId { get; } = Guid.NewGuid();

    private SqlIndexingFixture()
    {
        var connection = new SqlConnectionStringBuilder(Environment.GetEnvironmentVariable("QUARRY_TEST_SQL"))
        {
            InitialCatalog = $"Quarry_Acceptance_{Guid.NewGuid():N}"
        };
        _options = new DbContextOptionsBuilder<QuarryDbContext>().UseSqlServer(connection.ConnectionString).Options;
    }

    public QuarryDbContext CreateContext() => new(_options);

    public static async Task<SqlIndexingFixture> CreateAsync()
    {
        var fixture = new SqlIndexingFixture();
        try
        {
            await using var database = fixture.CreateContext();
            await database.Database.MigrateAsync();
            database.FrameworkRevisions.Add(new FrameworkRevisionEntity
            {
                Id = fixture.FrameworkId, Name = "Indexing fixture", Description = "Scheduling controls", TagsJson = "[\"booking\"]",
                Technology = "React", Revision = "1", IsPublished = true
            });
            await database.SaveChangesAsync();
            await new SqlIndexWorkRepository(database).EnqueueMissingAsync(TestEmbeddingProfile.Key, CancellationToken.None);
            return fixture;
        }
        catch
        {
            await fixture.DisposeAsync();
            throw;
        }
    }

    public async ValueTask DisposeAsync()
    {
        await using var database = CreateContext();
        await database.Database.EnsureDeletedAsync();
    }
}
