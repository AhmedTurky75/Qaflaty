using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration.Events;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Errors;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;

/// <summary>
/// One merchant's connection to a single ad-tracking provider for a single store
/// (e.g. this store's Meta Pixel + CAPI configuration). Credentials are stored as an
/// opaque, already-encrypted JSON blob — the aggregate never sees plaintext secrets;
/// encryption/decryption is an infrastructure concern (<c>ICredentialProtector</c>).
/// </summary>
public sealed class ProviderIntegration : AggregateRoot<ProviderIntegrationId>
{
    private const int InitialHealthScore = 100;
    private const int HealthRecoveryStep = 2;
    private const int HealthPenaltyStep = 10;

    public StoreId StoreId { get; private set; } // Owning store (tenant) this integration belongs to
    public AdProvider Provider { get; private set; } // Which ad network/API this integration targets
    public IntegrationStatus Status { get; private set; } // Lifecycle: NotConfigured -> Connected -> Verified, or Error/Disconnected
    public string ProtectedCredentialsJson { get; private set; } = string.Empty; // Encrypted-at-rest JSON blob of provider-specific fields (pixel id, token, ...)
    public bool BrowserTrackingEnabled { get; private set; } // Whether the storefront should load this provider's client-side script
    public bool ServerTrackingEnabled { get; private set; } // Whether server-side events should be dispatched to this provider
    public int HealthScore { get; private set; } // Rolling 0-100 health indicator, nudged up on success and down on failure
    public DateTime? LastEventAt { get; private set; } // UTC timestamp of the most recent event successfully dispatched to this provider
    public string? LastErrorCode { get; private set; } // Last dispatch/verification error code, if any
    public string? LastErrorMessage { get; private set; } // Human-readable detail for the last error
    public DateTime? LastVerifiedAt { get; private set; } // UTC timestamp of the last successful Verify Connection
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ProviderIntegration() : base(ProviderIntegrationId.Empty) { }

    public static Result<ProviderIntegration> Connect(
        StoreId storeId,
        AdProvider provider,
        string protectedCredentialsJson,
        bool browserTrackingEnabled,
        bool serverTrackingEnabled)
    {
        if (string.IsNullOrWhiteSpace(protectedCredentialsJson))
            return Result.Failure<ProviderIntegration>(AdsErrors.CredentialsRequired);

        var integration = new ProviderIntegration
        {
            Id = ProviderIntegrationId.New(),
            StoreId = storeId,
            Provider = provider,
            Status = IntegrationStatus.Connected,
            ProtectedCredentialsJson = protectedCredentialsJson,
            BrowserTrackingEnabled = browserTrackingEnabled,
            ServerTrackingEnabled = serverTrackingEnabled,
            HealthScore = InitialHealthScore,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        integration.RaiseDomainEvent(new ProviderConnectedEvent(integration.Id, storeId, provider));

        return Result.Success(integration);
    }

    public Result UpdateCredentials(string protectedCredentialsJson, bool browserTrackingEnabled, bool serverTrackingEnabled)
    {
        if (string.IsNullOrWhiteSpace(protectedCredentialsJson))
            return Result.Failure(AdsErrors.CredentialsRequired);

        ProtectedCredentialsJson = protectedCredentialsJson;
        BrowserTrackingEnabled = browserTrackingEnabled;
        ServerTrackingEnabled = serverTrackingEnabled;
        // Credentials changed — require re-verification before we trust this connection again.
        if (Status == IntegrationStatus.Verified)
            Status = IntegrationStatus.Connected;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result MarkVerified()
    {
        Status = IntegrationStatus.Verified;
        LastVerifiedAt = DateTime.UtcNow;
        LastErrorCode = null;
        LastErrorMessage = null;
        UpdatedAt = DateTime.UtcNow;

        RaiseDomainEvent(new ProviderVerifiedEvent(Id, StoreId, Provider));
        return Result.Success();
    }

    public Result MarkVerificationFailed(string errorCode, string errorMessage)
    {
        Status = IntegrationStatus.Error;
        LastErrorCode = errorCode;
        LastErrorMessage = errorMessage;
        UpdatedAt = DateTime.UtcNow;

        RaiseDomainEvent(new ProviderVerificationFailedEvent(Id, StoreId, Provider, errorMessage));
        return Result.Success();
    }

    /// <summary>
    /// Nudges the rolling health score after a dispatch attempt and records the outcome.
    /// Called by <c>ITrackingLogger</c> after every provider send, success or failure.
    /// </summary>
    public Result RecordDispatchOutcome(bool succeeded, string? errorCode = null, string? errorMessage = null)
    {
        if (succeeded)
        {
            HealthScore = Math.Min(100, HealthScore + HealthRecoveryStep);
            LastEventAt = DateTime.UtcNow;
            LastErrorCode = null;
            LastErrorMessage = null;
        }
        else
        {
            HealthScore = Math.Max(0, HealthScore - HealthPenaltyStep);
            LastErrorCode = errorCode;
            LastErrorMessage = errorMessage;
            if (Status == IntegrationStatus.Verified)
                Status = IntegrationStatus.Error;
        }

        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public Result Disconnect()
    {
        Status = IntegrationStatus.Disconnected;
        BrowserTrackingEnabled = false;
        ServerTrackingEnabled = false;
        UpdatedAt = DateTime.UtcNow;

        RaiseDomainEvent(new ProviderDisconnectedEvent(Id, StoreId, Provider));
        return Result.Success();
    }

    public bool IsActive => Status is IntegrationStatus.Connected or IntegrationStatus.Verified;
}
