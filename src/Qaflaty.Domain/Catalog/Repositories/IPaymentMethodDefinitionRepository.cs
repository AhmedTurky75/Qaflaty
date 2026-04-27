using Qaflaty.Domain.Catalog.Aggregates.PaymentMethodDefinition;

namespace Qaflaty.Domain.Catalog.Repositories;

public interface IPaymentMethodDefinitionRepository
{
    Task<List<PaymentMethodDefinition>> GetAllActiveAsync(CancellationToken cancellationToken);
}
