using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class OrderNotes : ValueObject
{
    public string? CustomerNotes { get; private set; }
    public string? MerchantNotes { get; private set; }

    private OrderNotes() { }

    private OrderNotes(string? customerNotes, string? merchantNotes)
    {
        CustomerNotes = customerNotes;
        MerchantNotes = merchantNotes;
    }

    public static OrderNotes Create(string? customerNotes = null, string? merchantNotes = null)
    {
        return new OrderNotes(customerNotes, merchantNotes);
    }

    public void AddMerchantNote(string note)
    {
        MerchantNotes = string.IsNullOrWhiteSpace(MerchantNotes)
            ? note
            : $"{MerchantNotes}\n{note}";
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return CustomerNotes;
        yield return MerchantNotes;
    }
}
