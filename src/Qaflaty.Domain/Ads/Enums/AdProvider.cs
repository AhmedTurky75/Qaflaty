namespace Qaflaty.Domain.Ads.Enums;

/// <summary>
/// One row per ad network the merchant connects. Each network bundles its browser
/// (pixel) and server (conversions API) capability behind a single form and a single
/// <see cref="ProviderIntegration.ProviderIntegration"/> — e.g. "Meta" holds the Pixel ID
/// and Access Token together, with independent Browser/Server enable toggles. The
/// Dashboard renders "Meta Pixel" / "Meta CAPI" as two status sub-rows of one card.
/// </summary>
public enum AdProvider
{
    Meta = 0,
    TikTok = 1,
    Snapchat = 2,
    GoogleAnalytics4 = 3,
    GoogleAds = 4,
    GoogleTagManager = 5
}
