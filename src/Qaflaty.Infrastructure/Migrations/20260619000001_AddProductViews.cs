using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductViews : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "product_views",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    customer_id = table.Column<Guid>(type: "uuid", nullable: true),
                    session_id = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    viewed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_views", x => x.id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_product_views_store_id_viewed_at",
                table: "product_views",
                columns: new[] { "store_id", "viewed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_product_views_product_id_viewed_at",
                table: "product_views",
                columns: new[] { "product_id", "viewed_at" });

            migrationBuilder.CreateIndex(
                name: "IX_product_views_session_id",
                table: "product_views",
                column: "session_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_views_customer_id",
                table: "product_views",
                column: "customer_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "product_views");
        }
    }
}
