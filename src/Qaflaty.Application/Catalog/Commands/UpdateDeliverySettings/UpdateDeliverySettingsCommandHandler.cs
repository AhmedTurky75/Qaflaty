using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdateDeliverySettings;

public class UpdateDeliverySettingsCommandHandler : ICommandHandler<UpdateDeliverySettingsCommand>
{
    public Task<Result> Handle(UpdateDeliverySettingsCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("UpdateDeliverySettingsCommandHandler will be implemented in a later phase");
    }
}
