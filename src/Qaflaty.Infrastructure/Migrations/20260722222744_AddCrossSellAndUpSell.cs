using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCrossSellAndUpSell : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_related_product_links_product_id",
                table: "related_product_links");

            migrationBuilder.DropIndex(
                name: "IX_related_product_links_product_id_related_product_id",
                table: "related_product_links");

            migrationBuilder.AddColumn<bool>(
                name: "cross_sell_enabled",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "cross_sell_exclude_out_of_stock",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "cross_sell_limit",
                table: "store_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "up_sell_enabled",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "up_sell_exclude_out_of_stock",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<int>(
                name: "up_sell_limit",
                table: "store_configurations",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "is_enabled",
                table: "related_product_links",
                type: "boolean",
                nullable: false,
                defaultValue: true);

            migrationBuilder.AddColumn<int>(
                name: "relation_type",
                table: "related_product_links",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_related_product_links_product_id_relation_type",
                table: "related_product_links",
                columns: new[] { "product_id", "relation_type" });

            migrationBuilder.CreateIndex(
                name: "IX_related_product_links_product_id_relation_type_related_prod~",
                table: "related_product_links",
                columns: new[] { "product_id", "relation_type", "related_product_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_related_product_links_product_id_relation_type",
                table: "related_product_links");

            migrationBuilder.DropIndex(
                name: "IX_related_product_links_product_id_relation_type_related_prod~",
                table: "related_product_links");

            migrationBuilder.DropColumn(
                name: "cross_sell_enabled",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "cross_sell_exclude_out_of_stock",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "cross_sell_limit",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "up_sell_enabled",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "up_sell_exclude_out_of_stock",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "up_sell_limit",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "is_enabled",
                table: "related_product_links");

            migrationBuilder.DropColumn(
                name: "relation_type",
                table: "related_product_links");

            migrationBuilder.CreateIndex(
                name: "IX_related_product_links_product_id",
                table: "related_product_links",
                column: "product_id");

            migrationBuilder.CreateIndex(
                name: "IX_related_product_links_product_id_related_product_id",
                table: "related_product_links",
                columns: new[] { "product_id", "related_product_id" },
                unique: true);
        }
    }
}
