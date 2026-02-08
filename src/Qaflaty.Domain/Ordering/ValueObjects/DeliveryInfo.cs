using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class DeliveryInfo : ValueObject
{
    public Address Address { get; }
    public string? Instructions { get; }

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
