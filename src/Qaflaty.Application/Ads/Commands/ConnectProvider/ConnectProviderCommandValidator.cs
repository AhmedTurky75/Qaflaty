using FluentValidation;
using Qaflaty.Domain.Ads.Enums;

namespace Qaflaty.Application.Ads.Commands.ConnectProvider;

public class ConnectProviderCommandValidator : AbstractValidator<ConnectProviderCommand>
{
    public ConnectProviderCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.Provider).IsInEnum();
        RuleFor(x => x.Credentials).NotNull();

        // Meta / TikTok / Snapchat all require a public pixel identifier + a server access token.
        // (TikTok's identifier is labeled "Pixel Code" in the UI but stored under the same key.)
        RuleFor(x => x.Credentials)
            .Must(c => c.ContainsKey("pixelId") && !string.IsNullOrWhiteSpace(c["pixelId"]))
            .WithMessage("Pixel ID is required")
            .Must(c => c.ContainsKey("accessToken") && !string.IsNullOrWhiteSpace(c["accessToken"]))
            .WithMessage("Access token is required")
            .When(x => x.Credentials != null &&
                       x.Provider is AdProvider.Meta or AdProvider.TikTok or AdProvider.Snapchat);

        RuleFor(x => x)
            .Must(x => x.BrowserTrackingEnabled || x.ServerTrackingEnabled)
            .WithMessage("Enable at least one of Browser Tracking or Server Tracking");
    }
}
