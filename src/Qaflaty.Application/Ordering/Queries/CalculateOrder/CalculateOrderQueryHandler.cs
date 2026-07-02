using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Ordering.DTOs;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Repositories;

namespace Qaflaty.Application.Ordering.Queries.CalculateOrder;

public class CalculateOrderQueryHandler : IQueryHandler<CalculateOrderQuery, CalculateOrderDto>
{
    private readonly IStoreRepository _storeRepository;
    private readonly IProductRepository _productRepository;
    private readonly IDeliveryZoneRepository _deliveryZoneRepository;
    private readonly IStoreConfigurationRepository _configRepository;

    public CalculateOrderQueryHandler(
        IStoreRepository storeRepository,
        IProductRepository productRepository,
        IDeliveryZoneRepository deliveryZoneRepository,
        IStoreConfigurationRepository configRepository)
    {
        _storeRepository = storeRepository;
        _productRepository = productRepository;
        _deliveryZoneRepository = deliveryZoneRepository;
        _configRepository = configRepository;
    }

    public async Task<Result<CalculateOrderDto>> Handle(CalculateOrderQuery request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);

        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null)
            return Result.Failure<CalculateOrderDto>(new Error("Order.StoreNotFound", "Store not found"));

        var config = await _configRepository.GetByStoreIdAsync(storeId, cancellationToken);

        // Resolve delivery fee using the same hierarchical zone logic as PlaceOrderCommandHandler
        Money deliveryFee = store.DeliverySettings.DeliveryFee;
        bool isDeliveryAvailable = true;

        if (request.CountryCode > 0)
        {
            if (request.DistrictId.HasValue)
            {
                var districtZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.District, request.DistrictId.Value, cancellationToken);
                if (districtZone != null)
                {
                    if (!districtZone.IsDeliveryEnabled)
                        isDeliveryAvailable = false;
                    else if (districtZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(districtZone.CustomDeliveryFee.Value).Value;
                }
            }

            if (isDeliveryAvailable && deliveryFee == store.DeliverySettings.DeliveryFee && request.CityId.HasValue)
            {
                var cityZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.City, request.CityId.Value, cancellationToken);
                if (cityZone != null)
                {
                    if (!cityZone.IsDeliveryEnabled)
                        isDeliveryAvailable = false;
                    else if (cityZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(cityZone.CustomDeliveryFee.Value).Value;
                }
            }

            if (isDeliveryAvailable && deliveryFee == store.DeliverySettings.DeliveryFee)
            {
                var countryZone = await _deliveryZoneRepository.GetZoneAsync(
                    storeId, DeliveryZoneLevel.Country, request.CountryCode, cancellationToken);
                if (countryZone != null)
                {
                    if (!countryZone.IsDeliveryEnabled)
                        isDeliveryAvailable = false;
                    else if (countryZone.CustomDeliveryFee.HasValue)
                        deliveryFee = Money.Create(countryZone.CustomDeliveryFee.Value).Value;
                }
            }
        }

        // Calculate subtotal from current catalog prices (store currency governs the whole order)
        var currencyStr = store.Currency.Code;
        var subtotal = Money.Zero();

        foreach (var item in request.Items)
        {
            var product = await _productRepository.GetByIdAsync(new ProductId(item.ProductId), cancellationToken);
            if (product == null || product.StoreId != storeId)
                return Result.Failure<CalculateOrderDto>(new Error("Order.ProductNotFound",
                    $"Product {item.ProductId} not found"));

            Money unitPrice = product.Pricing.Price;
            if (item.VariantId.HasValue)
            {
                var variant = product.GetVariant(item.VariantId.Value);
                if (variant == null)
                    return Result.Failure<CalculateOrderDto>(new Error("Order.VariantNotFound",
                        $"Variant {item.VariantId} not found for product {item.ProductId}"));

                unitPrice = variant.PriceOverride ?? product.Pricing.Price;
            }

            subtotal = subtotal + (unitPrice * item.Quantity);
        }

        // Calculate payment method adjustment from store configuration
        decimal paymentAdjustmentAmount = 0;
        string? paymentAdjustmentLabel = null;

        if (!string.IsNullOrWhiteSpace(request.PaymentMethod) && config != null)
        {
            var adj = config.PaymentMethodAdjustments
                .FirstOrDefault(a => a.PaymentMethodKey.Equals(request.PaymentMethod, StringComparison.OrdinalIgnoreCase));
            if (adj != null)
            {
                paymentAdjustmentAmount = adj.CalculateAmount(subtotal.Amount);
                paymentAdjustmentLabel = adj.DisplayLabel;
            }
        }

        var effectiveDeliveryFee = isDeliveryAvailable ? deliveryFee : Money.Zero();

        // Tax preview — mirrors OrderPricing: applied to (subtotal + delivery), excluding promo/payment adjustment.
        var taxSettings = config?.TaxSettings;
        var taxRate = (taxSettings?.EffectiveRate ?? 0m) / 100m;
        var pricesIncludeTax = taxSettings?.PricesIncludeTax ?? false;
        var taxableBase = subtotal.Amount + effectiveDeliveryFee.Amount;

        decimal taxAmount = 0m;
        decimal taxableTotalAddition = 0m;
        if (taxRate > 0m)
        {
            if (pricesIncludeTax)
                taxAmount = Math.Round(taxableBase - taxableBase / (1m + taxRate), 2);
            else
            {
                taxAmount = Math.Round(taxableBase * taxRate, 2);
                taxableTotalAddition = taxAmount;
            }
        }

        var totalAmount = subtotal.Amount + effectiveDeliveryFee.Amount + paymentAdjustmentAmount + taxableTotalAddition;

        return Result.Success(new CalculateOrderDto(
            isDeliveryAvailable,
            new MoneyDto(subtotal.Amount, currencyStr),
            new MoneyDto(effectiveDeliveryFee.Amount, currencyStr),
            new MoneyDto(paymentAdjustmentAmount, currencyStr),
            paymentAdjustmentLabel,
            new MoneyDto(totalAmount, currencyStr),
            new MoneyDto(taxAmount, currencyStr),
            taxSettings?.Enabled == true ? taxSettings.Label : null,
            pricesIncludeTax
        ));
    }
}
