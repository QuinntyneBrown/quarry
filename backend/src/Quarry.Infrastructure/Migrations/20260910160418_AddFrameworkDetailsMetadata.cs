using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddFrameworkDetailsMetadata : Migration
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
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "ComponentsJson",
                table: "FrameworkRevisions",
                type: "nvarchar(max)",
                maxLength: 16000,
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "UseCasesJson",
                table: "FrameworkRevisions",
                type: "nvarchar(4000)",
                maxLength: 4000,
                nullable: false,
                defaultValue: "[]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "CapabilitiesJson", table: "FrameworkRevisions");
            migrationBuilder.DropColumn(name: "ComponentsJson", table: "FrameworkRevisions");
            migrationBuilder.DropColumn(name: "UseCasesJson", table: "FrameworkRevisions");
        }
    }
}
