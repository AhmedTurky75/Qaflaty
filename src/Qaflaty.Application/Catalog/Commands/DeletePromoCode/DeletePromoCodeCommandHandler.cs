using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.DeletePromoCode;

public class DeletePromoCodeCommandHandler : ICommandHandler<DeletePromoCodeCommand>
{
    private readonly IPromoCodeRepository _promoCodeRepository;

    public DeletePromoCodeCommandHandler(IPromoCodeRepository promoCodeRepository)
    {
        _promoCodeRepository = promoCodeRepository;
    }

    public async Task<Result> Handle(DeletePromoCodeCommand request, CancellationToken ct)
    {
        var promo = await _promoCodeRepository.GetByIdAsync(request.Id, ct);
        if (promo is null || promo.StoreId != request.StoreId)
            return Result.Failure(PromoCodeErrors.NotFound);

        _promoCodeRepository.Delete(promo);
        return Result.Success();
    }
}
