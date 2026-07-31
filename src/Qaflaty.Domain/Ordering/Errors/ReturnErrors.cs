using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Ordering.Errors;

public static class ReturnErrors
{
    public static readonly Error NotFound =
        new("Return.NotFound", "Return request not found");

    public static readonly Error OrderNotEligible =
        new("Return.OrderNotEligible", "Only delivered orders can be returned");

    public static readonly Error NoItems =
        new("Return.NoItems", "Select at least one item to return");

    public static readonly Error ItemNotInOrder =
        new("Return.ItemNotInOrder", "A selected item is not part of this order");

    public static readonly Error InvalidQuantity =
        new("Return.InvalidQuantity", "Return quantity must be between 1 and the quantity ordered");

    public static readonly Error AlreadyRequested =
        new("Return.AlreadyRequested", "A return request for this order is already open");

    public static readonly Error InvalidStatusTransition =
        new("Return.InvalidStatusTransition", "This return cannot change to the requested state");

    public static readonly Error ReasonRequired =
        new("Return.ReasonRequired", "A reason is required");
}
