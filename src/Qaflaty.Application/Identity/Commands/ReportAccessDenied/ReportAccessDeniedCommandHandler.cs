using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;
using Qaflaty.Domain.Identity.Repositories;

namespace Qaflaty.Application.Identity.Commands.ReportAccessDenied;

public class ReportAccessDeniedCommandHandler : ICommandHandler<ReportAccessDeniedCommand>
{
    private readonly IAccessDeniedReportRepository _reportRepository;
    private readonly ICurrentUserService _currentUserService;

    public ReportAccessDeniedCommandHandler(
        IAccessDeniedReportRepository reportRepository,
        ICurrentUserService currentUserService)
    {
        _reportRepository = reportRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result> Handle(ReportAccessDeniedCommand request, CancellationToken cancellationToken)
    {
        var merchantId = _currentUserService.MerchantId;
        var customerId = _currentUserService.CustomerId;

        var userId = merchantId?.Value.ToString() ?? customerId?.Value.ToString();
        var userType = merchantId != null ? "merchant" : "customer";

        var report = AccessDeniedReport.Create(userId, userType, request.Endpoint);
        await _reportRepository.AddAsync(report, cancellationToken);

        return Result.Success();
    }
}
