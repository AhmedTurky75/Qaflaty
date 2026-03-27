using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddAddressZoneIds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "city_id",
                table: "customer_addresses",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "country_code",
                table: "customer_addresses",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "district_id",
                table: "customer_addresses",
                type: "integer",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "city_id",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "country_code",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "district_id",
                table: "customer_addresses");
        }
    }
}
