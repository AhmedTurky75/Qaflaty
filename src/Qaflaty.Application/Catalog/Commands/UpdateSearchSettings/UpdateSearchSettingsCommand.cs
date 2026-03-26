using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateSearchSettings;

public record UpdateSearchSettingsCommand(
    Guid StoreId,
    bool EnableTextSearch,
    bool EnableCategoryFilter,
    bool EnablePriceFilter,
    bool EnablePropertyFilters,
    List<Guid> FilterablePropertyDefinitionIds,
    List<string> AllowedSortOptions
) : ICommand<SearchSettingsDto>;
