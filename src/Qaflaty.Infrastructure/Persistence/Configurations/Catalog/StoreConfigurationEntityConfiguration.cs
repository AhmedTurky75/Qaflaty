using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using StoreConfigurationEntity = Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Catalog;

public class StoreConfigurationEntityConfiguration : IEntityTypeConfiguration<StoreConfigurationEntity>
{
    public void Configure(EntityTypeBuilder<StoreConfigurationEntity> builder)
    {
        builder.ToTable("store_configurations");

        builder.HasKey(sc => sc.Id);

        builder.Property(sc => sc.Id)
            .HasConversion(id => id.Value, value => new StoreConfigurationId(value))
            .HasColumnName("id");

        builder.Property(sc => sc.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.HasIndex(sc => sc.StoreId).IsUnique();

        // PageToggles - owned value object
        builder.OwnsOne(sc => sc.PageToggles, pt =>
        {
            pt.Property(p => p.AboutPage).HasColumnName("page_about");
            pt.Property(p => p.ContactPage).HasColumnName("page_contact");
            pt.Property(p => p.FaqPage).HasColumnName("page_faq");
            pt.Property(p => p.TermsPage).HasColumnName("page_terms");
            pt.Property(p => p.PrivacyPage).HasColumnName("page_privacy");
            pt.Property(p => p.ShippingReturnsPage).HasColumnName("page_shipping_returns");
            pt.Property(p => p.CartPage).HasColumnName("page_cart");
        });

        // FeatureToggles - owned value object
        builder.OwnsOne(sc => sc.FeatureToggles, ft =>
        {
            ft.Property(f => f.Wishlist).HasColumnName("feat_wishlist");
            ft.Property(f => f.Reviews).HasColumnName("feat_reviews");
            ft.Property(f => f.PromoCodes).HasColumnName("feat_promo_codes");
            ft.Property(f => f.Newsletter).HasColumnName("feat_newsletter");
            ft.Property(f => f.ProductSearch).HasColumnName("feat_product_search");
            ft.Property(f => f.SocialLinks).HasColumnName("feat_social_links");
            ft.Property(f => f.Analytics).HasColumnName("feat_analytics");
        });

        // CustomerAuthSettings - owned value object
        builder.OwnsOne(sc => sc.CustomerAuthSettings, ca =>
        {
            ca.Property(c => c.Mode).HasColumnName("auth_mode").HasConversion<string>();
            ca.Property(c => c.AllowGuestCheckout).HasColumnName("auth_allow_guest_checkout");
            ca.Property(c => c.RequireEmailVerification).HasColumnName("auth_require_email_verification");
            ca.Property(c => c.RequireOtpOnPlaceOrder).HasColumnName("auth_require_otp_on_place_order");
        });

        // CommunicationSettings - owned value object
        builder.OwnsOne(sc => sc.CommunicationSettings, cs =>
        {
            cs.Property(c => c.WhatsAppEnabled).HasColumnName("comm_whatsapp_enabled");
            cs.Property(c => c.WhatsAppNumber).HasColumnName("comm_whatsapp_number").HasMaxLength(20);
            cs.Property(c => c.WhatsAppDefaultMessage).HasColumnName("comm_whatsapp_default_message").HasMaxLength(500);
            cs.Property(c => c.LiveChatEnabled).HasColumnName("comm_live_chat_enabled");
            cs.Property(c => c.AiChatbotEnabled).HasColumnName("comm_ai_chatbot_enabled");
            cs.Property(c => c.AiChatbotName).HasColumnName("comm_ai_chatbot_name").HasMaxLength(50);
        });

        // LocalizationSettings - owned value object
        builder.OwnsOne(sc => sc.LocalizationSettings, ls =>
        {
            ls.Property(l => l.DefaultLanguage).HasColumnName("loc_default_language").HasMaxLength(5);
            ls.Property(l => l.EnableBilingual).HasColumnName("loc_enable_bilingual");
            ls.Property(l => l.DefaultDirection).HasColumnName("loc_default_direction").HasMaxLength(3);
        });

        // SocialLinks - owned value object
        builder.OwnsOne(sc => sc.SocialLinks, sl =>
        {
            sl.Property(s => s.Facebook).HasColumnName("social_facebook").HasMaxLength(255);
            sl.Property(s => s.Instagram).HasColumnName("social_instagram").HasMaxLength(255);
            sl.Property(s => s.Twitter).HasColumnName("social_twitter").HasMaxLength(255);
            sl.Property(s => s.TikTok).HasColumnName("social_tiktok").HasMaxLength(255);
            sl.Property(s => s.Snapchat).HasColumnName("social_snapchat").HasMaxLength(255);
            sl.Property(s => s.YouTube).HasColumnName("social_youtube").HasMaxLength(255);
        });

        builder.Property(sc => sc.HeaderVariant)
            .HasColumnName("header_variant")
            .HasMaxLength(50);

        builder.Property(sc => sc.FooterVariant)
            .HasColumnName("footer_variant")
            .HasMaxLength(50);

        builder.Property(sc => sc.ProductCardVariant)
            .HasColumnName("product_card_variant")
            .HasMaxLength(50);

        builder.Property(sc => sc.ProductGridVariant)
            .HasColumnName("product_grid_variant")
            .HasMaxLength(50);

        // SearchSettings - owned value object (JSON columns for list fields)
        builder.OwnsOne(sc => sc.SearchSettings, ss =>
        {
            ss.Property(s => s.EnableTextSearch).HasColumnName("search_enable_text");
            ss.Property(s => s.EnableCategoryFilter).HasColumnName("search_enable_category");
            ss.Property(s => s.EnablePriceFilter).HasColumnName("search_enable_price");
            ss.Property(s => s.EnablePropertyFilters).HasColumnName("search_enable_properties");
            ss.Property(s => s.FilterablePropertyDefinitionIds)
                .HasColumnName("search_filterable_property_ids")
                .HasColumnType("jsonb");
            ss.Property(s => s.AllowedSortOptions)
                .HasColumnName("search_allowed_sort_options")
                .HasColumnType("jsonb");
        });

        builder.Property(sc => sc.CreatedAt).HasColumnName("created_at");
        builder.Property(sc => sc.UpdatedAt).HasColumnName("updated_at");

        // PaymentMethodAdjustments - owned entity collection
        builder.OwnsMany(sc => sc.PaymentMethodAdjustments, adj =>
        {
            adj.ToTable("payment_method_adjustments");

            adj.WithOwner().HasForeignKey("store_configuration_id");

            adj.HasKey(a => a.Id);
            adj.Property(a => a.Id)
                .HasColumnName("id")
                .ValueGeneratedNever();

            adj.Property(a => a.PaymentMethodKey)
                .HasColumnName("payment_method")
                .HasMaxLength(50)
                .IsRequired();

            adj.Property(a => a.AdjustmentType)
                .HasColumnName("adjustment_type")
                .HasConversion<string>()
                .HasMaxLength(20)
                .IsRequired();

            adj.Property(a => a.Value)
                .HasColumnName("value")
                .HasColumnType("decimal(10,4)")
                .IsRequired();

            adj.Property(a => a.DisplayLabel)
                .HasColumnName("display_label")
                .HasMaxLength(200)
                .IsRequired(false);

            adj.Property(a => a.IsEnabled)
                .HasColumnName("is_enabled")
                .IsRequired();
        });

        builder.Ignore(sc => sc.DomainEvents);
    }
}
