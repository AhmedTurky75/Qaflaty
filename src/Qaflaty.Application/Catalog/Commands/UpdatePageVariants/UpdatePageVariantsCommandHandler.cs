using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Catalog.Queries.GetPageVariants;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdatePageVariants;

public class UpdatePageVariantsCommandHandler : ICommandHandler<UpdatePageVariantsCommand, List<PageVariantDto>>
{
    private readonly IPageConfigurationRepository _repository;

    public UpdatePageVariantsCommandHandler(IPageConfigurationRepository repository)
    {
        _repository = repository;
    }

    public async Task<Result<List<PageVariantDto>>> Handle(
        UpdatePageVariantsCommand request,
        CancellationToken cancellationToken)
    {
        var page = await _repository.GetByIdAsync(new PageConfigurationId(request.PageId), cancellationToken);
        if (page == null)
            return Result.Failure<List<PageVariantDto>>(CatalogErrors.PageConfigurationNotFound);

        var incomingIds = request.Variants
            .Where(v => v.Id != Guid.Empty)
            .Select(v => v.Id)
            .ToHashSet();

        // Remove variants no longer present.
        foreach (var existing in page.Variants.ToList())
        {
            if (!incomingIds.Contains(existing.Id.Value))
                page.RemoveVariant(existing.Id);
        }

        // Update existing, add new.
        foreach (var dto in request.Variants)
        {
            if (dto.Id != Guid.Empty && page.Variants.Any(v => v.Id.Value == dto.Id))
            {
                page.UpdateVariant(new PageVariantId(dto.Id), dto.Name, dto.Weight, dto.IsActive, dto.SectionsJson);
            }
            else
            {
                page.AddVariant(dto.Name, dto.Weight, dto.IsActive, dto.SectionsJson);
            }
        }

        _repository.Update(page);

        var result = page.Variants.Select(GetPageVariantsQueryHandler.MapToDto).ToList();
        return Result.Success(result);
    }
}
