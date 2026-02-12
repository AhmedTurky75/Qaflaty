using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Infrastructure.Persistence;
using Qaflaty.Infrastructure.Persistence.Interceptors;
using Qaflaty.Infrastructure.Persistence.Repositories;
using Qaflaty.Infrastructure.Services.Common;
using Qaflaty.Infrastructure.Services.Identity;
using Qaflaty.Infrastructure.Services.Ordering;

namespace Qaflaty.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(
        this IServiceCollection services,
        IConfiguration configuration)
    {
        // Interceptors
        services.AddScoped<AuditableEntityInterceptor>();
        services.AddScoped<DomainEventDispatcherInterceptor>();

        // DbContext
        services.AddDbContext<QaflatyDbContext>((sp, options) =>
        {
            var auditInterceptor = sp.GetRequiredService<AuditableEntityInterceptor>();
            var eventInterceptor = sp.GetRequiredService<DomainEventDispatcherInterceptor>();

            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection"))
                .AddInterceptors(auditInterceptor, eventInterceptor);
        });

        // Unit of Work
        services.AddScoped<IUnitOfWork, UnitOfWork>();

        // Repositories
        services.AddScoped<IMerchantRepository, MerchantRepository>();
        services.AddScoped<IStoreCustomerRepository, StoreCustomerRepository>();
        services.AddScoped<IStoreRepository, StoreRepository>();
        services.AddScoped<IProductRepository, ProductRepository>();
        services.AddScoped<ICategoryRepository, CategoryRepository>();
        services.AddScoped<IStoreConfigurationRepository, StoreConfigurationRepository>();
        services.AddScoped<IPageConfigurationRepository, PageConfigurationRepository>();
        services.AddScoped<IFaqItemRepository, FaqItemRepository>();
        services.AddScoped<IOrderRepository, OrderRepository>();
        services.AddScoped<ICustomerRepository, CustomerRepository>();

        // Identity Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();

        // Ordering Services
        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();

        // Common Services
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<ITenantContext, TenantContext>();

        return services;
    }
}
