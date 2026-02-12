using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.FaqItem;

public sealed class FaqItem : Entity<FaqItemId>
{
    public StoreId StoreId { get; private set; }
    public BilingualText Question { get; private set; } = null!;
    public BilingualText Answer { get; private set; } = null!;
    public int SortOrder { get; private set; }
    public bool IsPublished { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private FaqItem() : base(FaqItemId.Empty) { }

    public static Result<FaqItem> Create(
        StoreId storeId,
        BilingualText question,
        BilingualText answer,
        int sortOrder,
        bool isPublished = true)
    {
        var faq = new FaqItem
        {
            Id = FaqItemId.New(),
            StoreId = storeId,
            Question = question,
            Answer = answer,
            SortOrder = sortOrder,
            IsPublished = isPublished,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        return Result.Success(faq);
    }

    public Result Update(BilingualText question, BilingualText answer, bool isPublished)
    {
        Question = question;
        Answer = answer;
        IsPublished = isPublished;
        UpdatedAt = DateTime.UtcNow;
        return Result.Success();
    }

    public void UpdateSortOrder(int sortOrder)
    {
        SortOrder = sortOrder;
        UpdatedAt = DateTime.UtcNow;
    }
}
