using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateProductLandingPage;

public record CreateProductLandingPageCommand(
    Guid StoreId,
    Guid ProductId
) : ICommand<PageConfigurationDto>;
