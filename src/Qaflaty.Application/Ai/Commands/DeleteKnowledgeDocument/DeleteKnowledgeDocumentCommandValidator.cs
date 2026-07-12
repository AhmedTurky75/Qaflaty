using FluentValidation;

namespace Qaflaty.Application.Ai.Commands.DeleteKnowledgeDocument;

public class DeleteKnowledgeDocumentCommandValidator : AbstractValidator<DeleteKnowledgeDocumentCommand>
{
    public DeleteKnowledgeDocumentCommandValidator()
    {
        RuleFor(x => x.StoreId).NotEmpty();
        RuleFor(x => x.DocumentId).NotEmpty();
    }
}
