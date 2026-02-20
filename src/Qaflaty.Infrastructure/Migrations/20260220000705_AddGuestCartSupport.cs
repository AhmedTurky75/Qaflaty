using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGuestCartSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_carts_customer_id",
                table: "carts");

            migrationBuilder.AlterColumn<Guid>(
                name: "customer_id",
                table: "carts",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AddColumn<string>(
                name: "guest_id",
                table: "carts",
                type: "character varying(36)",
                maxLength: 36,
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "store_id",
                table: "carts",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_carts_customer_id",
                table: "carts",
                column: "customer_id",
                unique: true,
                filter: "customer_id IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_carts_guest_id_store_id",
                table: "carts",
                columns: new[] { "guest_id", "store_id" },
                unique: true,
                filter: "guest_id IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_carts_customer_id",
                table: "carts");

            migrationBuilder.DropIndex(
                name: "IX_carts_guest_id_store_id",
                table: "carts");

            migrationBuilder.DropColumn(
                name: "guest_id",
                table: "carts");

            migrationBuilder.DropColumn(
                name: "store_id",
                table: "carts");

            migrationBuilder.AlterColumn<Guid>(
                name: "customer_id",
                table: "carts",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_carts_customer_id",
                table: "carts",
                column: "customer_id",
                unique: true);
        }
    }
}
