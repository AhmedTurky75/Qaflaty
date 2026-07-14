namespace Qaflaty.Application.Analytics.DTOs;

public record ProductViewerCountDto(Guid ProductId, int ViewerCount);

public record LiveMetricsDto(
    int ActiveUsers,
    int ActiveCartCount,
    List<ProductViewerCountDto> ProductViewers);
