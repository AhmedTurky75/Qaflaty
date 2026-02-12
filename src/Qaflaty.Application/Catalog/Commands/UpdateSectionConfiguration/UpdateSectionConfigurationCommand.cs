using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateSectionConfiguration;

public record UpdateSectionConfigurationCommand(
    Guid PageId,
    List<SectionConfigurationDto> Sections
) : ICommand<PageConfigurationDto>;
