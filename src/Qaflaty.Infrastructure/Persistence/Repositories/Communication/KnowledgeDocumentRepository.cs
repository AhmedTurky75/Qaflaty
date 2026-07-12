using Microsoft.EntityFrameworkCore;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Infrastructure.Persistence.Repositories.Communication;

public class KnowledgeDocumentRepository : IKnowledgeDocumentRepository
{
    private readonly QaflatyDbContext _context;

    public KnowledgeDocumentRepository(QaflatyDbContext context)
    {
        _context = context;
    }

    public async Task AddAsync(KnowledgeDocument document, CancellationToken ct = default)
        => await _context.KnowledgeDocuments.AddAsync(document, ct);

    public void Update(KnowledgeDocument document)
        => _context.KnowledgeDocuments.Update(document);

    public void Delete(KnowledgeDocument document)
        => _context.KnowledgeDocuments.Remove(document);

    public async Task<KnowledgeDocument?> GetByIdAsync(
        StoreId storeId, KnowledgeDocumentId id, CancellationToken ct = default)
        => await _context.KnowledgeDocuments
            .FirstOrDefaultAsync(d => d.Id == id && d.StoreId == storeId, ct);

    public async Task<IReadOnlyList<KnowledgeDocument>> GetByStoreAsync(
        StoreId storeId, CancellationToken ct = default)
        => await _context.KnowledgeDocuments
            .AsNoTracking()
            .Where(d => d.StoreId == storeId)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<KnowledgeDocument>> GetDerivedByStoreAsync(
        StoreId storeId, CancellationToken ct = default)
        => await _context.KnowledgeDocuments
            .Where(d => d.StoreId == storeId && d.SourceType != KnowledgeSourceType.Upload)
            .ToListAsync(ct);

    public async Task<IReadOnlyList<KnowledgeDocument>> GetByStoreAndSourceAsync(
        StoreId storeId, KnowledgeSourceType sourceType, CancellationToken ct = default)
        => await _context.KnowledgeDocuments
            .AsNoTracking()
            .Where(d => d.StoreId == storeId && d.SourceType == sourceType)
            .OrderByDescending(d => d.UpdatedAt)
            .ToListAsync(ct);
}
