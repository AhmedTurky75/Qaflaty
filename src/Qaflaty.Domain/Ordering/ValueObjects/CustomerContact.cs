using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class CustomerContact : ValueObject
{
    public PersonName FullName { get; private set; } = null!; // Recipient's full name, e.g. "Ahmed Ali"
    public PhoneNumber Phone { get; private set; } = null!; // Contact phone number (the primary customer identifier in Ordering)
    public Email? Email { get; private set; } // Optional contact email (required when order OTP confirmation is enabled)

    private CustomerContact() { }

    private CustomerContact(PersonName fullName, PhoneNumber phone, Email? email)
    {
        FullName = fullName;
        Phone = phone;
        Email = email;
    }

    public static CustomerContact Create(PersonName fullName, PhoneNumber phone, Email? email = null)
    {
        return new CustomerContact(fullName, phone, email);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return FullName;
        yield return Phone;
        yield return Email;
    }
}
