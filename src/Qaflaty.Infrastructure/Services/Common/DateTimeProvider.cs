using Qaflaty.Application.Common.Interfaces;

namespace Qaflaty.Infrastructure.Services.Common;

public class DateTimeProvider : IDateTimeProvider
{
    public DateTime UtcNow => DateTime.UtcNow;
}
