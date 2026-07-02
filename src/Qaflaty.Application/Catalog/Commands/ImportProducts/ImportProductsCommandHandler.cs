using System.Globalization;
using System.Text;
using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Application.Common.Interfaces;
using Qaflaty.Domain.Catalog.Aggregates.Category;
using Qaflaty.Domain.Catalog.Aggregates.Product;
using Qaflaty.Domain.Catalog.Enums;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Catalog.ValueObjects;
using Qaflaty.Domain.Common.Errors;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Common.ValueObjects;

namespace Qaflaty.Application.Catalog.Commands.ImportProducts;

public class ImportProductsCommandHandler : ICommandHandler<ImportProductsCommand, ImportProductsResultDto>
{
    private readonly IProductRepository _productRepository;
    private readonly ICategoryRepository _categoryRepository;
    private readonly IStoreRepository _storeRepository;
    private readonly ICurrentUserService _currentUserService;

    public ImportProductsCommandHandler(
        IProductRepository productRepository,
        ICategoryRepository categoryRepository,
        IStoreRepository storeRepository,
        ICurrentUserService currentUserService)
    {
        _productRepository = productRepository;
        _categoryRepository = categoryRepository;
        _storeRepository = storeRepository;
        _currentUserService = currentUserService;
    }

    public async Task<Result<ImportProductsResultDto>> Handle(ImportProductsCommand request, CancellationToken cancellationToken)
    {
        var storeId = new StoreId(request.StoreId);
        var store = await _storeRepository.GetByIdAsync(storeId, cancellationToken);
        if (store == null ||
            !await _storeRepository.CanMerchantAccessStoreAsync(
                _currentUserService.MerchantId ?? default, storeId, cancellationToken))
            return Result.Failure<ImportProductsResultDto>(
                new Error("Product.Unauthorized", "You don't have access to this store"));

        if (request.Rows.Count == 0)
            return Result.Failure<ImportProductsResultDto>(
                new Error("Import.Empty", "The file has no data rows."));

        // Existing categories, indexed by English name so rows can reuse them without duplicating.
        var categoryByName = new Dictionary<string, CategoryId>(StringComparer.OrdinalIgnoreCase);
        foreach (var c in await _categoryRepository.GetByStoreIdAsync(storeId, cancellationToken))
            categoryByName.TryAdd(c.Name.English.Trim(), c.Id);

        // Slugs staged within this import aren't visible to IsSlugAvailableAsync (not yet committed),
        // so track them in-memory to avoid duplicates inside the same file.
        var usedProductSlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var usedCategorySlugs = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        var errors = new List<ImportRowErrorDto>();
        int created = 0;
        int categoriesCreated = 0;

        foreach (var row in request.Rows)
        {
            var nameEn = row.NameEn?.Trim();
            if (string.IsNullOrWhiteSpace(nameEn))
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, "Missing product name (name_en)."));
                continue;
            }

            if (!TryParseDecimal(row.Price, out var price) || price < 0)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, $"Invalid price '{row.Price}'."));
                continue;
            }

            decimal? compareAt = null;
            if (!string.IsNullOrWhiteSpace(row.CompareAt))
            {
                if (!TryParseDecimal(row.CompareAt, out var ca) || ca < 0)
                {
                    errors.Add(new ImportRowErrorDto(row.RowNumber, $"Invalid compare-at price '{row.CompareAt}'."));
                    continue;
                }
                compareAt = ca;
            }

            var quantity = 0;
            if (!string.IsNullOrWhiteSpace(row.Quantity) &&
                (!int.TryParse(row.Quantity.Trim(), NumberStyles.Integer, CultureInfo.InvariantCulture, out quantity) || quantity < 0))
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, $"Invalid quantity '{row.Quantity}'."));
                continue;
            }

            // Resolve or create the referenced category (matched by English name within the store).
            CategoryId? categoryId = null;
            var catEn = row.CategoryEn?.Trim();
            if (!string.IsNullOrWhiteSpace(catEn))
            {
                if (!categoryByName.TryGetValue(catEn, out var resolvedCategoryId))
                {
                    var catNameResult = CategoryName.Create(catEn, row.CategoryAr);
                    if (catNameResult.IsFailure)
                    {
                        errors.Add(new ImportRowErrorDto(row.RowNumber, $"Category: {catNameResult.Error.Message}"));
                        continue;
                    }

                    var catSlug = await BuildUniqueCategorySlugAsync(storeId, catEn, usedCategorySlugs, cancellationToken);
                    var catResult = Category.Create(storeId, catNameResult.Value, catSlug);
                    if (catResult.IsFailure)
                    {
                        errors.Add(new ImportRowErrorDto(row.RowNumber, $"Category: {catResult.Error.Message}"));
                        continue;
                    }

                    await _categoryRepository.AddAsync(catResult.Value, cancellationToken);
                    resolvedCategoryId = catResult.Value.Id;
                    categoryByName[catEn] = resolvedCategoryId;
                    categoriesCreated++;
                }

                categoryId = resolvedCategoryId;
            }

            var nameResult = ProductName.Create(nameEn, row.NameAr);
            if (nameResult.IsFailure)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, nameResult.Error.Message));
                continue;
            }

            var slug = await BuildUniqueProductSlugAsync(storeId, nameEn, usedProductSlugs, cancellationToken);

            var priceResult = Money.Create(price, store.Currency);
            if (priceResult.IsFailure)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, priceResult.Error.Message));
                continue;
            }

            Money? compareMoney = null;
            if (compareAt.HasValue)
            {
                var cm = Money.Create(compareAt.Value, store.Currency);
                if (cm.IsFailure)
                {
                    errors.Add(new ImportRowErrorDto(row.RowNumber, cm.Error.Message));
                    continue;
                }
                compareMoney = cm.Value;
            }

            var pricingResult = ProductPricing.Create(priceResult.Value, compareMoney);
            if (pricingResult.IsFailure)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, pricingResult.Error.Message));
                continue;
            }

            var sku = string.IsNullOrWhiteSpace(row.Sku) ? null : row.Sku.Trim();
            var inventoryResult = ProductInventory.Create(quantity, sku, trackInventory: true);
            if (inventoryResult.IsFailure)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, inventoryResult.Error.Message));
                continue;
            }

            var productResult = Product.Create(storeId, nameResult.Value, slug, pricingResult.Value, inventoryResult.Value);
            if (productResult.IsFailure)
            {
                errors.Add(new ImportRowErrorDto(row.RowNumber, productResult.Error.Message));
                continue;
            }

            var product = productResult.Value;
            product.UpdateInfo(nameResult.Value, slug, null, categoryId);

            // Default to Draft; only flip when the row explicitly asks for Active/Inactive.
            if (!string.IsNullOrWhiteSpace(row.Status) &&
                Enum.TryParse<ProductStatus>(row.Status.Trim(), true, out var status))
            {
                if (status == ProductStatus.Active) product.Activate();
                else if (status == ProductStatus.Inactive) product.Deactivate();
            }

            await _productRepository.AddAsync(product, cancellationToken);
            created++;
        }

        return Result.Success(new ImportProductsResultDto(
            request.Rows.Count, created, errors.Count, categoriesCreated, errors));
    }

    private async Task<ProductSlug> BuildUniqueProductSlugAsync(
        StoreId storeId, string name, HashSet<string> used, CancellationToken ct)
    {
        var baseSlug = Slugify(name);
        if (baseSlug.Length < 3) baseSlug = "product";
        if (baseSlug.Length > 90) baseSlug = baseSlug[..90];

        for (var attempt = 1; ; attempt++)
        {
            var candidate = attempt == 1 ? baseSlug : $"{baseSlug}-{attempt}";
            var slugResult = ProductSlug.Create(candidate);
            if (slugResult.IsSuccess &&
                used.Add(candidate) &&
                await _productRepository.IsSlugAvailableAsync(storeId, slugResult.Value, null, ct))
            {
                return slugResult.Value;
            }

            if (attempt > 500)
            {
                var fallback = $"product-{Guid.NewGuid():N}"[..14];
                used.Add(fallback);
                return ProductSlug.Create(fallback).Value;
            }
        }
    }

    private async Task<CategorySlug> BuildUniqueCategorySlugAsync(
        StoreId storeId, string name, HashSet<string> used, CancellationToken ct)
    {
        var baseSlug = Slugify(name);
        if (baseSlug.Length < 2) baseSlug = "category";
        if (baseSlug.Length > 40) baseSlug = baseSlug[..40];

        for (var attempt = 1; ; attempt++)
        {
            var candidate = attempt == 1 ? baseSlug : $"{baseSlug}-{attempt}";
            var slugResult = CategorySlug.Create(candidate);
            if (slugResult.IsSuccess &&
                used.Add(candidate) &&
                await _categoryRepository.IsSlugAvailableAsync(storeId, slugResult.Value, null, ct))
            {
                return slugResult.Value;
            }

            if (attempt > 500)
            {
                var fallback = $"category-{Guid.NewGuid():N}"[..15];
                used.Add(fallback);
                return CategorySlug.Create(fallback).Value;
            }
        }
    }

    /// <summary>Latin-slugifies a name (non a-z0-9 dropped, spaces → dashes). May be empty for
    /// non-Latin input, in which case the callers substitute a "product"/"category" base.</summary>
    private static string Slugify(string input)
    {
        var sb = new StringBuilder(input.Length);
        foreach (var ch in input.Trim().ToLowerInvariant())
        {
            if (ch is >= 'a' and <= 'z' or >= '0' and <= '9')
                sb.Append(ch);
            else if (ch is ' ' or '-' or '_')
                sb.Append('-');
        }

        var slug = sb.ToString();
        while (slug.Contains("--"))
            slug = slug.Replace("--", "-");
        return slug.Trim('-');
    }

    private static bool TryParseDecimal(string? value, out decimal result)
        => decimal.TryParse((value ?? string.Empty).Trim(),
            NumberStyles.Number, CultureInfo.InvariantCulture, out result);
}
