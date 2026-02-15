using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddLiveChat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "chat_conversations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    guest_session_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    closed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    last_message_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    unread_merchant_messages = table.Column<int>(type: "integer", nullable: false),
                    unread_customer_messages = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_conversations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "chat_messages",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    conversation_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sender_type = table.Column<int>(type: "integer", nullable: false),
                    sender_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    content = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    sent_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_chat_messages", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "ix_chat_conversations_customer_id",
                table: "chat_conversations",
                column: "customer_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_conversations_store_guest",
                table: "chat_conversations",
                columns: new[] { "store_id", "guest_session_id" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_conversations_store_id",
                table: "chat_conversations",
                column: "store_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_conversations_store_status_lastmessage",
                table: "chat_conversations",
                columns: new[] { "store_id", "status", "last_message_at" });

            migrationBuilder.CreateIndex(
                name: "ix_chat_messages_conversation_id",
                table: "chat_messages",
                column: "conversation_id");

            migrationBuilder.CreateIndex(
                name: "ix_chat_messages_conversation_sent",
                table: "chat_messages",
                columns: new[] { "conversation_id", "sent_at" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "chat_conversations");

            migrationBuilder.DropTable(
                name: "chat_messages");
        }
    }
}
