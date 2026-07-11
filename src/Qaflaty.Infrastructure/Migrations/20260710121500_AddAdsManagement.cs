using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAdsManagement : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "provider_integrations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    credentials_protected = table.Column<string>(type: "text", nullable: false),
                    browser_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    server_enabled = table.Column<bool>(type: "boolean", nullable: false),
                    health_score = table.Column<int>(type: "integer", nullable: false),
                    last_event_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_error_code = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    last_error_message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    last_verified_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_provider_integrations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tracking_events",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_key = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<string>(type: "text", nullable: false),
                    channel = table.Column<string>(type: "text", nullable: false),
                    order_id = table.Column<Guid>(type: "uuid", nullable: true),
                    customer_ref = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    payload_json = table.Column<string>(type: "jsonb", nullable: false),
                    correlation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tracking_events", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "tracking_dispatch_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    tracking_event_id = table.Column<Guid>(type: "uuid", nullable: false),
                    provider = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false),
                    attempt_count = table.Column<int>(type: "integer", nullable: false),
                    last_attempt_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    next_retry_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    duration_ms = table.Column<int>(type: "integer", nullable: true),
                    response_status = table.Column<int>(type: "integer", nullable: true),
                    response_body = table.Column<string>(type: "text", nullable: true),
                    error_message = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tracking_dispatch_logs", x => x.id);
                    table.ForeignKey(
                        name: "FK_tracking_dispatch_logs_tracking_events_tracking_event_id",
                        column: x => x.tracking_event_id,
                        principalTable: "tracking_events",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_provider_integrations_store_id_provider",
                table: "provider_integrations",
                columns: new[] { "store_id", "provider" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_tracking_dispatch_logs_next_retry_at",
                table: "tracking_dispatch_logs",
                column: "next_retry_at");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_dispatch_logs_status",
                table: "tracking_dispatch_logs",
                column: "status");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_dispatch_logs_tracking_event_id",
                table: "tracking_dispatch_logs",
                column: "tracking_event_id");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_events_correlation_id",
                table: "tracking_events",
                column: "correlation_id");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_events_created_at",
                table: "tracking_events",
                column: "created_at");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_events_order_id",
                table: "tracking_events",
                column: "order_id");

            migrationBuilder.CreateIndex(
                name: "IX_tracking_events_store_id_event_key_channel",
                table: "tracking_events",
                columns: new[] { "store_id", "event_key", "channel" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "provider_integrations");

            migrationBuilder.DropTable(
                name: "tracking_dispatch_logs");

            migrationBuilder.DropTable(
                name: "tracking_events");
        }
    }
}
