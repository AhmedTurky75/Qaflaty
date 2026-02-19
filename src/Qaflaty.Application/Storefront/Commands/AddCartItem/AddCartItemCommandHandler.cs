using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.Cart;
using Qaflaty.Domain.Storefront.Repositories;

namespace Qaflaty.Application.Storefront.Commands.AddCartItem;

public class AddCartItemCommandHandler : ICommandHandler<AddCartItemCommand>
{
    private readonly ICartRepository _cartRepository;
    private readonly IUnitOfWork _unitOfWork;

    public AddCartItemCommandHandler(ICartRepository cartRepository, IUnitOfWork unitOfWork)
    {
        _cartRepository = cartRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(AddCartItemCommand request, CancellationToken cancellationToken)
    {
        var cart = await _cartRepository.GetByCustomerIdAsync(request.CustomerId, cancellationToken);

        if (cart == null)
        {
            var createResult = Cart.Create(request.CustomerId);
            if (createResult.IsFailure) return Result.Failure(createResult.Error);
            cart = createResult.Value;
            await _cartRepository.AddAsync(cart, cancellationToken);
        }

        var result = cart.AddItem(new ProductId(request.ProductId), request.Quantity, request.VariantId);
        if (result.IsFailure) return result;

        _cartRepository.Update(cart);
        await _unitOfWork.SaveChangesAsync(cancellationToken);
        return Result.Success();
    }
}
