using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260702000002_AddBilingualNames")]
    public partial class AddBilingualNames : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Add the Arabic name columns (temporarily defaulted so existing rows satisfy NOT NULL),
            // then backfill them from the current single name so nothing renders blank.
            migrationBuilder.AddColumn<string>(
                name: "name_ar",
                table: "products",
                type: "character varying(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "name_ar",
                table: "categories",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.Sql("UPDATE products SET name_ar = name;");
            migrationBuilder.Sql("UPDATE categories SET name_ar = name;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "name_ar", table: "products");
            migrationBuilder.DropColumn(name: "name_ar", table: "categories");
        }
    }
}
