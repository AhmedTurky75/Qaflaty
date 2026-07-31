namespace Qaflaty.Application.Ads.DTOs;

public record DiagnosticFindingDto(
    string CheckCode,
    string? Provider,
    string Severity,
    bool Passed,
    string Problem,
    string Reason,
    string RecommendedFix,
    bool HasFix);
