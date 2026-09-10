using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;

namespace Quarry.Infrastructure.Persistence;

public sealed class QuarryDbContextFactory : IDesignTimeDbContextFactory<QuarryDbContext>
{
    public QuarryDbContext CreateDbContext(string[] args)
    {
        var options = new DbContextOptionsBuilder<QuarryDbContext>();
        options.UseSqlServer(Environment.GetEnvironmentVariable("ConnectionStrings__QuarryMigrations")
            ?? Environment.GetEnvironmentVariable("ConnectionStrings__Quarry")
            ?? "Server=.\\SQLEXPRESS;Database=Quarry;Trusted_Connection=True;TrustServerCertificate=True;");
        return new QuarryDbContext(options.Options);
    }
}
