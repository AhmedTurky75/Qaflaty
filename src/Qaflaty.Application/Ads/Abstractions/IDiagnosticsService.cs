using Qaflaty.Domain.Ads.Enums;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Abstractions;

public sealed record DiagnosticFinding(
    string CheckCode,
    AdProvider? Provider,
    DiagnosticSeverity Severity,
    bool Passed,
    string Problem,
    string Reason,
    string RecommendedFix,
    bool HasFix);

/// <summary>Runs the automatic checks behind the Diagnostics page (pixel installed, token valid, purchases deduped, ...).</summary>
public interface IDiagnosticsService
{
    Task<IReadOnlyList<DiagnosticFinding>> RunAsync(StoreId storeId, CancellationToken ct);
}
