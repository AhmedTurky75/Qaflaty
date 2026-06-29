using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Ordering.Aggregates.Return;
using Qaflaty.Domain.Ordering.Errors;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Application.Ordering.Commands.RequestGuestReturn;

public class RequestGuestReturnCommandHandler : ICommandHandler<RequestGuestReturnCommand, ReturnRequestDto>
{
    private readonly IOrderRepository _orderRepository;
    private readonly ICustomerRepository _customerRepository;
    private readonly IReturnRequestRepository _returnRepository;

    public RequestGuestReturnCommandHandler(
        IOrderRepository orderRepository,
        ICustomerRepository customerRepository,
        IReturnRequestRepository returnRepository)
    {
        _orderRepository = orderRepository;
        _customerRepository = customerRepository;
        _returnRepository = returnRepository;
    }

    public async Task<Result<ReturnRequestDto>> Handle(RequestGuestReturnCommand request, CancellationToken ct)
    {
        var orderNumberResult = OrderNumber.Parse(request.OrderNumber);
        if (orderNumberResult.IsFailure)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        var order = await _orderRepository.GetByOrderNumberAsync(request.StoreId, orderNumberResult.Value, ct);
        if (order is null)
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        // Proof of ownership: email or phone must match the order's captured contact.
        var customer = await _customerRepository.GetByIdAsync(order.CustomerId, ct);
        if (customer is null || !ContactMatches(customer.Contact, request.Contact))
            return Result.Failure<ReturnRequestDto>(OrderingErrors.OrderNotFound);

        if (await _returnRepository.HasOpenReturnAsync(order.Id, ct))
            return Result.Failure<ReturnRequestDto>(ReturnErrors.AlreadyRequested);

        var selections = request.Items
            .Select(i => (new ProductId(i.ProductId), i.Quantity))
            .ToList();

        var result = ReturnRequest.Create(order, selections, request.Reason);
        if (result.IsFailure)
            return Result.Failure<ReturnRequestDto>(result.Error);

        await _returnRepository.AddAsync(result.Value, ct);
        return Result.Success(result.Value.ToDto());
    }

    private static bool ContactMatches(CustomerContact contact, string? provided)
    {
        if (string.IsNullOrWhiteSpace(provided))
            return false;

        provided = provided.Trim();

        if (contact.Email != null &&
            string.Equals(contact.Email.Value, provided, StringComparison.OrdinalIgnoreCase))
            return true;

        var providedDigits = DigitsOnly(provided);
        var phoneDigits = DigitsOnly(contact.Phone.Value);
        return providedDigits.Length >= 6 &&
               (phoneDigits == providedDigits ||
                phoneDigits.EndsWith(providedDigits, StringComparison.Ordinal) ||
                providedDigits.EndsWith(phoneDigits, StringComparison.Ordinal));
    }

    private static string DigitsOnly(string value)
        => new(value.Where(char.IsDigit).ToArray());
}
