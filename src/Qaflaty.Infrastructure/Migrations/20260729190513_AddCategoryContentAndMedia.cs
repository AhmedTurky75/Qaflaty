using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryContentAndMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

            migrationBuilder.AddColumn<string>(
                name: "icon_name",
                table: "categories",
                type: "character varying(50)",
                maxLength: 50,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "image_url",
                table: "categories",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

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
                name: "content_html",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "content_html_ar",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "icon_name",
                table: "categories");

            migrationBuilder.DropColumn(
                name: "image_url",
                table: "categories");
        }
    }
}
