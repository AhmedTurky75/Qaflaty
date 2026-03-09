using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Identity.Enums;

namespace Qaflaty.Application.Identity.Commands.InviteMerchantToStore;

public record InviteMerchantToStoreCommand(Guid StoreId, string EmailOrUsername, MerchantRole Role) : ICommand;
