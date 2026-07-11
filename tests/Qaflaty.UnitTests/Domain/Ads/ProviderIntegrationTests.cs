using Qaflaty.Domain.Ads.Aggregates.ProviderIntegration;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Ads;

public class ProviderIntegrationTests
{
    [Fact]
    public void Connect_WithCredentials_StartsInConnectedStatusWithFullHealth()
    {
        var result = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true);

        Assert.True(result.IsSuccess);
        Assert.Equal(IntegrationStatus.Connected, result.Value.Status);
        Assert.Equal(100, result.Value.HealthScore);
        Assert.True(result.Value.IsActive);
    }

    [Fact]
    public void Connect_WithoutCredentials_Fails()
    {
        var result = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "", true, true);

        Assert.True(result.IsFailure);
        Assert.Equal("Ads.CredentialsRequired", result.Error.Code);
    }

    [Fact]
    public void MarkVerified_SetsVerifiedStatusAndClearsError()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;
        integration.MarkVerificationFailed("Ads.Meta.VerificationFailed", "bad token");

        integration.MarkVerified();

        Assert.Equal(IntegrationStatus.Verified, integration.Status);
        Assert.Null(integration.LastErrorMessage);
        Assert.NotNull(integration.LastVerifiedAt);
    }

    [Fact]
    public void MarkVerificationFailed_SetsErrorStatus()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;

        integration.MarkVerificationFailed("Ads.Meta.VerificationFailed", "invalid pixel id");

        Assert.Equal(IntegrationStatus.Error, integration.Status);
        Assert.Equal("invalid pixel id", integration.LastErrorMessage);
    }

    [Fact]
    public void RecordDispatchOutcome_Success_IncreasesHealthAndSetsLastEventAt()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;
        // Force health down first so we can observe recovery without clamping at 100.
        integration.RecordDispatchOutcome(false, "500", "boom");

        integration.RecordDispatchOutcome(true);

        Assert.Equal(92, integration.HealthScore); // 100 - 10 (failure) + 2 (success)
        Assert.NotNull(integration.LastEventAt);
        Assert.Null(integration.LastErrorMessage);
    }

    [Fact]
    public void RecordDispatchOutcome_Failure_DecreasesHealthAndDowngradesVerifiedStatus()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;
        integration.MarkVerified();

        integration.RecordDispatchOutcome(false, "401", "token expired");

        Assert.Equal(90, integration.HealthScore);
        Assert.Equal(IntegrationStatus.Error, integration.Status);
        Assert.Equal("token expired", integration.LastErrorMessage);
    }

    [Fact]
    public void RecordDispatchOutcome_HealthScoreNeverExceeds100OrDropsBelow0()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;

        integration.RecordDispatchOutcome(true); // already at 100, should clamp
        Assert.Equal(100, integration.HealthScore);

        for (var i = 0; i < 20; i++)
            integration.RecordDispatchOutcome(false, "500", "boom");

        Assert.Equal(0, integration.HealthScore);
    }

    [Fact]
    public void Disconnect_TurnsOffBothChannelsAndSetsDisconnectedStatus()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;

        integration.Disconnect();

        Assert.Equal(IntegrationStatus.Disconnected, integration.Status);
        Assert.False(integration.BrowserTrackingEnabled);
        Assert.False(integration.ServerTrackingEnabled);
        Assert.False(integration.IsActive);
    }

    [Fact]
    public void UpdateCredentials_WhenPreviouslyVerified_RequiresReVerification()
    {
        var integration = ProviderIntegration.Connect(StoreId.New(), AdProvider.Meta, "{}", true, true).Value;
        integration.MarkVerified();

        integration.UpdateCredentials("{\"pixelId\":\"new\"}", true, true);

        Assert.Equal(IntegrationStatus.Connected, integration.Status);
    }
}
