using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Catalog.Aggregates.PageConfiguration;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration;
using Qaflaty.Domain.Identity.Aggregates.Merchant;
using Qaflaty.Domain.Identity.Aggregates.StoreCustomer;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;

namespace Qaflaty.Infrastructure.Persistence;

public class QaflatyDbContext : DbContext
{
    public QaflatyDbContext(DbContextOptions<QaflatyDbContext> options) : base(options) { }

    // Identity
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<StoreCustomer> StoreCustomers => Set<StoreCustomer>();
    public DbSet<CustomerRefreshToken> CustomerRefreshTokens => Set<CustomerRefreshToken>();

    // Catalog
    public DbSet<Store> Stores => Set<Store>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductVariant> ProductVariants => Set<ProductVariant>();
    public DbSet<InventoryMovement> InventoryMovements => Set<InventoryMovement>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<StoreConfiguration> StoreConfigurations => Set<StoreConfiguration>();
    public DbSet<PageConfiguration> PageConfigurations => Set<PageConfiguration>();
    public DbSet<SectionConfiguration> SectionConfigurations => Set<SectionConfiguration>();
    public DbSet<FaqItem> FaqItems => Set<FaqItem>();

    // Ordering
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<OrderItem> OrderItems => Set<OrderItem>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(QaflatyDbContext).Assembly);
    }
}
