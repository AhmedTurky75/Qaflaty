using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProductLandingPage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "product_id",
                table: "page_configurations",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_page_configurations_product_id",
                table: "page_configurations",
                column: "product_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_page_configurations_product_id",
                table: "page_configurations");

            migrationBuilder.DropColumn(
                name: "product_id",
                table: "page_configurations");
        }
    }
}
