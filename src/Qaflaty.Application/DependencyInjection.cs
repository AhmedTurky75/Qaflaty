using System.Reflection;
using FluentValidation;
using MediatR;
using Microsoft.Extensions.DependencyInjection;
using Qaflaty.Application.Common.Behaviors;
using Qaflaty.Application.Storefront.Recommendations.CrossSell;
using Qaflaty.Application.Storefront.Recommendations.DownSell;
using Qaflaty.Application.Storefront.Recommendations.UpSell;

namespace Qaflaty.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        var assembly = Assembly.GetExecutingAssembly();

        services.AddMediatR(cfg =>
        {
            cfg.RegisterServicesFromAssembly(assembly);
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(LoggingBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(ValidationBehavior<,>));
            cfg.AddBehavior(typeof(IPipelineBehavior<,>), typeof(UnitOfWorkBehavior<,>));
        });

        services.AddValidatorsFromAssembly(assembly);

        // Cross-sell recommendation strategy chain — order doesn't matter here, CompositeCrossSellStrategy
        // sorts by each strategy's own Priority. Register a new ICrossSellStrategy to add a strategy
        // (e.g. AI-powered, best-selling) without changing any caller.
        services.AddScoped<ICrossSellStrategy, ManualCrossSellStrategy>();
        services.AddScoped<ICrossSellStrategy, FrequentlyBoughtTogetherCrossSellStrategy>();
        services.AddScoped<ICrossSellStrategy, CategoryAffinityCrossSellStrategy>();
        services.AddScoped<ICrossSellRecommendationService, CompositeCrossSellStrategy>();

        // Upsell recommendation strategy chain — same shared pool/eligibility policy as cross-sell,
        // plus a strictly-higher-price predicate. Register a new IUpSellStrategy to add a strategy
        // (e.g. margin-based, AI-powered, best-selling premium) without changing any caller.
        services.AddScoped<IUpSellStrategy, ManualUpSellStrategy>();
        services.AddScoped<IUpSellStrategy, CategoryHigherPriceUpSellStrategy>();
        services.AddScoped<IUpSellRecommendationService, CompositeUpSellStrategy>();

        // Downsell recommendation strategy chain — same shared pool/eligibility policy, plus a
        // strictly-lower-price predicate. Register a new IDownSellStrategy to add a strategy
        // (e.g. inventory-aware, AI-powered) without changing any caller.
        services.AddScoped<IDownSellStrategy, ManualDownSellStrategy>();
        services.AddScoped<IDownSellStrategy, CategoryLowerPriceDownSellStrategy>();
        services.AddScoped<IDownSellRecommendationService, CompositeDownSellStrategy>();

        return services;
    }
}
