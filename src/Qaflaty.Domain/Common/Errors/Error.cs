namespace Qaflaty.Domain.Common.Errors;

public record Error(string Code, string Message)
{
    public static readonly Error None = new(string.Empty, string.Empty);
    public static readonly Error NullValue = new("Error.NullValue", "Null value was provided");
    public static readonly Error Unauthorized = new("Error.Unauthorized", "You are not authorized to access this resource");
}
