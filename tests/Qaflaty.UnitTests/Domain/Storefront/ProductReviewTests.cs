using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Storefront.Aggregates.ProductReview;
using Qaflaty.Domain.Storefront.Enums;
using Xunit;

namespace Qaflaty.UnitTests.Domain.Storefront;

public class ProductReviewTests
{
    private static global::Qaflaty.Domain.Storefront.Aggregates.ProductReview.ProductReview Create(
        int rating = 5,
        string? title = "Great",
        string? comment = "Loved it",
        OrderId? verifiedOrderId = null,
        bool autoApprove = false)
        => ProductReview.Create(
            StoreId.New(), ProductId.New(), StoreCustomerId.New(), "Ahmed",
            rating, title, comment, verifiedOrderId, autoApprove).Value;

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    [InlineData(-1)]
    public void Create_InvalidRating_Fails(int rating)
    {
        var result = ProductReview.Create(
            StoreId.New(), ProductId.New(), StoreCustomerId.New(), "Ahmed",
            rating, null, null, null, false);

        Assert.True(result.IsFailure);
        Assert.Equal("Reviews.InvalidRating", result.Error.Code);
    }

    [Fact]
    public void Create_CommentTooLong_Fails()
    {
        var longComment = new string('x', ProductReview.MaxCommentLength + 1);

        var result = ProductReview.Create(
            StoreId.New(), ProductId.New(), StoreCustomerId.New(), "Ahmed",
            5, null, longComment, null, false);

        Assert.True(result.IsFailure);
        Assert.Equal("Reviews.CommentTooLong", result.Error.Code);
    }

    [Fact]
    public void Create_WithoutAutoApprove_IsPendingAndNotPublic()
    {
        var review = Create(autoApprove: false);

        Assert.Equal(ReviewStatus.Pending, review.Status);
        Assert.False(review.IsPublic);
        Assert.Null(review.ApprovedAt);
    }

    [Fact]
    public void Create_WithAutoApprove_IsApprovedAndPublic()
    {
        var review = Create(autoApprove: true);

        Assert.Equal(ReviewStatus.Approved, review.Status);
        Assert.True(review.IsPublic);
        Assert.NotNull(review.ApprovedAt);
    }

    [Fact]
    public void Create_WithVerifiedOrder_MarksVerifiedPurchase()
    {
        var review = Create(verifiedOrderId: OrderId.New());

        Assert.True(review.IsVerifiedPurchase);
    }

    [Fact]
    public void Create_WithoutOrder_IsNotVerifiedPurchase()
    {
        var review = Create(verifiedOrderId: null);

        Assert.False(review.IsVerifiedPurchase);
    }

    [Fact]
    public void UpdateContent_ApprovedReview_ReentersModeration_WhenNotAutoApprove()
    {
        var review = Create(autoApprove: true); // Approved

        review.UpdateContent(4, "Updated", "Changed my mind a bit", autoApprove: false);

        Assert.Equal(ReviewStatus.Pending, review.Status);
        Assert.Null(review.ApprovedAt);
    }

    [Fact]
    public void UpdateContent_InvalidRating_Fails()
    {
        var review = Create();

        var result = review.UpdateContent(0, null, null, false);

        Assert.True(result.IsFailure);
        Assert.Equal("Reviews.InvalidRating", result.Error.Code);
    }

    [Fact]
    public void Reject_ClearsApproval()
    {
        var review = Create(autoApprove: true);

        review.Reject();

        Assert.Equal(ReviewStatus.Rejected, review.Status);
        Assert.Null(review.ApprovedAt);
        Assert.False(review.IsPublic);
    }

    [Fact]
    public void AddMedia_AppendsMedia()
    {
        var review = Create();

        review.AddMedia("https://cdn/img1.jpg", ReviewMediaType.Image);
        review.AddMedia("https://cdn/img2.jpg", ReviewMediaType.Image);

        Assert.Equal(2, review.Media.Count);
    }

    [Fact]
    public void IncrementHelpful_IncreasesCount()
    {
        var review = Create();

        review.IncrementHelpful();
        review.IncrementHelpful();

        Assert.Equal(2, review.HelpfulCount);
    }

    [Fact]
    public void SetPinned_TogglesFlag()
    {
        var review = Create();

        review.SetPinned(true);
        Assert.True(review.IsPinned);

        review.SetPinned(false);
        Assert.False(review.IsPinned);
    }
}
