using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.Aggregates.City;
using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;
using Qaflaty.Domain.Catalog.Aggregates.Country;
using Qaflaty.Domain.Catalog.Aggregates.DeliveryZone;
using Qaflaty.Domain.Catalog.Aggregates.District;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Entities;
using Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;
using Qaflaty.Domain.Identity.Aggregates.LoginOtp;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Domain.Storefront.Aggregates.Wishlist;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Aggregates.ProductView;
using Qaflaty.Domain.Storefront.Aggregates.RelatedProduct;

namespace Qaflaty.Infrastructure.Persistence;

public class QaflatyDbContext : DbContext
{
    public QaflatyDbContext(DbContextOptions<QaflatyDbContext> options) : base(options) { }

    // Identity
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<StoreCustomer> StoreCustomers => Set<StoreCustomer>();
    public DbSet<CustomerRefreshToken> CustomerRefreshTokens => Set<CustomerRefreshToken>();
    public DbSet<LoginOtp> LoginOtps => Set<LoginOtp>();
    public DbSet<MerchantStoreAssignment> MerchantStoreAssignments => Set<MerchantStoreAssignment>();
    public DbSet<AccessDeniedReport> AccessDeniedReports => Set<AccessDeniedReport>();

    // Catalog
    public DbSet<PaymentMethodDefinition> PaymentMethodDefinitions => Set<PaymentMethodDefinition>();
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<StoreConfiguration> StoreConfigurations => Set<StoreConfiguration>();
    public DbSet<PageConfiguration> PageConfigurations => Set<PageConfiguration>();
    public DbSet<SectionConfiguration> SectionConfigurations => Set<SectionConfiguration>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();
    public DbSet<Country> Countries => Set<Country>();
    public DbSet<City> Cities => Set<City>();
    public DbSet<District> Districts => Set<District>();
    public DbSet<DeliveryZone> DeliveryZones => Set<DeliveryZone>();
    public DbSet<ProductPropertyDefinition> ProductPropertyDefinitions => Set<ProductPropertyDefinition>();
    public DbSet<PromoCode> PromoCodes => Set<PromoCode>();
    public DbSet<PromoCodeRedemption> PromoCodeRedemptions => Set<PromoCodeRedemption>();

    // Ordering
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<OrderOtp> OrderOtps => Set<OrderOtp>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<ReturnRequest> ReturnRequests => Set<ReturnRequest>();
    public DbSet<ReturnRequestItem> ReturnRequestItems => Set<ReturnRequestItem>();

    // Storefront
    public DbSet<Wishlist> Wishlists => Set<Wishlist>();
    public DbSet<WishlistItem> WishlistItems => Set<WishlistItem>();
    public DbSet<Cart> Carts => Set<Cart>();
    public DbSet<CartItem> CartItems => Set<CartItem>();
    public DbSet<ProductReview> ProductReviews => Set<ProductReview>();
    public DbSet<ProductReviewMedia> ProductReviewMedia => Set<ProductReviewMedia>();
    public DbSet<ProductView> ProductViews => Set<ProductView>();
    public DbSet<RelatedProductLink> RelatedProductLinks => Set<RelatedProductLink>();

    // Communication
    public DbSet<ChatConversation> ChatConversations => Set<ChatConversation>();
    public DbSet<ChatMessage> ChatMessages => Set<ChatMessage>();
    public DbSet<AiInteractionLog> AiInteractionLogs => Set<AiInteractionLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(QaflatyDbContext).Assembly);

        // Seed Countries
        modelBuilder.Entity<Country>().HasData(
            Country.Create(1, "Saudi Arabia", "SA"),
            Country.Create(2, "United Arab Emirates", "AE"),
            Country.Create(3, "Kuwait", "KW"),
            Country.Create(4, "Qatar", "QA"),
            Country.Create(5, "Bahrain", "BH"),
            Country.Create(6, "Oman", "OM")
        );

        // Seed Cities
        modelBuilder.Entity<City>().HasData(
            // Saudi Arabia
            City.Create(1, 1, "Riyadh"),
            City.Create(2, 1, "Jeddah"),
            City.Create(3, 1, "Mecca"),
            City.Create(4, 1, "Medina"),
            City.Create(5, 1, "Dammam"),
            City.Create(6, 1, "Khobar"),
            // UAE
            City.Create(7, 2, "Dubai"),
            City.Create(8, 2, "Abu Dhabi"),
            City.Create(9, 2, "Sharjah"),
            City.Create(10, 2, "Ajman"),
            // Kuwait
            City.Create(11, 3, "Kuwait City"),
            City.Create(12, 3, "Hawalli"),
            City.Create(13, 3, "Salmiya"),
            // Qatar
            City.Create(14, 4, "Doha"),
            City.Create(15, 4, "Al Wakrah"),
            // Bahrain
            City.Create(16, 5, "Manama"),
            City.Create(17, 5, "Riffa"),
            // Oman
            City.Create(18, 6, "Muscat"),
            City.Create(19, 6, "Salalah"),
            City.Create(20, 6, "Sohar")
        );
    }
}
