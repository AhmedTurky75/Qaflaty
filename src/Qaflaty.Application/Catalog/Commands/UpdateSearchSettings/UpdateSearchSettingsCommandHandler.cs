using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.UpdateSearchSettings;

public class UpdateSearchSettingsCommandHandler : ICommandHandler<UpdateSearchSettingsCommand, SearchSettingsDto>
{
    private readonly IStoreConfigurationRepository _configRepository;

    public UpdateSearchSettingsCommandHandler(IStoreConfigurationRepository configRepository)
    {
        _configRepository = configRepository;
    }

    public async Task<Result<SearchSettingsDto>> Handle(
        UpdateSearchSettingsCommand request, CancellationToken cancellationToken)
    {
        var config = await _configRepository.GetByStoreIdAsync(new StoreId(request.StoreId), cancellationToken);
        if (config == null)
            return Result.Failure<SearchSettingsDto>(CatalogErrors.StoreConfigurationNotFound);

        var sortOptions = new List<ProductSortOption>();
        foreach (var opt in request.AllowedSortOptions)
        {
            if (!Enum.TryParse<ProductSortOption>(opt, true, out var parsedOpt))
                return Result.Failure<SearchSettingsDto>(
                    new Error("SearchSettings.InvalidSortOption", $"Invalid sort option: '{opt}'"));
            sortOptions.Add(parsedOpt);
        }

        var settings = SearchSettings.Create(
            request.EnableTextSearch,
            request.EnableCategoryFilter,
            request.EnablePriceFilter,
            request.EnablePropertyFilters,
            request.FilterablePropertyDefinitionIds,
            sortOptions);

        config.UpdateSearchSettings(settings);
        _configRepository.Update(config);

        return Result.Success(new SearchSettingsDto(
            settings.EnableTextSearch,
            settings.EnableCategoryFilter,
            settings.EnablePriceFilter,
            settings.EnablePropertyFilters,
            settings.FilterablePropertyDefinitionIds,
            settings.AllowedSortOptions.Select(s => s.ToString()).ToList()));
    }
}
