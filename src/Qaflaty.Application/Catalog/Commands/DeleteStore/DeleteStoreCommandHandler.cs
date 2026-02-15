using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteStore;

public sealed class DeleteStoreCommandHandler : ICommandHandler<DeleteStoreCommand>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IUnitOfWork _unitOfWork;

    public DeleteStoreCommandHandler(
        IStoreRepository storeRepository,
        IUnitOfWork unitOfWork)
    {
        _storeRepository = storeRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result> Handle(DeleteStoreCommand request, CancellationToken cancellationToken)
    {
        // Get the store
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);

        if (store is null)
        {
            return Result.Failure(CatalogErrors.StoreNotFound);
        }

        // Delete the store
        _storeRepository.Delete(store);
        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success();
    }
}
