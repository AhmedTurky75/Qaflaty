using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Common.ValueObjects;
using Qaflaty.Domain.Identity.ValueObjects;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed class CustomerContact : ValueObject
{
    public PersonName FullName { get; }
    public PhoneNumber Phone { get; }
    public Email? Email { get; }

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
