using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.UpdateFaqItem;

public record UpdateFaqItemCommand(
    Guid FaqItemId,
    BilingualTextDto Question,
    BilingualTextDto Answer,
    bool IsPublished
) : ICommand<FaqItemDto>;
