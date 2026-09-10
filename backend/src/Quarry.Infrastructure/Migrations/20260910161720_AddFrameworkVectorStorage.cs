using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFrameworkVectorStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CapabilitiesJson",
                table: "FrameworkRevisions",
                type: "nvarchar(max)",
                maxLength: 8000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ComponentsJson",
                table: "FrameworkRevisions",
                type: "nvarchar(max)",
                maxLength: 16000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "UseCasesJson",
                table: "FrameworkRevisions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "FrameworkVectors",
                columns: table => new
                {
                    FrameworkId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SourceRevision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    Model = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Dimensions = table.Column<int>(type: "int", nullable: false),
                    ValuesJson = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IndexedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FrameworkVectors", x => x.FrameworkId);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FrameworkVectors_Model_Dimensions",
                table: "FrameworkVectors",
                columns: new[] { "Model", "Dimensions" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FrameworkVectors");

            migrationBuilder.DropColumn(
                name: "CapabilitiesJson",
                table: "FrameworkRevisions");

            migrationBuilder.DropColumn(
                name: "ComponentsJson",
                table: "FrameworkRevisions");

            migrationBuilder.DropColumn(
                name: "UseCasesJson",
                table: "FrameworkRevisions");
        }
    }
}
