using System.Text.Json;
using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Ads.Repositories;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Infrastructure.Services.Ads;

/// <summary>Runs the automatic checks behind the Diagnostics page — no manual investigation required.</summary>
public sealed class DiagnosticsService : IDiagnosticsService
{
    private static readonly TimeSpan StaleThreshold = TimeSpan.FromHours(24);

    private readonly IProviderIntegrationRepository _integrationRepository;
    private readonly ITrackingEventRepository _trackingEventRepository;
    private readonly ICredentialProtector _credentialProtector;

    public DiagnosticsService(
        IProviderIntegrationRepository integrationRepository,
        ITrackingEventRepository trackingEventRepository,
        ICredentialProtector credentialProtector)
    {
        _integrationRepository = integrationRepository;
        _trackingEventRepository = trackingEventRepository;
        _credentialProtector = credentialProtector;
    }

    public async Task<IReadOnlyList<DiagnosticFinding>> RunAsync(StoreId storeId, CancellationToken ct)
    {
        var findings = new List<DiagnosticFinding>();
        var integrations = await _integrationRepository.GetByStoreIdAsync(storeId, ct);
        var activeIntegrations = integrations.Where(i => i.IsActive).ToList();

        if (activeIntegrations.Count == 0)
        {
            findings.Add(new DiagnosticFinding(
                "NoProvidersConnected", null, DiagnosticSeverity.High, Passed: false,
                Problem: "No ad tracking providers are connected",
                Reason: "Connect at least one provider (e.g. Meta) so storefront events start flowing.",
                RecommendedFix: "Go to Integrations and connect a provider.",
                HasFix: false));
            return findings;
        }

        var since = DateTime.UtcNow.Subtract(StaleThreshold);

        foreach (var integration in activeIntegrations)
        {
            if (integration.Status != IntegrationStatus.Verified)
            {
                findings.Add(new DiagnosticFinding(
                    "NotVerified", integration.Provider, DiagnosticSeverity.Medium, Passed: false,
                    Problem: $"{integration.Provider} has not been verified",
                    Reason: "Verify Connection has not succeeded yet, or credentials changed since the last verification.",
                    RecommendedFix: "Click Verify Connection on the Integrations page.",
                    HasFix: true));
            }

            if (integration.Status == IntegrationStatus.Error)
            {
                var looksLikeAuthIssue = (integration.LastErrorMessage ?? string.Empty)
                    .Contains("token", StringComparison.OrdinalIgnoreCase) ||
                    (integration.LastErrorCode ?? string.Empty).Contains("401");

                findings.Add(new DiagnosticFinding(
                    looksLikeAuthIssue ? "AccessTokenInvalid" : "ProviderError",
                    integration.Provider,
                    DiagnosticSeverity.High,
                    Passed: false,
                    Problem: looksLikeAuthIssue ? "Access token appears to be invalid or expired" : $"{integration.Provider} is reporting an error",
                    Reason: integration.LastErrorMessage ?? "The last dispatch to this provider failed.",
                    RecommendedFix: looksLikeAuthIssue
                        ? "Reconnect this provider with a fresh access token."
                        : "Check the provider's dashboard for details, then Verify Connection again.",
                    HasFix: true));
            }

            if (integration.ServerTrackingEnabled &&
                (integration.LastEventAt == null || integration.LastEventAt < since))
            {
                findings.Add(new DiagnosticFinding(
                    "NotReceivingEvents", integration.Provider, DiagnosticSeverity.Medium, Passed: false,
                    Problem: $"{integration.Provider} hasn't received a server-side event in the last 24 hours",
                    Reason: "This can mean no matching customer activity occurred, or server dispatch is silently failing.",
                    RecommendedFix: "Send a test event from the Test Center to confirm delivery.",
                    HasFix: true));
            }

            if (integration.HealthScore < 50)
            {
                findings.Add(new DiagnosticFinding(
                    "LowHealthScore", integration.Provider, DiagnosticSeverity.High, Passed: false,
                    Problem: $"{integration.Provider}'s health score is low ({integration.HealthScore}/100)",
                    Reason: "Recent dispatch attempts to this provider have been failing more often than succeeding.",
                    RecommendedFix: "Check the Logs page for this provider's recent failures.",
                    HasFix: false));
            }

            if (integration.Provider == AdProvider.Meta)
            {
                var testEventCodeSet = HasTestEventCode(integration.ProtectedCredentialsJson);
                if (testEventCodeSet)
                {
                    var purchasesLast24h = await _trackingEventRepository.CountEventsAsync(storeId, TrackingEventType.Purchase, since, ct);
                    if (purchasesLast24h > 0)
                    {
                        findings.Add(new DiagnosticFinding(
                            "TestEventCodeInProduction", integration.Provider, DiagnosticSeverity.Medium, Passed: false,
                            Problem: "A Test Event Code is set while real purchases are flowing",
                            Reason: $"{purchasesLast24h} Purchase event(s) were sent in the last 24 hours with a test event code attached — they may not count toward real campaign optimization.",
                            RecommendedFix: "Clear the Test Event Code field once you're done testing.",
                            HasFix: true));
                    }
                }
            }
        }

        var deduplicationOk = await CheckDeduplicationAsync(storeId, since, ct);
        if (!deduplicationOk)
        {
            findings.Add(new DiagnosticFinding(
                "DeduplicationIssue", null, DiagnosticSeverity.Medium, Passed: false,
                Problem: "Some Purchase events were not successfully deduplicated",
                Reason: "A browser and server event were both recorded for the same order, but the server delivery never succeeded.",
                RecommendedFix: "Check the Event Timeline for affected orders and replay the failed dispatch.",
                HasFix: true));
        }

        if (findings.Count == 0)
        {
            findings.Add(new DiagnosticFinding(
                "AllChecksPassed", null, DiagnosticSeverity.Info, Passed: true,
                Problem: "No issues found",
                Reason: "All connected providers are verified, healthy, and receiving events.",
                RecommendedFix: "Nothing to do.",
                HasFix: false));
        }

        return findings;
    }

    private bool HasTestEventCode(string protectedCredentialsJson)
    {
        try
        {
            var plaintext = _credentialProtector.Unprotect(protectedCredentialsJson);
            var values = JsonSerializer.Deserialize<Dictionary<string, string>>(plaintext) ?? [];
            return values.TryGetValue("testEventCode", out var code) && !string.IsNullOrWhiteSpace(code);
        }
        catch
        {
            return false;
        }
    }

    private async Task<bool> CheckDeduplicationAsync(StoreId storeId, DateTime since, CancellationToken ct)
    {
        var (purchases, _) = await _trackingEventRepository.SearchAsync(
            storeId, TrackingEventType.Purchase, null, null, since, null, pageNumber: 1, pageSize: 200, ct);

        var byKey = purchases.GroupBy(e => e.EventKey);
        foreach (var group in byKey)
        {
            var hasBothChannels = group.Select(e => e.Channel).Distinct().Count() > 1;
            if (!hasBothChannels)
                continue;

            var anySucceeded = group.Any(e => e.DispatchLogs.Any(l => l.Status == DispatchStatus.Succeeded));
            if (!anySucceeded)
                return false;
        }

        return true;
    }
}
