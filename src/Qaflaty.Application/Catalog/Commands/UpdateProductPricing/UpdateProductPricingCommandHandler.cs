using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdateProductPricing;

public class UpdateProductPricingCommandHandler : ICommandHandler<UpdateProductPricingCommand>
{
    public Task<Result> Handle(UpdateProductPricingCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("UpdateProductPricingCommandHandler will be implemented in a later phase");
    }
}
