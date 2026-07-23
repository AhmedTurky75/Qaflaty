namespace Qaflaty.Domain.Storefront.Enums;

/// <summary>Where a downsell trigger rule applies. Downsell never appears at checkout or post-purchase.</summary>
public enum DownsellSurface
{
    ProductDetails = 0,
    Cart = 1
}
