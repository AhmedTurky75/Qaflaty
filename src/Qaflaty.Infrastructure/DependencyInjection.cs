using System.Net.Http.Headers;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Infrastructure.Services.Ai;
using Qaflaty.Application.Identity.Services;
using Qaflaty.Domain.Ads.Repositories;
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
using Qaflaty.Infrastructure.Services.Ads;
using Qaflaty.Infrastructure.Services.Ads.Providers;
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
        services.AddScoped<IReturnRequestRepository, ReturnRequestRepository>();
        services.AddScoped<IWishlistRepository, WishlistRepository>();
        services.AddScoped<IProductReviewRepository, ProductReviewRepository>();
        services.AddScoped<IProductViewRepository, ProductViewRepository>();
        services.AddScoped<IRelatedProductRepository, RelatedProductRepository>();
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
        services.AddScoped<IPromoCodeRepository, PromoCodeRepository>();
        services.AddScoped<ILayoutVariantRepository, LayoutVariantRepository>();

        // Ads Management Repositories
        services.AddScoped<IProviderIntegrationRepository, ProviderIntegrationRepository>();
        services.AddScoped<ITrackingEventRepository, TrackingEventRepository>();

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

        // Ads Management Services
        services.AddScoped<ICredentialProtector, DataProtectionCredentialProtector>();
        services.AddScoped<ITrackingProviderResolver, TrackingProviderResolver>();
        services.AddScoped<IEventDispatcher, EventDispatcherService>();
        services.AddScoped<ITrackingLogger, TrackingLoggerService>();
        services.AddScoped<IProviderConfiguration, ProviderConfigurationService>();
        services.AddScoped<IProviderVerifier, ProviderVerifierService>();
        services.AddScoped<IDiagnosticsService, DiagnosticsService>();
        services.AddSingleton<IEventQueue, ChannelEventQueue>();

        // Providers that make HTTP calls get a typed HttpClient + a factory registration so the
        // resolver's IEnumerable<ITrackingProvider> includes them.
        services.AddHttpClient<MetaTrackingProvider>();
        services.AddScoped<ITrackingProvider>(sp => sp.GetRequiredService<MetaTrackingProvider>());
        services.AddHttpClient<TikTokTrackingProvider>();
        services.AddScoped<ITrackingProvider>(sp => sp.GetRequiredService<TikTokTrackingProvider>());
        services.AddHttpClient<SnapchatTrackingProvider>();
        services.AddScoped<ITrackingProvider>(sp => sp.GetRequiredService<SnapchatTrackingProvider>());
        // Still stubs (deferred to a later phase) — no HTTP client needed yet.
        services.AddScoped<ITrackingProvider, Ga4TrackingProvider>();
        services.AddScoped<ITrackingProvider, GoogleAdsTrackingProvider>();
        services.AddScoped<ITrackingProvider, GtmTrackingProvider>();

        // Background Services
        services.AddHostedService<GuestCartCleanupService>();
        services.AddHostedService<TrackingRetryWorker>();

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
