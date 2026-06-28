using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Commands.ModerateReturn;

public class ApproveReturnCommandHandler : ICommandHandler<ApproveReturnCommand>
{
    private readonly IReturnRequestRepository _returnRepository;

    public ApproveReturnCommandHandler(IReturnRequestRepository returnRepository)
    {
        _returnRepository = returnRepository;
    }

    public async Task<Result> Handle(ApproveReturnCommand request, CancellationToken ct)
    {
        var ret = await _returnRepository.GetByIdAsync(request.Id, ct);
        if (ret is null || ret.StoreId != request.StoreId)
            return Result.Failure(ReturnErrors.NotFound);

        var result = ret.Approve(request.MerchantNote);
        if (result.IsFailure)
            return result;

        _returnRepository.Update(ret);
        return Result.Success();
    }
}

public class RejectReturnCommandHandler : ICommandHandler<RejectReturnCommand>
{
    private readonly IReturnRequestRepository _returnRepository;

    public RejectReturnCommandHandler(IReturnRequestRepository returnRepository)
    {
        _returnRepository = returnRepository;
    }

    public async Task<Result> Handle(RejectReturnCommand request, CancellationToken ct)
    {
        var ret = await _returnRepository.GetByIdAsync(request.Id, ct);
        if (ret is null || ret.StoreId != request.StoreId)
            return Result.Failure(ReturnErrors.NotFound);

        var result = ret.Reject(request.Reason);
        if (result.IsFailure)
            return result;

        _returnRepository.Update(ret);
        return Result.Success();
    }
}
