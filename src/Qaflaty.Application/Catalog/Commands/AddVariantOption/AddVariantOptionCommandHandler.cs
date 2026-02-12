using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.AddVariantOption;

public class AddVariantOptionCommandHandler : ICommandHandler<AddVariantOptionCommand>
{
    private readonly IProductRepository _productRepository;

    public AddVariantOptionCommandHandler(IProductRepository productRepository)
    {
        _productRepository = productRepository;
    }

    public async Task<Result> Handle(AddVariantOptionCommand request, CancellationToken cancellationToken)
    {
        var product = await _productRepository.GetByIdAsync(request.ProductId, cancellationToken);
        if (product == null)
            return Result.Failure(new Error("Product.NotFound", "Product not found"));

        var variantOptionResult = VariantOption.Create(request.OptionName, request.OptionValues);
        if (variantOptionResult.IsFailure)
            return Result.Failure(variantOptionResult.Error);

        var result = product.AddVariantOption(variantOptionResult.Value);
        if (result.IsFailure)
            return result;

        _productRepository.Update(product);

        return Result.Success();
    }
}
