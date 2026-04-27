using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Catalog.Repositories;
using Qaflaty.Domain.Common.Errors;

namespace Qaflaty.Application.Catalog.Queries.GetPaymentMethodOptions;

public class GetPaymentMethodOptionsQueryHandler
    : IQueryHandler<GetPaymentMethodOptionsQuery, List<PaymentMethodOptionDto>>
{
    private readonly IPaymentMethodDefinitionRepository _definitionRepo;

    public GetPaymentMethodOptionsQueryHandler(IPaymentMethodDefinitionRepository definitionRepo)
    {
        _definitionRepo = definitionRepo;
    }

    public async Task<Result<List<PaymentMethodOptionDto>>> Handle(
        GetPaymentMethodOptionsQuery request,
        CancellationToken cancellationToken)
    {
        var definitions = await _definitionRepo.GetAllActiveAsync(cancellationToken);

        var dtos = definitions
            .Select(d => new PaymentMethodOptionDto(d.Key, d.DefaultLabel, d.DefaultDescription))
            .ToList();

        return Result.Success(dtos);
    }
}
