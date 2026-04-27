using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Queries.GetStorefrontPaymentMethods;

public class GetStorefrontPaymentMethodsQueryHandler
    : IQueryHandler<GetStorefrontPaymentMethodsQuery, List<PaymentMethodAdjustmentDto>>
{
    private readonly IStoreConfigurationRepository _configRepo;
    private readonly IPaymentMethodDefinitionRepository _definitionRepo;

    public GetStorefrontPaymentMethodsQueryHandler(
        IStoreConfigurationRepository configRepo,
        IPaymentMethodDefinitionRepository definitionRepo)
    {
        _configRepo = configRepo;
        _definitionRepo = definitionRepo;
    }

    public async Task<Result<List<PaymentMethodAdjustmentDto>>> Handle(
        GetStorefrontPaymentMethodsQuery request,
        CancellationToken cancellationToken)
    {
        var config = await _configRepo.GetByStoreIdAsync(
            new StoreId(request.StoreId), cancellationToken);

        var definitions = await _definitionRepo.GetAllActiveAsync(cancellationToken);
        var defMap = definitions.ToDictionary(d => d.Key, d => d, StringComparer.OrdinalIgnoreCase);

        // No config or no adjustments configured → default to COD only
        if (config == null || config.PaymentMethodAdjustments.Count == 0)
        {
            defMap.TryGetValue("COD", out var codDef);
            return Result.Success(new List<PaymentMethodAdjustmentDto>
            {
                new(Guid.Empty,
                    "COD",
                    FeeAdjustmentType.Fixed.ToString(),
                    0m,
                    null,
                    true,
                    codDef?.DefaultLabel ?? "Cash on Delivery",
                    codDef?.DefaultDescription ?? "Pay when you receive your order")
            });
        }

        var dtos = config.PaymentMethodAdjustments.Select(a =>
        {
            defMap.TryGetValue(a.PaymentMethodKey, out var def);
            return new PaymentMethodAdjustmentDto(
                a.Id,
                a.PaymentMethodKey,
                a.AdjustmentType.ToString(),
                a.Value,
                a.DisplayLabel,
                a.IsEnabled,
                def?.DefaultLabel ?? a.PaymentMethodKey,
                def?.DefaultDescription ?? string.Empty);
        }).ToList();

        return Result.Success(dtos);
    }
}
