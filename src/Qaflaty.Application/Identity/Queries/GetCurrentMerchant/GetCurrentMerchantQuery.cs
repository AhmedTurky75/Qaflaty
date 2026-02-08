using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Queries.GetCurrentMerchant;

public record GetCurrentMerchantQuery : IQuery<MerchantDto>;
