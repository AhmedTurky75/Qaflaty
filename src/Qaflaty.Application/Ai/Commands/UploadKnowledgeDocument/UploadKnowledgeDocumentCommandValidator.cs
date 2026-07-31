using FluentValidation;

namespace Qaflaty.Application.Ai.Commands.UploadKnowledgeDocument;

public class UploadKnowledgeDocumentCommandValidator : AbstractValidator<UploadKnowledgeDocumentCommand>
{
    public UploadKnowledgeDocumentCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.Content).NotNull();
        RuleFor(x => x.FileName).NotEmpty().MaximumLength(500);
        RuleFor(x => x.ContentType).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Title).MaximumLength(500);
    }
}
