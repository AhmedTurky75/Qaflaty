using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Infrastructure.Services.Ai;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Identity.Repositories;
using Qaflaty.Domain.Identity.Services;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Domain.Storefront.Repositories;
using Qaflaty.Infrastructure.Persistence;
using Qaflaty.Infrastructure.Persistence.Interceptors;
using Qaflaty.Infrastructure.Persistence.Repositories;
using Qaflaty.Infrastructure.Persistence.Repositories.Communication;
using Qaflaty.Infrastructure.Services.Common;
using Qaflaty.Infrastructure.Services.Identity;
using Qaflaty.Infrastructure.Services.Ordering;
using Qaflaty.Infrastructure.Services.Storefront;

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
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IProductReviewRepository, ProductReviewRepository>();
        services.AddScoped<IProductViewRepository, ProductViewRepository>();
        services.AddScoped<ICartRepository, CartRepository>();
        services.AddScoped<IChatConversationRepository, ChatConversationRepository>();
        services.AddScoped<IAiInteractionLogRepository, AiInteractionLogRepository>();
        services.AddScoped<IOrderOtpRepository, OrderOtpRepository>();
        services.AddScoped<ICountryRepository, CountryRepository>();
        services.AddScoped<ICityRepository, CityRepository>();
        services.AddScoped<IDeliveryZoneRepository, DeliveryZoneRepository>();
        services.AddScoped<IDistrictRepository, DistrictRepository>();
        services.AddScoped<IProductPropertyDefinitionRepository, ProductPropertyDefinitionRepository>();
        services.AddScoped<IPaymentMethodDefinitionRepository, PaymentMethodDefinitionRepository>();

        // Identity Services
        services.AddScoped<IPasswordHasher, PasswordHasher>();
        services.AddScoped<ITokenService, JwtTokenService>();
        services.AddScoped<ICurrentUserService, CurrentUserService>();
        services.AddScoped<ICookieAuthService, CookieAuthService>();
        services.AddScoped<ILoginOtpRepository, LoginOtpRepository>();
        services.AddScoped<IAccessDeniedReportRepository, AccessDeniedReportRepository>();

        // Ordering Services
        services.AddScoped<IOrderNumberGenerator, OrderNumberGenerator>();
        services.AddScoped<IPaymentProcessor, MockPaymentProcessor>();

        // Common Services
        services.AddSingleton<IDateTimeProvider, DateTimeProvider>();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<IFileStorageService, LocalFileStorageService>();
        services.AddScoped<IEmailService, SmtpEmailService>();
        services.AddSingleton<IOtpSettings, OtpSettings>();

        // AI Assistant Services
        services.Configure<AiAssistantOptions>(configuration.GetSection(AiAssistantOptions.SectionName));
        services.AddSingleton<IAiKnowledgeStore, InMemoryAiKnowledgeStore>();

        services.AddHttpClient<IAiChatCompletionService, OpenAiCompatibleChatCompletionService>(ConfigureAiHttpClient);
        services.AddHttpClient<IAiEmbeddingService, OpenAiCompatibleEmbeddingService>(ConfigureAiHttpClient);

        // Background Services
        services.AddHostedService<GuestCartCleanupService>();

        return services;
    }

    private static void ConfigureAiHttpClient(IServiceProvider sp, HttpClient client)
    {
        var options = sp.GetRequiredService<IOptions<AiAssistantOptions>>().Value;
        client.Timeout = TimeSpan.FromSeconds(options.TimeoutSeconds <= 0 ? 60 : options.TimeoutSeconds);

        var apiKey = options.EffectiveApiKey;
        if (!string.IsNullOrWhiteSpace(apiKey))
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
    }
}
