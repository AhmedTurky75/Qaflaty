using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Infrastructure.Persistence.Records;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Communication;

public class KnowledgeChunkConfiguration : IEntityTypeConfiguration<KnowledgeChunkRecord>
{
    public void Configure(EntityTypeBuilder<KnowledgeChunkRecord> builder)
    {
        builder.ToTable("knowledge_chunks");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(c => c.DocumentId)
            .HasColumnName("document_id");

        builder.Property(c => c.StoreId)
            .HasColumnName("store_id");

        builder.Property(c => c.ChunkIndex)
            .HasColumnName("chunk_index");

        builder.Property(c => c.DocType)
            .HasColumnName("doc_type")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(c => c.Title)
            .HasColumnName("title")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(c => c.Content)
            .HasColumnName("content")
            .IsRequired();

        builder.Property(c => c.Embedding)
            .HasColumnName("embedding")
            .HasColumnType($"vector({KnowledgeChunkRecord.Dimensions})")
            .IsRequired();

        builder.Property(c => c.NameEmbedding)
            .HasColumnName("name_embedding")
            .HasColumnType($"vector({KnowledgeChunkRecord.Dimensions})");

        builder.Property(c => c.MetadataJson)
            .HasColumnName("metadata")
            .HasColumnType("jsonb");

        builder.Property(c => c.CreatedAt)
            .HasColumnName("created_at");

        // Drives the mandatory tenant filter on every search.
        builder.HasIndex(c => c.StoreId)
            .HasDatabaseName("ix_knowledge_chunks_store");

        // Supports cascade delete / per-document replacement.
        builder.HasIndex(c => c.DocumentId)
            .HasDatabaseName("ix_knowledge_chunks_document");

        // NOTE: the HNSW vector indexes (embedding, name_embedding) cannot be expressed via the
        // fluent API and are created with raw SQL in the migration.
    }
}
