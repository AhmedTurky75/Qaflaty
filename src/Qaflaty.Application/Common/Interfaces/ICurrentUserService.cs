using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces;

public interface ICurrentUserService
{
    MerchantId? MerchantId { get; }
    StoreCustomerId? CustomerId { get; }
    StoreId? StoreId { get; }
    string? Email { get; }
    string? Role { get; }
    string[]? Permissions { get; }
    bool IsAuthenticated { get; }
    bool IsMerchant { get; }
    bool IsCustomer { get; }
}
