using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddSearchSettingsToStoreConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "search_enable_text",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_category",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_price",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_properties",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "search_filterable_property_ids",
                table: "store_configurations",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<string>(
                name: "search_allowed_sort_options",
                table: "store_configurations",
                type: "jsonb",
                nullable: false,
                defaultValue: "[\"Newest\",\"PriceAsc\",\"PriceDesc\"]");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "search_enable_text", table: "store_configurations");
            migrationBuilder.DropColumn(name: "search_enable_category", table: "store_configurations");
            migrationBuilder.DropColumn(name: "search_enable_price", table: "store_configurations");
            migrationBuilder.DropColumn(name: "search_enable_properties", table: "store_configurations");
            migrationBuilder.DropColumn(name: "search_filterable_property_ids", table: "store_configurations");
            migrationBuilder.DropColumn(name: "search_allowed_sort_options", table: "store_configurations");
        }
    }
}
