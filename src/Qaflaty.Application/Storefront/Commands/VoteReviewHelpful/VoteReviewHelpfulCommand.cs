using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Storefront.Commands.VoteReviewHelpful;

public record VoteReviewHelpfulCommand(ProductReviewId ReviewId) : ICommand;
