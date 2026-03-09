using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AuthOverhaul_Phase0to5 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "full_name",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "full_name",
                table: "customers");

            migrationBuilder.RenameColumn(
                name: "full_name",
                table: "store_customers",
                newName: "secondary_phone");

            migrationBuilder.AlterColumn<string>(
                name: "secondary_phone",
                table: "store_customers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(100)",
                oldMaxLength: 100);

            migrationBuilder.AddColumn<string>(
                name: "first_name",
                table: "store_customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "last_name",
                table: "store_customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "store_customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "first_name",
                table: "merchants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "last_name",
                table: "merchants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "username",
                table: "merchants",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "first_name",
                table: "customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "last_name",
                table: "customers",
                type: "character varying(50)",
                maxLength: 50,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "cities",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    country_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_cities", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "countries",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    code = table.Column<string>(type: "character varying(2)", maxLength: 2, nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_countries", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "login_otps",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    code = table.Column<string>(type: "character varying(6)", maxLength: 6, nullable: false),
                    purpose = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_used = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    attempt_count = table.Column<int>(type: "integer", nullable: false, defaultValue: 0)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_login_otps", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "merchant_store_assignments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    merchant_id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    role = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    invited_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_merchant_store_assignments", x => x.id);
                    table.ForeignKey(
                        name: "FK_merchant_store_assignments_merchants_merchant_id",
                        column: x => x.merchant_id,
                        principalTable: "merchants",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "cities",
                columns: new[] { "id", "country_id", "is_active", "name" },
                values: new object[,]
                {
                    { 1, 1, true, "Riyadh" },
                    { 2, 1, true, "Jeddah" },
                    { 3, 1, true, "Mecca" },
                    { 4, 1, true, "Medina" },
                    { 5, 1, true, "Dammam" },
                    { 6, 1, true, "Khobar" },
                    { 7, 2, true, "Dubai" },
                    { 8, 2, true, "Abu Dhabi" },
                    { 9, 2, true, "Sharjah" },
                    { 10, 2, true, "Ajman" },
                    { 11, 3, true, "Kuwait City" },
                    { 12, 3, true, "Hawalli" },
                    { 13, 3, true, "Salmiya" },
                    { 14, 4, true, "Doha" },
                    { 15, 4, true, "Al Wakrah" },
                    { 16, 5, true, "Manama" },
                    { 17, 5, true, "Riffa" },
                    { 18, 6, true, "Muscat" },
                    { 19, 6, true, "Salalah" },
                    { 20, 6, true, "Sohar" }
                });

            migrationBuilder.InsertData(
                table: "countries",
                columns: new[] { "id", "code", "is_active", "name" },
                values: new object[,]
                {
                    { 1, "SA", true, "Saudi Arabia" },
                    { 2, "AE", true, "United Arab Emirates" },
                    { 3, "KW", true, "Kuwait" },
                    { 4, "QA", true, "Qatar" },
                    { 5, "BH", true, "Bahrain" },
                    { 6, "OM", true, "Oman" }
                });

            migrationBuilder.CreateIndex(
                name: "IX_store_customers_username",
                table: "store_customers",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_merchants_username",
                table: "merchants",
                column: "username",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_cities_country_id",
                table: "cities",
                column: "country_id");

            migrationBuilder.CreateIndex(
                name: "IX_countries_code",
                table: "countries",
                column: "code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_login_otps_email_purpose",
                table: "login_otps",
                columns: new[] { "email", "purpose" });

            migrationBuilder.CreateIndex(
                name: "IX_merchant_store_assignments_merchant_id_store_id",
                table: "merchant_store_assignments",
                columns: new[] { "merchant_id", "store_id" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "cities");

            migrationBuilder.DropTable(
                name: "countries");

            migrationBuilder.DropTable(
                name: "login_otps");

            migrationBuilder.DropTable(
                name: "merchant_store_assignments");

            migrationBuilder.DropIndex(
                name: "IX_store_customers_username",
                table: "store_customers");

            migrationBuilder.DropIndex(
                name: "IX_merchants_username",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "first_name",
                table: "store_customers");

            migrationBuilder.DropColumn(
                name: "last_name",
                table: "store_customers");

            migrationBuilder.DropColumn(
                name: "username",
                table: "store_customers");

            migrationBuilder.DropColumn(
                name: "first_name",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "last_name",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "username",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "first_name",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "last_name",
                table: "customers");

            migrationBuilder.RenameColumn(
                name: "secondary_phone",
                table: "store_customers",
                newName: "full_name");

            migrationBuilder.AlterColumn<string>(
                name: "full_name",
                table: "store_customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "",
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "full_name",
                table: "merchants",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "full_name",
                table: "customers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}
