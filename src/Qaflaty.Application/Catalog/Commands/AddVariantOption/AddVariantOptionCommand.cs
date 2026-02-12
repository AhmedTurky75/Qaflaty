using Qaflaty.Application.Common.CQRS;
using Qaflaty.Domain.Common.Identifiers;

namespace Qaflaty.Application.Catalog.Commands.AddVariantOption;

public record AddVariantOptionCommand(
    ProductId ProductId,
    string OptionName,
    List<string> OptionValues
) : ICommand;
