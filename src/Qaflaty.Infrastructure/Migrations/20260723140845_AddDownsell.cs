using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddDownsell : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "downsell_enabled",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "downsell_exclude_out_of_stock",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "downsell_max_shows_per_session",
                table: "store_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "downsell_min_interval_seconds",
                table: "store_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "downsell_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    event_type = table.Column<int>(type: "integer", nullable: false),
                    trigger_type = table.Column<int>(type: "integer", nullable: true),
                    session_key = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_downsell_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "downsell_offers",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    promo_code_id = table.Column<Guid>(type: "uuid", nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_downsell_offers", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "downsell_trigger_rules",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    trigger_type = table.Column<int>(type: "integer", nullable: false),
                    surface = table.Column<int>(type: "integer", nullable: false),
                    threshold_seconds = table.Column<int>(type: "integer", nullable: true),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    priority = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_downsell_trigger_rules", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_downsell_events_store_id_occurred_at",
                table: "downsell_events",
                columns: new[] { "store_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_downsell_offers_product_id",
                table: "downsell_offers",
                column: "product_id",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_downsell_trigger_rules_store_id_trigger_type_surface",
                table: "downsell_trigger_rules",
                columns: new[] { "store_id", "trigger_type", "surface" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "downsell_events");

            migrationBuilder.DropTable(
                name: "downsell_offers");

            migrationBuilder.DropTable(
                name: "downsell_trigger_rules");

            migrationBuilder.DropColumn(
                name: "downsell_enabled",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "downsell_exclude_out_of_stock",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "downsell_max_shows_per_session",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "downsell_min_interval_seconds",
                table: "store_configurations");
        }
    }
}
