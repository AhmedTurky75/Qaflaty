using MediatR;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Common.CQRS;

public interface IQueryHandler<TQuery, TResponse> : IRequestHandler<TQuery, Result<TResponse>>
    where TQuery : IQuery<TResponse>
{
}
