using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.CreateFaqItem;

public record CreateFaqItemCommand(
    Guid StoreId,
    BilingualTextDto Question,
    BilingualTextDto Answer,
    bool IsPublished
) : ICommand<FaqItemDto>;
