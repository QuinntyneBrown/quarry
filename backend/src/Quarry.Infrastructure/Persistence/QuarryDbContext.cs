using Microsoft.EntityFrameworkCore;

namespace Quarry.Infrastructure.Persistence;

public sealed class QuarryDbContext : DbContext
{
    public QuarryDbContext(DbContextOptions<QuarryDbContext> options)
        : base(options)
    {
    }

    public DbSet<FrameworkRevisionEntity> FrameworkRevisions => Set<FrameworkRevisionEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var framework = modelBuilder.Entity<FrameworkRevisionEntity>();
        framework.ToTable("FrameworkRevisions");
        framework.HasKey(item => item.Id);
        framework.Property(item => item.Name).HasMaxLength(200).IsRequired();
        framework.Property(item => item.Description).HasMaxLength(4000).IsRequired();
        framework.Property(item => item.Technology).HasMaxLength(50).IsRequired();
        framework.Property(item => item.TagsJson).HasMaxLength(4000).IsRequired();
        framework.Property(item => item.CapabilitiesJson).HasMaxLength(8000).IsRequired();
        framework.Property(item => item.UseCasesJson).HasMaxLength(4000).IsRequired();
        framework.Property(item => item.ComponentsJson).HasMaxLength(16000).IsRequired();
        framework.Property(item => item.Revision).HasMaxLength(30).IsRequired();
        framework.HasIndex(item => new { item.IsPublished, item.Technology, item.Name });
    }
}
