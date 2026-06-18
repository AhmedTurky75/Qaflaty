using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAiAssistantSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ai_assistant_name",
                table: "store_configurations",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "ai_disable_human_chat",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ai_enabled",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "ai_enabled_hours_end",
                table: "store_configurations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ai_enabled_hours_start",
                table: "store_configurations",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ai_language",
                table: "store_configurations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ai_max_conversation_length",
                table: "store_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "ai_personality",
                table: "store_configurations",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ai_welcome_message",
                table: "store_configurations",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "source",
                table: "orders",
                type: "character varying(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "ai_interaction_logs",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    event_type = table.Column<int>(type: "integer", nullable: false),
                    query = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    product_id = table.Column<Guid>(type: "uuid", nullable: true),
                    documents_retrieved = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ai_interaction_logs", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_ai_interaction_logs_store_created",
                table: "ai_interaction_logs",
                columns: new[] { "store_id", "created_at" });

            migrationBuilder.CreateIndex(
                name: "ix_ai_interaction_logs_store_type",
                table: "ai_interaction_logs",
                columns: new[] { "store_id", "event_type" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ai_interaction_logs");

            migrationBuilder.DropColumn(
                name: "ai_assistant_name",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_disable_human_chat",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_enabled",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_enabled_hours_end",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_enabled_hours_start",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_language",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_max_conversation_length",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_personality",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "ai_welcome_message",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "source",
                table: "orders");
        }
    }
}
