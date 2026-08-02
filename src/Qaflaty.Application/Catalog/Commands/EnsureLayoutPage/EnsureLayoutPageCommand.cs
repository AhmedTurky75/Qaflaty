using Qaflaty.Application.Catalog.DTOs;
using Qaflaty.Application.Common.CQRS;

namespace Qaflaty.Application.Catalog.Commands.EnsureLayoutPage;

/// <summary>
/// Returns the store's header or footer layout group, creating it if the store
/// predates them. Idempotent: calling it twice yields the same page.
/// </summary>
/// <param name="LayoutType">"Header" or "Footer".</param>
public record EnsureLayoutPageCommand(Guid StoreId, string LayoutType) : ICommand<PageConfigurationDto>;
