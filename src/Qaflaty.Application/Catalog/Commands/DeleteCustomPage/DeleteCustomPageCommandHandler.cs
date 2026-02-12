using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.DeleteCustomPage;

public class DeleteCustomPageCommandHandler : ICommandHandler<DeleteCustomPageCommand>
{
    private readonly IPageConfigurationRepository _pageConfigurationRepository;

    public DeleteCustomPageCommandHandler(IPageConfigurationRepository pageConfigurationRepository)
    {
        _pageConfigurationRepository = pageConfigurationRepository;
    }

    public async Task<Result> Handle(DeleteCustomPageCommand request, CancellationToken cancellationToken)
    {
        var pageId = new PageConfigurationId(request.PageId);
        var page = await _pageConfigurationRepository.GetByIdAsync(pageId, cancellationToken);

        if (page == null)
            return Result.Failure(CatalogErrors.PageConfigurationNotFound);

        if (page.PageType != PageType.Custom)
            return Result.Failure(CatalogErrors.CannotDeleteSystemPage);

        _pageConfigurationRepository.Delete(page);

        return Result.Success();
    }
}
