using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDatabaseAccessRoles : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                CREATE ROLE QuarryRead;
                GRANT SELECT ON dbo.FrameworkRevisions TO QuarryRead;
                GRANT SELECT ON dbo.FrameworkVectors TO QuarryRead;
                GRANT SELECT ON dbo.CatalogState TO QuarryRead;
                GRANT SELECT ON dbo.IndexWorkItems TO QuarryRead;
                GRANT SELECT (FrameworkId, Revision, PublishedAtUtc) ON dbo.PublishedFrameworkSnapshots TO QuarryRead;

                CREATE ROLE QuarryMaintenance;
                GRANT SELECT, INSERT, UPDATE ON dbo.FrameworkDrafts TO QuarryMaintenance;
                GRANT SELECT, INSERT, UPDATE ON dbo.FrameworkRevisions TO QuarryMaintenance;
                GRANT SELECT, UPDATE ON dbo.CatalogState TO QuarryMaintenance;
                GRANT SELECT, INSERT ON dbo.PublishedFrameworkSnapshots TO QuarryMaintenance;
                GRANT SELECT, INSERT ON dbo.MaintenanceAuditRecords TO QuarryMaintenance;
                GRANT SELECT, INSERT, UPDATE ON dbo.IndexWorkItems TO QuarryMaintenance;
                GRANT SELECT, DELETE ON dbo.FrameworkVectors TO QuarryMaintenance;

                CREATE ROLE QuarryWorker;
                GRANT SELECT ON dbo.FrameworkRevisions TO QuarryWorker;
                GRANT SELECT, INSERT, DELETE ON dbo.FrameworkVectors TO QuarryWorker;
                GRANT SELECT, INSERT, UPDATE ON dbo.IndexWorkItems TO QuarryWorker;
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DROP ROLE QuarryWorker; DROP ROLE QuarryMaintenance; DROP ROLE QuarryRead;");
        }
    }
}
