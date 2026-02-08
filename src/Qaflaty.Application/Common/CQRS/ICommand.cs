using MediatR;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Common.CQRS;

public interface ICommand : IRequest<Result>
{
}

public interface ICommand<TResponse> : IRequest<Result<TResponse>>
{
}
