using MediatR;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Common.CQRS;

public interface IQuery<TResponse> : IRequest<Result<TResponse>>
{
}
