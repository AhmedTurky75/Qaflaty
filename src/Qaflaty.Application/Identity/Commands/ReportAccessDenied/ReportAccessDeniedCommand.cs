using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Identity.Commands.ReportAccessDenied;

public record ReportAccessDeniedCommand(string Endpoint) : ICommand;
