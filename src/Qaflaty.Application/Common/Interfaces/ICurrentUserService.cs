using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces;

public interface ICurrentUserService
{
    MerchantId? MerchantId { get; }
    StoreCustomerId? CustomerId { get; }
    bool IsAuthenticated { get; }
    bool IsMerchant { get; }
    bool IsCustomer { get; }
}
