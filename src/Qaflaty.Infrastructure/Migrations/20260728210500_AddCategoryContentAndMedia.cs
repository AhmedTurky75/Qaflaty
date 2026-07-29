using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260728210500_AddCategoryContentAndMedia")]
    public partial class AddCategoryContentAndMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Bilingual HTML rendered above the product grid on the storefront category page.
            // Nullable together: both null means the merchant authored no content block.
            migrationBuilder.AddColumn<string>(
                name: "content_html",
                table: "categories",
                type: "character varying(20000)",
                maxLength: 20000,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "content_html_ar",
                table: "categories",
                type: "character varying(20000)",
                maxLength: 20000,
                nullable: true);

            // Category visual: an uploaded image, or a built-in glyph key when there is no image.
            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "categories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "icon_name",
                table: "categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            // Categories are always listed per store in merchant-assigned rank order.
            migrationBuilder.CreateIndex(
                name: "IX_categories_store_id_sort_order",
                table: "categories",
                columns: new[] { "store_id", "sort_order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_categories_store_id_sort_order",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "icon_name",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "content_html_ar",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "content_html",
                table: "categories");
        }
    }
}
