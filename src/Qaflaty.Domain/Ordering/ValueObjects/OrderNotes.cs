using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class OrderNotes : ValueObject
{
    public string? CustomerNotes { get; private set; } // Note left by the customer at checkout, e.g. "Gift wrap please"
    public string? MerchantNotes { get; private set; } // Internal merchant notes (newline-appended); not shown to the customer

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
