using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.Primitives;

namespace Qaflaty.Domain.Catalog.Aggregates.FaqItem;

public sealed class FaqItem : Entity<FaqItemId>
{
    public StoreId StoreId { get; private set; } // Store this FAQ entry belongs to
    public BilingualText Question { get; private set; } = null!; // The FAQ question in Arabic + English
    public BilingualText Answer { get; private set; } = null!; // The FAQ answer in Arabic + English
    public int SortOrder { get; private set; } // Display order among FAQ items (lower = first)
    public bool IsPublished { get; private set; } // Whether the item is visible on the storefront FAQ page
    public DateTime CreatedAt { get; private set; } // UTC timestamp when the FAQ item was created
    public DateTime UpdatedAt { get; private set; } // UTC timestamp of the last change

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
