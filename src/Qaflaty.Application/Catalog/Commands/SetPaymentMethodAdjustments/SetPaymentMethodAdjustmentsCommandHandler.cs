using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Errors;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.SetPaymentMethodAdjustments;

public class SetPaymentMethodAdjustmentsCommandHandler
    : ICommandHandler<SetPaymentMethodAdjustmentsCommand, List<PaymentMethodAdjustmentDto>>
{
    private readonly IStoreConfigurationRepository _configRepository;

    public SetPaymentMethodAdjustmentsCommandHandler(IStoreConfigurationRepository configRepository)
    {
        _configRepository = configRepository;
    }

    public async Task<Result<List<PaymentMethodAdjustmentDto>>> Handle(
        SetPaymentMethodAdjustmentsCommand request,
        CancellationToken cancellationToken)
    {
        var config = await _configRepository.GetByStoreIdAsync(new StoreId(request.StoreId), cancellationToken);
        if (config == null)
            return Result.Failure<List<PaymentMethodAdjustmentDto>>(CatalogErrors.StoreConfigurationNotFound);

        // Reject duplicate payment methods in the same request
        var duplicates = request.Adjustments
            .GroupBy(a => a.PaymentMethod, StringComparer.OrdinalIgnoreCase)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();

        if (duplicates.Count > 0)
            return Result.Failure<List<PaymentMethodAdjustmentDto>>(
                new Error("PaymentMethodAdjustment.DuplicateMethod",
                    $"Each payment method may only appear once. Duplicates: {string.Join(", ", duplicates)}"));

        var adjustments = new List<PaymentMethodAdjustment>();

        foreach (var adj in request.Adjustments)
        {
            if (!Enum.TryParse<PaymentMethodOption>(adj.PaymentMethod, true, out var paymentMethod))
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(
                    new Error("PaymentMethodAdjustment.InvalidMethod",
                        $"Invalid payment method: '{adj.PaymentMethod}'"));

            if (!Enum.TryParse<FeeAdjustmentType>(adj.AdjustmentType, true, out var adjType))
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(
                    new Error("PaymentMethodAdjustment.InvalidType",
                        $"Invalid adjustment type: '{adj.AdjustmentType}'"));

            var result = PaymentMethodAdjustment.Create(paymentMethod, adjType, adj.Value, adj.DisplayLabel);
            if (result.IsFailure)
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(result.Error);

            adjustments.Add(result.Value);
        }

        config.SetPaymentMethodAdjustments(adjustments);
        _configRepository.Update(config);

        var dtos = config.PaymentMethodAdjustments
            .Select(a => new PaymentMethodAdjustmentDto(
                a.Id,
                a.PaymentMethod.ToString(),
                a.AdjustmentType.ToString(),
                a.Value,
                a.DisplayLabel))
            .ToList();

        return Result.Success(dtos);
    }
}
