using MediatR;

namespace Qaflaty.Application.Common.CQRS;

public interface IQuery<TResponse> : IRequest<TResponse>
{
}
