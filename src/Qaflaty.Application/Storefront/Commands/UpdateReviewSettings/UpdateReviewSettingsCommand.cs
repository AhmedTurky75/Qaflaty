using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.UpdateReviewSettings;

public record UpdateReviewSettingsCommand(
    StoreId StoreId,
    bool ReviewsEnabled,
    bool RequirePurchase,
    bool AutoApprove,
    bool AllowEditing
) : ICommand;
