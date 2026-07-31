using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteProductLandingPage;

public class DeleteProductLandingPageCommandHandler : ICommandHandler<DeleteProductLandingPageCommand>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public DeleteProductLandingPageCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result> Handle(DeleteProductLandingPageCommand request, CancellationToken cancellationToken)
    {
        var page = await _pageConfigurationRepository.GetByProductIdAsync(
            new ProductId(request.ProductId), cancellationToken);

        if (page is null || page.PageType != PageType.ProductLanding)
            return Result.Failure(CatalogErrors.LandingPageNotFound);

        _pageConfigurationRepository.Delete(page);

        return Result.Success();
    }
}
