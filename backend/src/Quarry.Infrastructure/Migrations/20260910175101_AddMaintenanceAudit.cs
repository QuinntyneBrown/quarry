using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Quarry.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMaintenanceAudit : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "MaintenanceAuditRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ActorId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Operation = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: false),
                    Outcome = table.Column<string>(type: "nvarchar(40)", maxLength: 40, nullable: false),
                    CorrelationId = table.Column<string>(type: "nvarchar(128)", maxLength: 128, nullable: false),
                    InvalidatedVectorCount = table.Column<int>(type: "int", nullable: false),
                    RecordedAtUtc = table.Column<DateTimeOffset>(type: "datetimeoffset", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MaintenanceAuditRecords", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_MaintenanceAuditRecords_RecordedAtUtc",
                table: "MaintenanceAuditRecords",
                column: "RecordedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "MaintenanceAuditRecords");
        }
    }
}
