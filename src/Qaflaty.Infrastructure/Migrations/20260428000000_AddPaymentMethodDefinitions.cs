using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260428000000_AddPaymentMethodDefinitions")]
    public partial class AddPaymentMethodDefinitions : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.CreateIndex(
                name: "IX_payment_method_definitions_key",
                table: "payment_method_definitions",
                column: "key",
                unique: true);

            // Seed: COD and Visa only
            migrationBuilder.InsertData(
                table: "payment_method_definitions",
                columns: ["id", "key", "default_label", "default_description", "is_active", "sort_order"],
                values: new object[] { 1, "COD", "Cash on Delivery", "Pay when you receive your order", true, 1 });

            migrationBuilder.InsertData(
                table: "payment_method_definitions",
                columns: ["id", "key", "default_label", "default_description", "is_active", "sort_order"],
                values: new object[] { 2, "Visa", "Visa", "Pay with Visa card", true, 2 });
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "payment_method_definitions");
        }
    }
}
