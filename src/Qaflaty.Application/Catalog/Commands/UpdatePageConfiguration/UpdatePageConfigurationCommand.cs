using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdatePageConfiguration;

public record UpdatePageConfigurationCommand(
    Guid PageId,
    BilingualTextDto Title,
    string Slug,
    bool IsEnabled,
    PageSeoSettingsDto SeoSettings,
    string? ContentJson
) : ICommand<PageConfigurationDto>;
