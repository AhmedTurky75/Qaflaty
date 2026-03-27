using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerAddressesAndPlatformFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "apple_touch_icon_url",
                table: "stores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "favicon_url",
                table: "stores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "og_image_url",
                table: "stores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "secondary_color",
                table: "stores",
                type: "character varying(7)",
                maxLength: 7,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "secondary_logo_url",
                table: "stores",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "secondary_phone",
                table: "store_customers",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "store_customers",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_country_code",
                table: "store_customers",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "secondary_phone_country_code",
                table: "store_customers",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "auth_require_otp_on_place_order",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "search_allowed_sort_options",
                table: "store_configurations",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_category",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_price",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_properties",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "search_enable_text",
                table: "store_configurations",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "search_filterable_property_ids",
                table: "store_configurations",
                type: "jsonb",
                nullable: false,
                defaultValue: "[]");

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "merchants",
                type: "character varying(25)",
                maxLength: 25,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(20)",
                oldMaxLength: 20,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "phone_country_code",
                table: "merchants",
                type: "character varying(2)",
                maxLength: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Contact_Phone_CountryCode",
                table: "customers",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "deleted_at",
                table: "customer_addresses",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "is_deleted",
                table: "customer_addresses",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "delivery_zones",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    level = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    reference_id = table.Column<int>(type: "integer", nullable: false),
                    is_delivery_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    custom_delivery_fee = table.Column<decimal>(type: "numeric(10,2)", nullable: true),
                    fee_currency = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_delivery_zones", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "districts",
                columns: table => new
                {
                    id = table.Column<int>(type: "integer", nullable: false),
                    city_id = table.Column<int>(type: "integer", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    name_ar = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_districts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "payment_method_adjustments",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    payment_method = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    adjustment_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    value = table.Column<decimal>(type: "numeric(10,4)", nullable: false),
                    display_label = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    store_configuration_id = table.Column<Guid>(type: "uuid", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_payment_method_adjustments", x => x.id);
                    table.ForeignKey(
                        name: "FK_payment_method_adjustments_store_configurations_store_confi~",
                        column: x => x.store_configuration_id,
                        principalTable: "store_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "product_property_definitions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    display_name = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    type = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false),
                    options = table.Column<string>(type: "jsonb", nullable: false),
                    is_required = table.Column<bool>(type: "boolean", nullable: false),
                    is_filterable = table.Column<bool>(type: "boolean", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_property_definitions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "product_property_values",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    product_id = table.Column<Guid>(type: "uuid", nullable: false),
                    definition_id = table.Column<Guid>(type: "uuid", nullable: false),
                    value = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_product_property_values", x => x.id);
                    table.ForeignKey(
                        name: "FK_product_property_values_products_product_id",
                        column: x => x.product_id,
                        principalTable: "products",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_delivery_zones_store_id_level_reference_id",
                table: "delivery_zones",
                columns: new[] { "store_id", "level", "reference_id" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_districts_city_id",
                table: "districts",
                column: "city_id");

            migrationBuilder.CreateIndex(
                name: "IX_payment_method_adjustments_store_configuration_id",
                table: "payment_method_adjustments",
                column: "store_configuration_id");

            migrationBuilder.CreateIndex(
                name: "IX_product_property_definitions_store_id_name",
                table: "product_property_definitions",
                columns: new[] { "store_id", "name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_product_property_values_product_id_definition_id",
                table: "product_property_values",
                columns: new[] { "product_id", "definition_id" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "delivery_zones");

            migrationBuilder.DropTable(
                name: "districts");

            migrationBuilder.DropTable(
                name: "payment_method_adjustments");

            migrationBuilder.DropTable(
                name: "product_property_definitions");

            migrationBuilder.DropTable(
                name: "product_property_values");

            migrationBuilder.DropColumn(
                name: "apple_touch_icon_url",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "favicon_url",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "og_image_url",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "secondary_color",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "secondary_logo_url",
                table: "stores");

            migrationBuilder.DropColumn(
                name: "phone_country_code",
                table: "store_customers");

            migrationBuilder.DropColumn(
                name: "secondary_phone_country_code",
                table: "store_customers");

            migrationBuilder.DropColumn(
                name: "auth_require_otp_on_place_order",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_allowed_sort_options",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_enable_category",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_enable_price",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_enable_properties",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_enable_text",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "search_filterable_property_ids",
                table: "store_configurations");

            migrationBuilder.DropColumn(
                name: "phone_country_code",
                table: "merchants");

            migrationBuilder.DropColumn(
                name: "Contact_Phone_CountryCode",
                table: "customers");

            migrationBuilder.DropColumn(
                name: "deleted_at",
                table: "customer_addresses");

            migrationBuilder.DropColumn(
                name: "is_deleted",
                table: "customer_addresses");

            migrationBuilder.AlterColumn<string>(
                name: "secondary_phone",
                table: "store_customers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "store_customers",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true);

            migrationBuilder.AlterColumn<string>(
                name: "phone",
                table: "merchants",
                type: "character varying(20)",
                maxLength: 20,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "character varying(25)",
                oldMaxLength: 25,
                oldNullable: true);
        }
    }
}
