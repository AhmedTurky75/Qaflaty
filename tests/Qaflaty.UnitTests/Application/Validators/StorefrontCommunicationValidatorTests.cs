using Qaflaty.Application.Communication.Commands.SendChatMessage;
using Qaflaty.Application.Storefront.Commands.SubmitProductReview;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Enums;
using Xunit;

namespace Qaflaty.UnitTests.Application.Validators;

public class SubmitProductReviewCommandValidatorTests
{
    private static readonly SubmitProductReviewCommandValidator Validator = new();

    private static SubmitProductReviewCommand Valid(
        int rating = 5,
        string? title = "Nice",
        string? comment = "Good product",
        IReadOnlyList<ReviewMediaInput>? media = null)
        => new(StoreId.New(), ProductId.New(), StoreCustomerId.New(), rating, title, comment, media);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void RatingOutOfRange_Fails(int rating)
        => Validator.ValidateCommand(Valid(rating: rating)).ShouldHaveErrorFor("Rating");

    [Fact]
    public void TitleTooLong_Fails()
        => Validator.ValidateCommand(Valid(title: new string('x', 201))).ShouldHaveErrorFor("Title");

    [Fact]
    public void CommentTooLong_Fails()
        => Validator.ValidateCommand(Valid(comment: new string('x', 4001))).ShouldHaveErrorFor("Comment");

    [Fact]
    public void InvalidMediaType_Fails()
    {
        var cmd = Valid(media: [new ReviewMediaInput("https://cdn/x.jpg", "Gif")]);

        Validator.ValidateCommand(cmd).ShouldHaveErrorStartingWith("Media[0].Type");
    }

    [Fact]
    public void EmptyMediaUrl_Fails()
    {
        var cmd = Valid(media: [new ReviewMediaInput("", "Image")]);

        Validator.ValidateCommand(cmd).ShouldHaveErrorStartingWith("Media[0].Url");
    }

    [Fact]
    public void ValidMedia_Passes()
        => Validator.ValidateCommand(Valid(media: [new ReviewMediaInput("https://cdn/x.jpg", "Image")])).ShouldBeValid();
}

public class SendChatMessageCommandValidatorTests
{
    private static readonly SendChatMessageCommandValidator Validator = new();

    private static SendChatMessageCommand Valid(
        string content = "Hello",
        MessageSenderType sender = MessageSenderType.Customer)
        => new(Guid.NewGuid(), sender, "sender-1", content);

    [Fact]
    public void Valid_Passes() => Validator.ValidateCommand(Valid()).ShouldBeValid();

    [Fact]
    public void EmptyConversationId_Fails()
        => Validator.ValidateCommand(Valid() with { ConversationId = Guid.Empty }).ShouldHaveErrorFor("ConversationId");

    [Fact]
    public void EmptyContent_Fails()
        => Validator.ValidateCommand(Valid(content: "")).ShouldHaveErrorFor("Content");

    [Fact]
    public void ContentTooLong_Fails()
        => Validator.ValidateCommand(Valid(content: new string('x', 2001))).ShouldHaveErrorFor("Content");

    [Fact]
    public void InvalidSenderType_Fails()
        => Validator.ValidateCommand(Valid(sender: (MessageSenderType)99)).ShouldHaveErrorFor("SenderType");
}
