using Qaflaty.Application.Ads.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Ads.Queries.GetDiagnostics;

public record GetDiagnosticsQuery(Guid StoreId) : IQuery<List<DiagnosticFindingDto>>;
