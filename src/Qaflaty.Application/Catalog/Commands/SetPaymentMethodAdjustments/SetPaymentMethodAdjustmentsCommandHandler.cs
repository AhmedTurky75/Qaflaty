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
    private readonly IPaymentMethodDefinitionRepository _definitionRepository;

    public SetPaymentMethodAdjustmentsCommandHandler(
        IStoreConfigurationRepository configRepository,
        IPaymentMethodDefinitionRepository definitionRepository)
    {
        _configRepository = configRepository;
        _definitionRepository = definitionRepository;
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

        // Validate all keys exist in the definitions table
        var definitions = await _definitionRepository.GetAllActiveAsync(cancellationToken);
        var validKeys = definitions.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        var adjustments = new List<PaymentMethodAdjustment>();

        foreach (var adj in request.Adjustments)
        {
            if (!validKeys.ContainsKey(adj.PaymentMethod))
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(
                    new Error("PaymentMethodAdjustment.InvalidMethod",
                        $"Invalid payment method: '{adj.PaymentMethod}'"));

            if (!Enum.TryParse<FeeAdjustmentType>(adj.AdjustmentType, true, out var adjType))
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(
                    new Error("PaymentMethodAdjustment.InvalidType",
                        $"Invalid adjustment type: '{adj.AdjustmentType}'"));

            var result = PaymentMethodAdjustment.Create(adj.PaymentMethod, adjType, adj.Value, adj.DisplayLabel, adj.IsEnabled);
            if (result.IsFailure)
                return Result.Failure<List<PaymentMethodAdjustmentDto>>(result.Error);

            adjustments.Add(result.Value);
        }

        config.SetPaymentMethodAdjustments(adjustments);
        _configRepository.Update(config);

        var dtos = config.PaymentMethodAdjustments
            .Select(a =>
            {
                validKeys.TryGetValue(a.PaymentMethodKey, out var def);
                return new PaymentMethodAdjustmentDto(
                    a.Id,
                    a.PaymentMethodKey,
                    a.AdjustmentType.ToString(),
                    a.Value,
                    a.DisplayLabel,
                    a.IsEnabled,
                    def?.DefaultLabel ?? a.PaymentMethodKey,
                    def?.DefaultDescription ?? string.Empty);
            })
            .ToList();

        return Result.Success(dtos);
    }
}
