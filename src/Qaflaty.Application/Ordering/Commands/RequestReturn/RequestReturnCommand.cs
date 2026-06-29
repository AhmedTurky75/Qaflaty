using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;

namespace Qaflaty.Application.Ordering.Commands.RequestReturn;

/// <summary>Return request opened by a logged-in customer for one of their own orders.</summary>
public record RequestReturnCommand(
    string OrderNumber,
    List<ReturnItemSelection> Items,
    string Reason
) : ICommand<ReturnRequestDto>;
