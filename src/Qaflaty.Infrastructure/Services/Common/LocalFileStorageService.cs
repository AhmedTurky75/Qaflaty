using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Common;

public class LocalFileStorageService : IFileStorageService
{
    private readonly string _uploadPath;
    private readonly IHttpContextAccessor _httpContextAccessor;

    public LocalFileStorageService(IConfiguration configuration, IHttpContextAccessor httpContextAccessor)
    {
        _httpContextAccessor = httpContextAccessor;

        var contentRootPath = configuration["FileStorage:ContentRootPath"]
            ?? Directory.GetCurrentDirectory();

        _uploadPath = Path.Combine(contentRootPath, "wwwroot", "media", "products");

        Directory.CreateDirectory(_uploadPath);
    }

    public async Task<string> UploadAsync(
        Stream fileStream,
        string originalFileName,
        string contentType,
        CancellationToken cancellationToken = default)
    {
        var extension = Path.GetExtension(originalFileName).ToLowerInvariant();

        // Random unique name — never expose the original filename
        var uniqueFileName = $"{Guid.NewGuid():N}{extension}";
        var filePath = Path.Combine(_uploadPath, uniqueFileName);

        await using var output = new FileStream(filePath, FileMode.Create, FileAccess.Write);
        await fileStream.CopyToAsync(output, cancellationToken);

        var request = _httpContextAccessor.HttpContext!.Request;
        var baseUrl = $"{request.Scheme}://{request.Host}";

        return $"{baseUrl}/media/products/{uniqueFileName}";
    }

    public Task DeleteAsync(string fileUrl, CancellationToken cancellationToken = default)
    {
        if (Uri.TryCreate(fileUrl, UriKind.Absolute, out var uri))
        {
            var fileName = Path.GetFileName(uri.LocalPath);
            var filePath = Path.Combine(_uploadPath, fileName);

            if (File.Exists(filePath))
                File.Delete(filePath);
        }

        return Task.CompletedTask;
    }
}
