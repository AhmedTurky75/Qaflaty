using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.LogoutStoreCustomer;

public record LogoutStoreCustomerCommand(string RefreshToken) : ICommand;
