namespace Qaflaty.Application.Common.Interfaces;

public interface IFileStorageService
{
    Task<string> UploadAsync(Stream fileStream, string originalFileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string fileUrl, CancellationToken cancellationToken = default);
}
