using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddManualRelatedProducts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "related_products_manual",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "related_product_links",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    related_product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_related_product_links", x => x.id);
                });

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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "related_product_links");

            migrationBuilder.DropColumn(
                name: "related_products_manual",
                table: "store_configurations");
        }
    }
}
