using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.PromoCode;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Ordering.Aggregates.Customer;
using Qaflaty.Domain.Ordering.Aggregates.Order;
using Qaflaty.Domain.Ordering.Repositories;
using Qaflaty.Domain.Ordering.Services;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.UnitTests.Application.Ordering;

internal sealed class FakeOrderRepository : IOrderRepository
{
    public Order? Added { get; private set; }
    public int AddCallCount { get; private set; }

    public Task AddAsync(Order order, CancellationToken ct = default)
    {
        Added = order;
        AddCallCount++;
        return Task.CompletedTask;
    }

    public Task<Order?> GetByIdAsync(OrderId id, CancellationToken ct = default) => Task.FromResult<Order?>(null);
    public Task<Order?> GetByOrderNumberAsync(StoreId storeId, OrderNumber orderNumber, CancellationToken ct = default) => Task.FromResult<Order?>(null);
    public Task<IReadOnlyList<Order>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<IReadOnlyList<Order>> GetByCustomerIdAsync(CustomerId customerId, CancellationToken ct = default) => throw new NotSupportedException();
    public void Update(Order order) { }
}

internal sealed class FakeCustomerRepository : ICustomerRepository
{
    private readonly Customer? _existingByPhone;
    public Customer? Added { get; private set; }

    public FakeCustomerRepository(Customer? existingByPhone = null) => _existingByPhone = existingByPhone;

    public Task<Customer?> GetByPhoneAsync(StoreId storeId, PhoneNumber phone, CancellationToken ct = default)
        => Task.FromResult(_existingByPhone);

    public Task AddAsync(Customer customer, CancellationToken ct = default)
    {
        Added = customer;
        return Task.CompletedTask;
    }

    public Task<Customer?> GetByIdAsync(CustomerId id, CancellationToken ct = default) => Task.FromResult<Customer?>(null);
    public Task<Customer?> GetByEmailAsync(StoreId storeId, string email, CancellationToken ct = default) => Task.FromResult<Customer?>(null);
    public Task<IReadOnlyList<Customer>> GetByStoreIdAsync(StoreId storeId, CancellationToken ct = default) => throw new NotSupportedException();
    public void Update(Customer customer) { }
}

internal sealed class FakeOrderNumberGenerator : IOrderNumberGenerator
{
    public Task<OrderNumber> GenerateAsync(StoreId storeId, CancellationToken ct = default)
        => Task.FromResult(OrderNumber.Parse("QAF-000123").Value);
}

internal sealed class FakeOrderOtpRepository : IOrderOtpRepository
{
    public OrderOtp? Added { get; private set; }

    public Task AddAsync(OrderOtp otp, CancellationToken ct = default)
    {
        Added = otp;
        return Task.CompletedTask;
    }

    public Task<OrderOtp?> GetActiveByOrderIdAsync(OrderId orderId, CancellationToken ct = default) => Task.FromResult<OrderOtp?>(null);
    public Task<OrderOtp?> GetMostRecentByOrderIdAsync(OrderId orderId, CancellationToken ct = default) => Task.FromResult<OrderOtp?>(null);
    public void Update(OrderOtp otp) { }
}

internal sealed class FakeEmailService : IEmailService
{
    public int SentCount { get; private set; }
    public string? LastTo { get; private set; }

    public Task SendEmailAsync(string to, string subject, string htmlBody, CancellationToken ct = default)
    {
        SentCount++;
        LastTo = to;
        return Task.CompletedTask;
    }
}

internal sealed class FakeOtpSettings : IOtpSettings
{
    public string? MockCode { get; }
    public FakeOtpSettings(string? mockCode = "000000") => MockCode = mockCode;
}

internal sealed class FakePromoCodeRepository : IPromoCodeRepository
{
    private readonly PromoCode? _promo;
    private readonly int _customerRedemptions;
    public int UpdateCallCount { get; private set; }
    public int RedemptionAddCount { get; private set; }

    public FakePromoCodeRepository(PromoCode? promo = null, int customerRedemptions = 0)
    {
        _promo = promo;
        _customerRedemptions = customerRedemptions;
    }

    public Task<PromoCode?> GetByCodeAsync(StoreId storeId, string code, CancellationToken ct = default)
        => Task.FromResult(_promo);

    public Task<int> CountCustomerRedemptionsAsync(PromoCodeId promoCodeId, CustomerId customerId, CancellationToken ct = default)
        => Task.FromResult(_customerRedemptions);

    public void Update(PromoCode promoCode) => UpdateCallCount++;

    public Task AddRedemptionAsync(PromoCodeRedemption redemption, CancellationToken ct = default)
    {
        RedemptionAddCount++;
        return Task.CompletedTask;
    }

    public Task<PromoCode?> GetByIdAsync(PromoCodeId id, CancellationToken ct = default) => Task.FromResult<PromoCode?>(null);
    public Task<IReadOnlyList<PromoCode>> GetByStoreAsync(StoreId storeId, CancellationToken ct = default) => throw new NotSupportedException();
    public Task<bool> CodeExistsAsync(StoreId storeId, string code, CancellationToken ct = default) => Task.FromResult(false);
    public Task AddAsync(PromoCode promoCode, CancellationToken ct = default) => Task.CompletedTask;
    public void Delete(PromoCode promoCode) => throw new NotSupportedException();
}
