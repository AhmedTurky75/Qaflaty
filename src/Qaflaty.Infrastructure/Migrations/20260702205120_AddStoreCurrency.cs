using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "delivery_fee_currency",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "refund_currency",
                table: "return_requests");

            migrationBuilder.DropColumn(
                name: "unit_price_currency",
                table: "return_request_items");

            migrationBuilder.DropColumn(
                name: "compare_at_price_currency",
                table: "products");

            migrationBuilder.DropColumn(
                name: "price_currency",
                table: "products");

            migrationBuilder.DropColumn(
                name: "price_override_currency",
                table: "product_variants");

            migrationBuilder.DropColumn(
                name: "delivery_fee_currency",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "discount_currency",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "subtotal_currency",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "tax_currency",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "total_currency",
                table: "orders");

            migrationBuilder.DropColumn(
                name: "unit_price_currency",
                table: "order_items");

            migrationBuilder.DropColumn(
                name: "fee_currency",
                table: "delivery_zones");

            migrationBuilder.DropColumn(
                name: "free_delivery_threshold_currency",
                table: "stores");

            // The store's single currency (set once, then locked). Existing stores default to EGP.
            migrationBuilder.AddColumn<string>(
                name: "currency",
                table: "stores",
                type: "character varying(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "EGP");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "currency",
                table: "stores");

            migrationBuilder.AddColumn<string>(
                name: "free_delivery_threshold_currency",
                table: "stores",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "delivery_fee_currency",
                table: "stores",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "refund_currency",
                table: "return_requests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "unit_price_currency",
                table: "return_request_items",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "compare_at_price_currency",
                table: "products",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "price_currency",
                table: "products",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "price_override_currency",
                table: "product_variants",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "delivery_fee_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "discount_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "subtotal_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "tax_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "total_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "unit_price_currency",
                table: "order_items",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "fee_currency",
                table: "delivery_zones",
                type: "character varying(3)",
                maxLength: 3,
                nullable: true);
        }
    }
}
