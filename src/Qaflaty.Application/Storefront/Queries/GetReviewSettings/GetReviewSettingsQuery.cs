using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Storefront.DTOs;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Queries.GetReviewSettings;

public record GetReviewSettingsQuery(StoreId StoreId) : IQuery<ReviewSettingsDto>;
