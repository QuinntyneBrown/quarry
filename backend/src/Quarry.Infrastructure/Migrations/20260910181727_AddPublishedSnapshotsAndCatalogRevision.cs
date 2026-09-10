using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPublishedSnapshotsAndCatalogRevision : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "UseCasesJson",
                table: "FrameworkRevisions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000);

            migrationBuilder.AlterColumn<string>(
                name: "TagsJson",
                table: "FrameworkRevisions",
                type: "nvarchar(max)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(4000)",
                oldMaxLength: 4000);

            migrationBuilder.CreateTable(
                name: "CatalogState",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false),
                    Revision = table.Column<long>(type: "bigint", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CatalogState", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "PublishedFrameworkSnapshots",
                columns: table => new
                {
                    FrameworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Revision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    MetadataJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EvidenceJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PublishedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PublishedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PublishedFrameworkSnapshots", x => new { x.FrameworkId, x.Revision });
                });

            migrationBuilder.Sql("""
                CREATE TRIGGER ProtectPublishedFrameworkSnapshots
                ON PublishedFrameworkSnapshots
                INSTEAD OF UPDATE, DELETE
                AS
                BEGIN
                    THROW 51000, 'Published framework snapshots are immutable.', 1;
                END;
                """);

            migrationBuilder.InsertData(
                table: "CatalogState",
                columns: new[] { "Id", "Revision" },
                values: new object[] { 1, 0L });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CatalogState");

            migrationBuilder.DropTable(
                name: "PublishedFrameworkSnapshots");

            migrationBuilder.AlterColumn<string>(
                name: "UseCasesJson",
                table: "FrameworkRevisions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");

            migrationBuilder.AlterColumn<string>(
                name: "TagsJson",
                table: "FrameworkRevisions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)");
        }
    }
}
