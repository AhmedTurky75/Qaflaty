using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddStoreBuilder : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "faq_items",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    question_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    question_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    answer_ar = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    answer_en = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    is_published = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_faq_items", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "page_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_type = table.Column<string>(type: "text", nullable: false),
                    slug = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    title_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    title_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    seo_title_ar = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    seo_title_en = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    seo_description_ar = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    seo_description_en = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    seo_og_image_url = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    seo_no_index = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    seo_no_follow = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    content_json = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_page_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "store_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_about = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    page_contact = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    page_faq = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    page_terms = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    page_privacy = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    page_shipping_returns = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    page_cart = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    feat_wishlist = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    feat_reviews = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    feat_promo_codes = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    feat_newsletter = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    feat_product_search = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    feat_social_links = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    feat_analytics = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    auth_mode = table.Column<string>(type: "text", nullable: false),
                    auth_allow_guest_checkout = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    auth_require_email_verification = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    comm_whatsapp_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    comm_whatsapp_number = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: true),
                    comm_whatsapp_default_message = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    comm_live_chat_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    comm_ai_chatbot_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    comm_ai_chatbot_name = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: true),
                    loc_default_language = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false, defaultValue: "ar"),
                    loc_enable_bilingual = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    loc_default_direction = table.Column<string>(type: "character varying(3)", maxLength: 3, nullable: false, defaultValue: "rtl"),
                    social_facebook = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    social_instagram = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    social_twitter = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    social_tiktok = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    social_snapchat = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    social_youtube = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    header_variant = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "header-minimal"),
                    footer_variant = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "footer-standard"),
                    product_card_variant = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "card-standard"),
                    product_grid_variant = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "grid-standard"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_store_configurations", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "section_configurations",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    page_configuration_id = table.Column<Guid>(type: "uuid", nullable: false),
                    section_type = table.Column<string>(type: "text", nullable: false),
                    variant_id = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    is_enabled = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    sort_order = table.Column<int>(type: "integer", nullable: false),
                    content_json = table.Column<string>(type: "jsonb", nullable: true),
                    settings_json = table.Column<string>(type: "jsonb", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_section_configurations", x => x.id);
                    table.ForeignKey(
                        name: "FK_section_configurations_page_configurations_page_configurati~",
                        column: x => x.page_configuration_id,
                        principalTable: "page_configurations",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_faq_items_store_id_sort_order",
                table: "faq_items",
                columns: new[] { "store_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_page_configurations_store_id_slug",
                table: "page_configurations",
                columns: new[] { "store_id", "slug" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_section_configurations_page_configuration_id",
                table: "section_configurations",
                column: "page_configuration_id");

            migrationBuilder.CreateIndex(
                name: "IX_store_configurations_store_id",
                table: "store_configurations",
                column: "store_id",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "faq_items");

            migrationBuilder.DropTable(
                name: "section_configurations");

            migrationBuilder.DropTable(
                name: "store_configurations");

            migrationBuilder.DropTable(
                name: "page_configurations");
        }
    }
}
