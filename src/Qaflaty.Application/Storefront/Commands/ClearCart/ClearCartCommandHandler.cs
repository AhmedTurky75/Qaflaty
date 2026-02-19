using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.ClearCart;

public class ClearCartCommandHandler : ICommandHandler<ClearCartCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;

    public ClearCartCommandHandler(ICartRepository cartRepository, IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(ClearCartCommand request, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);
        if (cart == null) return Result.Success(); // Nothing to clear

        cart.ClearAll();
        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
