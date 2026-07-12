using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.Knowledge;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Communication;

public class KnowledgeDocumentConfiguration : IEntityTypeConfiguration<KnowledgeDocument>
{
    public void Configure(EntityTypeBuilder<KnowledgeDocument> builder)
    {
        builder.ToTable("knowledge_documents");

        builder.HasKey(d => d.Id);

        builder.Property(d => d.Id)
            .HasConversion(id => id.Value, value => new KnowledgeDocumentId(value))
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(d => d.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(d => d.SourceType)
            .HasColumnName("source_type")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.Title)
            .HasColumnName("title")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(d => d.SourceKey)
            .HasColumnName("source_key")
            .HasMaxLength(200);

        builder.Property(d => d.OriginalFileName)
            .HasColumnName("original_file_name")
            .HasMaxLength(500);

        builder.Property(d => d.ContentType)
            .HasColumnName("content_type")
            .HasMaxLength(200);

        builder.Property(d => d.StoragePath)
            .HasColumnName("storage_path")
            .HasMaxLength(1000);

        builder.Property(d => d.Status)
            .HasColumnName("status")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(d => d.ErrorMessage)
            .HasColumnName("error_message")
            .HasMaxLength(2000);

        builder.Property(d => d.ChunkCount)
            .HasColumnName("chunk_count");

        builder.Property(d => d.CreatedAt)
            .HasColumnName("created_at");

        builder.Property(d => d.UpdatedAt)
            .HasColumnName("updated_at");

        builder.HasIndex(d => new { d.StoreId, d.Status })
            .HasDatabaseName("ix_knowledge_documents_store_status");

        // Idempotent upsert key for derived documents. source_key is NULL for uploads and Postgres
        // treats NULLs as distinct, so many uploads coexist while each derived key stays unique per store.
        builder.HasIndex(d => new { d.StoreId, d.SourceKey })
            .IsUnique()
            .HasDatabaseName("ux_knowledge_documents_store_source_key");

        builder.Ignore(d => d.DomainEvents);
    }
}
