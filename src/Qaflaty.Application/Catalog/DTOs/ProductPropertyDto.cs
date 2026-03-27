namespace Qaflaty.Application.Catalog.DTOs;

public record ProductPropertyDefinitionDto(
    Guid Id,
    Guid StoreId,
    string Name,
    string DisplayName,
    string Type,
    List<string> Options,
    bool IsRequired,
    bool IsFilterable,
    int SortOrder);

public record ProductPropertyValueDto(
    Guid Id,
    Guid DefinitionId,
    string DefinitionName,
    string Value);
