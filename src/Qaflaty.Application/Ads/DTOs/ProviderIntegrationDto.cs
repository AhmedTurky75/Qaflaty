namespace Qaflaty.Application.Ads.DTOs;

public record ProviderIntegrationDto(
    Guid Id,
    string Provider,
    string Status,
    bool BrowserTrackingEnabled,
    bool ServerTrackingEnabled,
    int HealthScore,
    DateTime? LastEventAt,
    string? LastErrorCode,
    string? LastErrorMessage,
    DateTime? LastVerifiedAt,
    Dictionary<string, string> MaskedCredentials);
