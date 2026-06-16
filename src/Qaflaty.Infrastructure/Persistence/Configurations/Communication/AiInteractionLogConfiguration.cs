using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.AiInteraction;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Communication;

public class AiInteractionLogConfiguration : IEntityTypeConfiguration<AiInteractionLog>
{
    public void Configure(EntityTypeBuilder<AiInteractionLog> builder)
    {
        builder.ToTable("ai_interaction_logs");

        builder.HasKey(l => l.Id);

        builder.Property(l => l.Id)
            .HasConversion(id => id.Value, value => new AiInteractionId(value))
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(l => l.StoreId)
            .HasConversion(id => id.Value, value => new StoreId(value))
            .HasColumnName("store_id");

        builder.Property(l => l.ConversationId)
            .HasConversion(id => id.Value, value => new ChatConversationId(value))
            .HasColumnName("conversation_id");

        builder.Property(l => l.Type)
            .HasColumnName("event_type")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(l => l.Query)
            .HasColumnName("query")
            .HasMaxLength(500);

        builder.Property(l => l.ProductId)
            .HasColumnName("product_id");

        builder.Property(l => l.DocumentsRetrieved)
            .HasColumnName("documents_retrieved");

        builder.Property(l => l.CreatedAt)
            .HasColumnName("created_at");

        builder.HasIndex(l => new { l.StoreId, l.CreatedAt })
            .HasDatabaseName("ix_ai_interaction_logs_store_created");

        builder.HasIndex(l => new { l.StoreId, l.Type })
            .HasDatabaseName("ix_ai_interaction_logs_store_type");

        builder.Ignore(l => l.DomainEvents);
    }
}
