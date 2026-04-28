using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPaymentMethodDefinitionsAddAccessDeniedReportsAddPaymentMethodAdjustmentIsEnabled : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<bool>(
                name: "auth_require_otp_on_place_order",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                oldClrType: typeof(bool),
                oldType: "boolean",
                oldDefaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "is_enabled",
                table: "payment_method_adjustments",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "access_denied_reports",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    user_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    endpoint = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    reported_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_reviewed = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_access_denied_reports", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_method_definitions",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    key = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    default_label = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    default_description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_method_definitions", x => x.id);
                });

            migrationBuilder.InsertData(
                table: "payment_method_definitions",
                columns: new[] { "id", "default_description", "default_label", "is_active", "key", "sort_order" },
                values: new object[,]
                {
                    { 1, "Pay when you receive your order", "Cash on Delivery", true, "COD", 1 },
                    { 2, "Pay with Visa card", "Visa", true, "Visa", 2 }
                });

            migrationBuilder.CreateIndex(
                name: "IX_access_denied_reports_reported_at",
                table: "access_denied_reports",
                column: "reported_at");

            migrationBuilder.CreateIndex(
                name: "IX_access_denied_reports_user_id",
                table: "access_denied_reports",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_payment_method_definitions_key",
                table: "payment_method_definitions",
                column: "key",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "access_denied_reports");

            migrationBuilder.DropTable(
                name: "payment_method_definitions");

            migrationBuilder.DropColumn(
                name: "is_enabled",
                table: "payment_method_adjustments");

            migrationBuilder.AlterColumn<bool>(
                name: "auth_require_otp_on_place_order",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false,
                oldClrType: typeof(bool),
                oldType: "boolean");
        }
    }
}
