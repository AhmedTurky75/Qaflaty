using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Common.Interfaces;

public interface ICurrentUserService
{
    MerchantId? MerchantId { get; }
    bool IsAuthenticated { get; }
}
