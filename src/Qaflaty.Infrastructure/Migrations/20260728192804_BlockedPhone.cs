using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class BlockedPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "block_reason",
                table: "orders",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.CreateTable(
                name: "blocked_phones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    phone_country_code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: true),
                    phone = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reason = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    blocked_by = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    source_order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    blocked_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_blocked_phones", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_blocked_phones_phone",
                table: "blocked_phones",
                column: "phone");

            migrationBuilder.CreateIndex(
                name: "IX_blocked_phones_store_id",
                table: "blocked_phones",
                column: "store_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "blocked_phones");

            migrationBuilder.DropColumn(
                name: "block_reason",
                table: "orders");
        }
    }
}
