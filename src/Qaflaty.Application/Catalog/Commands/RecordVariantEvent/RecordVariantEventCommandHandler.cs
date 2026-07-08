using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.RecordVariantEvent;

public class RecordVariantEventCommandHandler : ICommandHandler<RecordVariantEventCommand>
{
    private readonly IPageConfigurationRepository _repository;

    public RecordVariantEventCommandHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result> Handle(RecordVariantEventCommand request, CancellationToken cancellationToken)
    {
        var page = await _repository.GetByIdAsync(new PageConfigurationId(request.PageId), cancellationToken);
        if (page == null)
            return Result.Failure(CatalogErrors.PageConfigurationNotFound);

        var variantId = new PageVariantId(request.VariantId);
        if (string.Equals(request.EventType, "conversion", StringComparison.OrdinalIgnoreCase))
            page.RecordVariantConversion(variantId);
        else
            page.RecordVariantImpression(variantId);

        _repository.Update(page);
        return Result.Success();
    }
}
