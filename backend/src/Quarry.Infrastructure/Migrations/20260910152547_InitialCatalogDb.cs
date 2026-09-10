using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCatalogDb : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "FrameworkRevisions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(200)", maxLength: 200, nullable: false),
                    Description = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    Technology = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    TagsJson = table.Column<string>(type: "nvarchar(4000)", maxLength: 4000, nullable: false),
                    ComponentCount = table.Column<int>(type: "int", nullable: false),
                    Revision = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsPublished = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FrameworkRevisions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_FrameworkRevisions_IsPublished_Technology_Name",
                table: "FrameworkRevisions",
                columns: new[] { "IsPublished", "Technology", "Name" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "FrameworkRevisions");
        }
    }
}
