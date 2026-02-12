using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Identity.DTOs;

namespace Qaflaty.Application.Identity.Commands.LoginStoreCustomer;

public record LoginStoreCustomerCommand(
    string Email,
    string Password
) : ICommand<CustomerAuthResponse>;
