using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.ValueObjects;

namespace Qaflaty.Domain.Ordering.Aggregates.Customer;

public sealed class Customer : AggregateRoot<CustomerId>
{
    public StoreId StoreId { get; private set; } // Store this customer record belongs to (customers are per-store)
    public CustomerContact Contact { get; private set; } = null!; // Name, phone, and optional email of the customer
    public Address Address { get; private set; } = null!; // The customer's default delivery address
    public string? Notes { get; private set; } // Internal merchant notes about the customer (newline-appended)
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the customer record was created

    private Customer() : base(CustomerId.Empty) { }

    public static Result<Customer> Create(
        StoreId storeId,
        CustomerContact contact,
        Address address)
    {
        var customer = new Customer
        {
            Id = CustomerId.New(),
            StoreId = storeId,
            Contact = contact,
            Address = address,
            CreatedAt = DateTime.UtcNow
        };

        return Result.Success(customer);
    }

    public Result UpdateContact(CustomerContact contact)
    {
        Contact = contact;
        return Result.Success();
    }

    public Result UpdateAddress(Address address)
    {
        Address = address;
        return Result.Success();
    }

    public void AddNote(string note)
    {
        Notes = string.IsNullOrWhiteSpace(Notes)
            ? note
            : $"{Notes}\n{note}";
    }
}
