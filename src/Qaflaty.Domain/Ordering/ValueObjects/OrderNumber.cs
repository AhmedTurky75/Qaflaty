using System.Text.RegularExpressions;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Primitives;
using Qaflaty.Domain.Ordering.Errors;

namespace Qaflaty.Domain.Ordering.ValueObjects;

public sealed partial class OrderNumber : ValueObject
{
    public string Value { get; }

    private OrderNumber(string value) => Value = value;

    [GeneratedRegex(@"^QAF-\d{6}$")]
    private static partial Regex OrderNumberPattern();

    public static OrderNumber Generate()
    {
        var random = new Random();
        var number = random.Next(100000, 999999);
        return new OrderNumber($"QAF-{number:D6}");
    }

    public static Result<OrderNumber> Parse(string orderNumber)
    {
        if (string.IsNullOrWhiteSpace(orderNumber) || !OrderNumberPattern().IsMatch(orderNumber))
            return Result.Failure<OrderNumber>(OrderingErrors.InvalidOrderNumber);

        return Result.Success(new OrderNumber(orderNumber));
    }

    protected override IEnumerable<object> GetEqualityComponents()
    {
        yield return Value;
    }
}
