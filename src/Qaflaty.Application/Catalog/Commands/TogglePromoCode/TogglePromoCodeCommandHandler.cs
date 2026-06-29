using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.TogglePromoCode;

public class TogglePromoCodeCommandHandler : ICommandHandler<TogglePromoCodeCommand>
{
    private readonly IPromoCodeRepository _promoCodeRepository;

    public TogglePromoCodeCommandHandler(IPromoCodeRepository promoCodeRepository)
    {
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result> Handle(TogglePromoCodeCommand request, CancellationToken ct)
    {
        var promo = await _promoCodeRepository.GetByIdAsync(request.Id, ct);
        if (promo is null || promo.StoreId != request.StoreId)
            return Result.Failure(PromoCodeErrors.NotFound);

        if (request.IsActive)
            promo.Activate();
        else
            promo.Deactivate();

        _promoCodeRepository.Update(promo);
        return Result.Success();
    }
}
