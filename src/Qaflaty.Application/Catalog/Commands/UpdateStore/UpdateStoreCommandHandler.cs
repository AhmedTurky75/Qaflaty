using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.UpdateStore;

public class UpdateStoreCommandHandler : ICommandHandler<UpdateStoreCommand, StoreDto>
{
    public Task<Result<StoreDto>> Handle(UpdateStoreCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("UpdateStoreCommandHandler will be implemented in a later phase");
    }
}
