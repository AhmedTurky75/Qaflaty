using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdateStoreBranding;

public class UpdateStoreBrandingCommandHandler : ICommandHandler<UpdateStoreBrandingCommand>
{
    public Task<Result> Handle(UpdateStoreBrandingCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("UpdateStoreBrandingCommandHandler will be implemented in a later phase");
    }
}
