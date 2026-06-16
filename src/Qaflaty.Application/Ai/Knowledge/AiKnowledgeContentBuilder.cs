using System.Globalization;
using System.Text;
using Qaflaty.Application.Common.Interfaces.Ai;
using Qaflaty.Domain.Catalog.Aggregates.FaqItem;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Aggregates.Store;
using StoreConfigurationEntity = Qaflaty.Domain.Catalog.Aggregates.StoreConfiguration.StoreConfiguration;

namespace Qaflaty.Application.Ai.Knowledge;

/// <summary>
/// A piece of store knowledge ready to be embedded. The vector store turns each draft
/// into an <see cref="AiKnowledgeDocument"/> once its <see cref="Content"/> is embedded.
/// </summary>
public sealed record AiKnowledgeDraft(
    string Id,
    string Type,
    string Title,
    string Content,
    IReadOnlyDictionary<string, string>? Metadata = null);

/// <summary>
/// Converts a store's structured data (profile, social links, FAQ, products) into
/// plain-text knowledge drafts suitable for embedding and retrieval.
/// </summary>
public static class AiKnowledgeContentBuilder
{
    public static IReadOnlyList<AiKnowledgeDraft> Build(
        Store store,
        StoreConfigurationEntity config,
        IReadOnlyList<FaqItem> faqs,
        IReadOnlyList<Product> products,
        IReadOnlyDictionary<Guid, string> categoryNames,
        IReadOnlyDictionary<Guid, ProductPropertyDefinition> propertyDefinitions)
    {
        var drafts = new List<AiKnowledgeDraft>();

        drafts.Add(BuildStoreProfile(store, config));

        var socialDraft = BuildSocialAndContact(store, config);
        if (socialDraft is not null)
            drafts.Add(socialDraft);

        foreach (var faq in faqs)
            drafts.Add(BuildFaq(faq));

        foreach (var product in products)
            drafts.Add(BuildProduct(product, categoryNames, propertyDefinitions));

        return drafts;
    }

    private static AiKnowledgeDraft BuildStoreProfile(Store store, StoreConfigurationEntity config)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Store name: {store.Name.Value}");
        if (!string.IsNullOrWhiteSpace(store.Description))
            sb.AppendLine($"About: {store.Description}");
        sb.AppendLine($"Default language: {config.LocalizationSettings.DefaultLanguage}");

        return new AiKnowledgeDraft(
            "store-info",
            AiKnowledgeDocumentType.Store,
            "Store information",
            sb.ToString().Trim());
    }

    private static AiKnowledgeDraft? BuildSocialAndContact(Store store, StoreConfigurationEntity config)
    {
        var sb = new StringBuilder();
        var social = config.SocialLinks;
        var comm = config.CommunicationSettings;

        AppendIf(sb, "Facebook", social.Facebook);
        AppendIf(sb, "Instagram", social.Instagram);
        AppendIf(sb, "Twitter/X", social.Twitter);
        AppendIf(sb, "TikTok", social.TikTok);
        AppendIf(sb, "Snapchat", social.Snapchat);
        AppendIf(sb, "YouTube", social.YouTube);

        if (comm.WhatsAppEnabled && !string.IsNullOrWhiteSpace(comm.WhatsAppNumber))
            sb.AppendLine($"WhatsApp: {comm.WhatsAppNumber}");

        if (sb.Length == 0)
            return null;

        return new AiKnowledgeDraft(
            "store-contact",
            AiKnowledgeDocumentType.Store,
            "Contact and social media",
            $"Ways to reach {store.Name.Value}:\n{sb.ToString().Trim()}");
    }

    private static AiKnowledgeDraft BuildFaq(FaqItem faq)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Question (English): {faq.Question.English}");
        sb.AppendLine($"Answer (English): {faq.Answer.English}");
        sb.AppendLine($"Question (Arabic): {faq.Question.Arabic}");
        sb.AppendLine($"Answer (Arabic): {faq.Answer.Arabic}");

        return new AiKnowledgeDraft(
            $"faq-{faq.Id.Value}",
            AiKnowledgeDocumentType.Faq,
            faq.Question.English,
            sb.ToString().Trim());
    }

    private static AiKnowledgeDraft BuildProduct(
        Product product,
        IReadOnlyDictionary<Guid, string> categoryNames,
        IReadOnlyDictionary<Guid, ProductPropertyDefinition> propertyDefinitions)
    {
        var sb = new StringBuilder();
        sb.AppendLine($"Product: {product.Name.Value}");

        if (product.CategoryId is { } categoryId &&
            categoryNames.TryGetValue(categoryId.Value, out var categoryName))
            sb.AppendLine($"Category: {categoryName}");

        if (!string.IsNullOrWhiteSpace(product.Description))
            sb.AppendLine($"Description: {product.Description}");

        var price = product.Pricing.Price;
        sb.AppendLine($"Price: {price.Amount:0.##} {price.Currency}");
        if (product.Pricing.HasDiscount && product.Pricing.CompareAtPrice is { } compareAt)
            sb.AppendLine($"Was: {compareAt.Amount:0.##} {compareAt.Currency} (on sale)");

        sb.AppendLine($"Availability: {DescribeStock(product)}");

        foreach (var pv in product.PropertyValues)
        {
            if (propertyDefinitions.TryGetValue(pv.DefinitionId.Value, out var def))
                sb.AppendLine($"{def.DisplayName}: {pv.Value}");
        }

        var metadata = new Dictionary<string, string>
        {
            ["productId"] = product.Id.Value.ToString(),
            ["slug"] = product.Slug.Value,
            ["price"] = price.Amount.ToString("0.##", CultureInfo.InvariantCulture),
            ["currency"] = price.Currency.ToString(),
            ["inStock"] = product.Inventory.InStock.ToString()
        };

        var image = product.Images.OrderBy(i => i.SortOrder).FirstOrDefault();
        if (image is not null && !string.IsNullOrWhiteSpace(image.Url))
            metadata["imageUrl"] = image.Url;

        return new AiKnowledgeDraft(
            $"product-{product.Id.Value}",
            AiKnowledgeDocumentType.Product,
            product.Name.Value,
            sb.ToString().Trim(),
            metadata);
    }

    private static string DescribeStock(Product product)
    {
        if (!product.Inventory.InStock)
            return "Out of stock";
        if (product.Inventory.LowStock)
            return "Low stock - only a few left";
        return "In stock";
    }

    private static void AppendIf(StringBuilder sb, string label, string? value)
    {
        if (!string.IsNullOrWhiteSpace(value))
            sb.AppendLine($"{label}: {value}");
    }
}
