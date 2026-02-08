using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Commands.ToggleProductStatus;

public class ToggleProductStatusCommandHandler : ICommandHandler<ToggleProductStatusCommand>
{
    public Task<Result> Handle(ToggleProductStatusCommand request, CancellationToken cancellationToken)
    {
        throw new NotImplementedException("ToggleProductStatusCommandHandler will be implemented in a later phase");
    }
}
