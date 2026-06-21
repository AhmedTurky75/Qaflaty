using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Domain.Storefront.Errors;

public static class ReviewErrors
{
    public static readonly Error ReviewsDisabled = new(
        "Reviews.Disabled",
        "Reviews are not enabled for this store.");

    public static readonly Error PurchaseRequired = new(
        "Reviews.PurchaseRequired",
        "Only customers who purchased and received this product can leave a review.");

    public static readonly Error InvalidRating = new(
        "Reviews.InvalidRating",
        "Rating must be between 1 and 5.");

    public static readonly Error AlreadyReviewed = new(
        "Reviews.AlreadyExists",
        "You have already reviewed this product. Edit your existing review instead.");

    public static readonly Error NotFound = new(
        "Reviews.NotFound",
        "Review not found.");

    public static readonly Error NotOwner = new(
        "Reviews.Forbidden",
        "You can only modify your own review.");

    public static readonly Error EditingDisabled = new(
        "Reviews.EditingDisabled",
        "Editing reviews is not allowed for this store.");

    public static readonly Error CommentTooLong = new(
        "Reviews.CommentTooLong",
        "Review comment exceeds the maximum allowed length.");
}
