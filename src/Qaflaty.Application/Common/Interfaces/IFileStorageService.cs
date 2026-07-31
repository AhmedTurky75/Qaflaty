namespace Qaflaty.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string originalFileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string fileUrl, CancellationToken cancellationToken = default);

    /// <summary>
    /// Opens a previously uploaded file for reading. Returns null when the file no longer exists.
    /// Safe to call outside an HTTP request (e.g. from a background worker).
    /// </summary>
    Task<Stream?> OpenReadAsync(string fileUrl, CancellationToken cancellationToken = default);
}
