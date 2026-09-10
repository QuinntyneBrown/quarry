using Microsoft.EntityFrameworkCore;

namespace Quarry.Infrastructure.Persistence;

public sealed class QuarryDbContext : DbContext
{
    public QuarryDbContext(DbContextOptions<QuarryDbContext> options)
        : base(options)
    {
    }

    public DbSet<FrameworkRevisionEntity> FrameworkRevisions => Set<FrameworkRevisionEntity>();

    public DbSet<FrameworkVectorEntity> FrameworkVectors => Set<FrameworkVectorEntity>();

    public DbSet<MaintenanceAuditRecordEntity> MaintenanceAuditRecords => Set<MaintenanceAuditRecordEntity>();

    public DbSet<IndexWorkItemEntity> IndexWorkItems => Set<IndexWorkItemEntity>();

    public DbSet<FrameworkDraftEntity> FrameworkDrafts => Set<FrameworkDraftEntity>();
    public DbSet<PublishedFrameworkSnapshotEntity> PublishedFrameworkSnapshots => Set<PublishedFrameworkSnapshotEntity>();
    public DbSet<CatalogStateEntity> CatalogState => Set<CatalogStateEntity>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var framework = modelBuilder.Entity<FrameworkRevisionEntity>();
        framework.ToTable("FrameworkRevisions");
        framework.HasKey(item => item.Id);
        framework.Property(item => item.Name).HasMaxLength(200).IsRequired();
        framework.Property(item => item.Description).HasMaxLength(4000).IsRequired();
        framework.Property(item => item.Technology).HasMaxLength(50).IsRequired();
        framework.Property(item => item.TagsJson).HasColumnType("nvarchar(max)").IsRequired();
        framework.Property(item => item.CapabilitiesJson).HasMaxLength(8000).IsRequired();
        framework.Property(item => item.UseCasesJson).HasColumnType("nvarchar(max)").IsRequired();
        framework.Property(item => item.ComponentsJson).HasMaxLength(16000).IsRequired();
        framework.Property(item => item.PreviewJson).HasColumnType("nvarchar(max)");
        framework.Property(item => item.Revision).HasMaxLength(30).IsRequired();
        framework.HasIndex(item => new { item.IsPublished, item.Technology, item.Name });

        var vector = modelBuilder.Entity<FrameworkVectorEntity>();
        vector.ToTable("FrameworkVectors");
        vector.HasKey(item => item.FrameworkId);
        vector.Property(item => item.SourceRevision).HasMaxLength(30).IsRequired();
        vector.Property(item => item.Model).HasMaxLength(200).IsRequired();
        vector.Property(item => item.ValuesJson).HasColumnType("nvarchar(max)").IsRequired();
        vector.HasIndex(item => new { item.Model, item.Dimensions });

        var audit = modelBuilder.Entity<MaintenanceAuditRecordEntity>();
        audit.ToTable("MaintenanceAuditRecords");
        audit.HasKey(item => item.Id);
        audit.Property(item => item.ActorId).IsRequired();
        audit.Property(item => item.Operation).HasMaxLength(100).IsRequired();
        audit.Property(item => item.Outcome).HasMaxLength(40).IsRequired();
        audit.Property(item => item.CorrelationId).HasMaxLength(128).IsRequired();
        audit.Property(item => item.SourceRevision).HasMaxLength(30);
        audit.HasIndex(item => item.RecordedAtUtc);

        var work = modelBuilder.Entity<IndexWorkItemEntity>();
        work.ToTable("IndexWorkItems");
        work.HasKey(item => item.Id);
        work.Property(item => item.SourceRevision).HasMaxLength(30).IsRequired();
        work.Property(item => item.Model).HasMaxLength(200).IsRequired();
        work.Property(item => item.State).HasMaxLength(20).IsRequired();
        work.Property(item => item.LastError).HasMaxLength(100);
        work.HasIndex(item => new { item.FrameworkId, item.SourceRevision, item.Model }).IsUnique();
        work.HasIndex(item => new { item.State, item.NextAttemptAtUtc });

        var draft = modelBuilder.Entity<FrameworkDraftEntity>();
        draft.ToTable("FrameworkDrafts");
        draft.HasKey(item => item.Id);
        draft.Property(item => item.Revision).HasMaxLength(30).IsRequired();
        draft.Property(item => item.MetadataJson).IsRequired();

        var snapshot = modelBuilder.Entity<PublishedFrameworkSnapshotEntity>();
        snapshot.ToTable("PublishedFrameworkSnapshots");
        snapshot.HasKey(item => new { item.FrameworkId, item.Revision });
        snapshot.Property(item => item.Revision).HasMaxLength(30).IsRequired();
        snapshot.Property(item => item.MetadataJson).IsRequired();
        snapshot.Property(item => item.EvidenceJson).IsRequired();
        snapshot.Property(item => item.PublishedBy).IsRequired();

        var catalog = modelBuilder.Entity<CatalogStateEntity>();
        catalog.ToTable("CatalogState");
        catalog.HasKey(item => item.Id);
        catalog.Property(item => item.Id).ValueGeneratedNever();
        catalog.HasData(new CatalogStateEntity { Id = 1, Revision = 0 });
    }
}
