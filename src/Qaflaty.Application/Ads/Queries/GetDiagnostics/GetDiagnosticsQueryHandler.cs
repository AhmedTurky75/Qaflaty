using Qaflaty.Application.Ads.Abstractions;
using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Ads.Queries.GetDiagnostics;

public class GetDiagnosticsQueryHandler : IQueryHandler<GetDiagnosticsQuery, List<DiagnosticFindingDto>>
{
    private readonly IDiagnosticsService _diagnosticsService;

    public GetDiagnosticsQueryHandler(IDiagnosticsService diagnosticsService)
    {
        _diagnosticsService = diagnosticsService;
    }

    public async Task<Result<List<DiagnosticFindingDto>>> Handle(GetDiagnosticsQuery request, CancellationToken cancellationToken)
    {
        var storeId = StoreId.From(request.StoreId);
        var findings = await _diagnosticsService.RunAsync(storeId, cancellationToken);

        var dtos = findings.Select(f => new DiagnosticFindingDto(
            f.CheckCode,
            f.Provider?.ToString(),
            f.Severity.ToString(),
            f.Passed,
            f.Problem,
            f.Reason,
            f.RecommendedFix,
            f.HasFix)).ToList();

        return Result.Success(dtos);
    }
}
