using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateCustomPage;

public record CreateCustomPageCommand(
    Guid StoreId,
    BilingualTextDto Title,
    string Slug,
    string? ContentJson
) : ICommand<PageConfigurationDto>;
