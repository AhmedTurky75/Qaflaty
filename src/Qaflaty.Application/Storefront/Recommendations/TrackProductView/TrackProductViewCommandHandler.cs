using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;
using ProductViewEntity = Qaflaty.Domain.Storefront.Aggregates.ProductView.ProductView;

namespace Qaflaty.Application.Storefront.Recommendations.TrackProductView;

public class TrackProductViewCommandHandler : ICommandHandler<TrackProductViewCommand>
{
    private readonly IProductViewRepository _viewRepository;

    public TrackProductViewCommandHandler(IProductViewRepository viewRepository)
    {
        _viewRepository = viewRepository;
    }

    public async Task<Result> Handle(TrackProductViewCommand request, CancellationToken ct)
    {
        var view = ProductViewEntity.Create(
            request.StoreId, request.ProductId, request.CustomerId, request.SessionId);

        await _viewRepository.AddAsync(view, ct);
        return Result.Success();
    }
}
