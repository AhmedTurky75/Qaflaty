using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Entities;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Communication;

public sealed class ChatMessageConfiguration : IEntityTypeConfiguration<ChatMessage>
{
    public void Configure(EntityTypeBuilder<ChatMessage> builder)
    {
        builder.ToTable("chat_messages");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.Id)
            .HasColumnName("id")
            .HasConversion(
                id => id.Value,
                value => new ChatMessageId(value))
            .ValueGeneratedNever();

        builder.Property(m => m.ConversationId)
            .HasColumnName("conversation_id")
            .HasConversion(
                id => id.Value,
                value => new ChatConversationId(value))
            .IsRequired();

        builder.Property(m => m.SenderType)
            .HasColumnName("sender_type")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(m => m.SenderId)
            .HasColumnName("sender_id")
            .HasMaxLength(50)
            .IsRequired(false);

        builder.Property(m => m.Content)
            .HasColumnName("content")
            .HasMaxLength(2000)
            .IsRequired();

        builder.Property(m => m.SentAt)
            .HasColumnName("sent_at")
            .IsRequired();

        builder.Property(m => m.ReadAt)
            .HasColumnName("read_at")
            .IsRequired(false);

        // Indexes
        builder.HasIndex(m => m.ConversationId)
            .HasDatabaseName("ix_chat_messages_conversation_id");

        builder.HasIndex(m => new { m.ConversationId, m.SentAt })
            .HasDatabaseName("ix_chat_messages_conversation_sent");
    }
}
