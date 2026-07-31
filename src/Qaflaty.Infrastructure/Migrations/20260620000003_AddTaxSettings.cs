using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260620000003_AddTaxSettings")]
    public partial class AddTaxSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Order pricing tax
            migrationBuilder.AddColumn<decimal>(
                name: "tax_amount",
                table: "orders",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "tax_currency",
                table: "orders",
                type: "text",
                nullable: false,
                defaultValue: "SAR");

            migrationBuilder.AddColumn<decimal>(
                name: "tax_rate",
                table: "orders",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "prices_include_tax",
                table: "orders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Store-level tax configuration
            migrationBuilder.AddColumn<bool>(
                name: "tax_enabled",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<decimal>(
                name: "tax_rate",
                table: "store_configurations",
                type: "decimal(5,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<bool>(
                name: "tax_prices_include",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "tax_label",
                table: "store_configurations",
                type: "character varying(30)",
                maxLength: 30,
                nullable: false,
                defaultValue: "VAT");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "tax_amount", table: "orders");
            migrationBuilder.DropColumn(name: "tax_currency", table: "orders");
            migrationBuilder.DropColumn(name: "tax_rate", table: "orders");
            migrationBuilder.DropColumn(name: "prices_include_tax", table: "orders");
            migrationBuilder.DropColumn(name: "tax_enabled", table: "store_configurations");
            migrationBuilder.DropColumn(name: "tax_rate", table: "store_configurations");
            migrationBuilder.DropColumn(name: "tax_prices_include", table: "store_configurations");
            migrationBuilder.DropColumn(name: "tax_label", table: "store_configurations");
        }
    }
}
