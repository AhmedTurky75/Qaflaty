using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Application.Identity.Commands.UpdateMerchantRole;

public record UpdateMerchantRoleCommand(Guid StoreId, Guid MerchantId, MerchantRole Role) : ICommand;
