using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class DeliveryInfo : ValueObject
{
    public Address Address { get; private set; } = null!; // The shipping destination address for the order
    public string? Instructions { get; private set; } // Optional delivery instructions from the customer, e.g. "Leave at the door"

    private DeliveryInfo() { }

    private DeliveryInfo(Address address, string? instructions)
    {
        Address = address;
        Instructions = instructions;
    }

    public static DeliveryInfo Create(Address address, string? instructions = null)
    {
        return new DeliveryInfo(address, instructions?.Trim());
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Address;
        yield return Instructions;
    }
}
