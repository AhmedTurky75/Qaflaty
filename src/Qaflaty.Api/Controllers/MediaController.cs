using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Qaflaty.Api.Common;
using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Api.Controllers;

[Route("api/stores/{storeId:guid}/media")]
[Authorize(Policy = "MerchantPolicy")]
public class MediaController : ApiController
{
    private const int MaxFilesPerRequest = 10;
    private const long MaxFileSizeBytes = 5 * 1024 * 1024; // 5 MB

    private const long MaxVideoSizeBytes = 20 * 1024 * 1024; // 20 MB

    private static readonly string[] AllowedContentTypes =
    [
        "image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"
    ];

    private static readonly string[] AllowedVideoContentTypes =
    [
        "video/mp4", "video/webm", "video/ogg", "video/quicktime"
    ];

    [HttpPost("upload")]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadImages(
        Guid storeId,
        [FromForm] List<IFormFile> files,
        CancellationToken cancellationToken)
    {
        if (files is not { Count: > 0 })
            return BadRequest(new { message = "No files were provided." });

        if (files.Count > MaxFilesPerRequest)
            return BadRequest(new { message = $"Maximum {MaxFilesPerRequest} images allowed per upload." });

        var fileStorage = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
        var uploadedUrls = new List<string>(files.Count);

        foreach (var file in files)
        {
            if (file.Length == 0)
                continue;

            if (file.Length > MaxFileSizeBytes)
                return BadRequest(new { message = $"File exceeds the 5 MB size limit." });

            if (!AllowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
                return BadRequest(new { message = "Unsupported file type. Allowed: JPEG, PNG, WebP, GIF." });

            await using var stream = file.OpenReadStream();
            var url = await fileStorage.UploadAsync(stream, file.FileName, file.ContentType, cancellationToken);
            uploadedUrls.Add(url);
        }

        return Ok(new { urls = uploadedUrls });
    }

    [HttpPost("upload-video")]
    [RequestSizeLimit(MaxVideoSizeBytes + 1024 * 1024)]
    [RequestFormLimits(MultipartBodyLengthLimit = MaxVideoSizeBytes + 1024 * 1024)]
    [ProducesResponseType(StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status400BadRequest)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> UploadVideo(
        Guid storeId,
        IFormFile file,
        CancellationToken cancellationToken)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "No file was provided." });

        if (file.Length > MaxVideoSizeBytes)
            return BadRequest(new { message = "Video exceeds the 20 MB size limit." });

        if (!AllowedVideoContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            return BadRequest(new { message = "Unsupported video type. Allowed: MP4, WebM, OGG, MOV." });

        var fileStorage = HttpContext.RequestServices.GetRequiredService<IFileStorageService>();
        await using var stream = file.OpenReadStream();
        var url = await fileStorage.UploadAsync(stream, file.FileName, file.ContentType, cancellationToken);

        return Ok(new { url });
    }
}
