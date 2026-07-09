namespace Qaflaty.Application.Ads.DTOs;

/// <summary>
/// Public, non-secret config the storefront needs to load a provider's browser script
/// (e.g. Meta's Pixel ID). Access tokens and other server-only secrets are never included.
/// </summary>
public record TrackingPixelConfigDto(string Provider, Dictionary<string, string> PublicConfig);
