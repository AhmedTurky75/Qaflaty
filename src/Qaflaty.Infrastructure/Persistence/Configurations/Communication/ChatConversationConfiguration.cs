using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Common.Identifiers;
using Qaflaty.Domain.Communication.Aggregates.ChatConversation;
using Qaflaty.Domain.Communication.Enums;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Communication;

public sealed class ChatConversationConfiguration : IEntityTypeConfiguration<ChatConversation>
{
    public void Configure(EntityTypeBuilder<ChatConversation> builder)
    {
        builder.ToTable("chat_conversations");

        builder.HasKey(c => c.Id);

        builder.Property(c => c.Id)
            .HasColumnName("id")
            .HasConversion(
                id => id.Value,
                value => new ChatConversationId(value))
            .ValueGeneratedNever();

        builder.Property(c => c.StoreId)
            .HasColumnName("store_id")
            .HasConversion(
                id => id.Value,
                value => new StoreId(value))
            .IsRequired();

        builder.Property(c => c.CustomerId)
            .HasColumnName("customer_id")
            .HasConversion(
                id => id!.Value.Value,
                value => new StoreCustomerId(value))
            .IsRequired(false);

        builder.Property(c => c.GuestSessionId)
            .HasColumnName("guest_session_id")
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(c => c.Status)
            .HasColumnName("status")
            .HasConversion<int>()
            .IsRequired();

        builder.Property(c => c.StartedAt)
            .HasColumnName("started_at")
            .IsRequired();

        builder.Property(c => c.ClosedAt)
            .HasColumnName("closed_at")
            .IsRequired(false);

        builder.Property(c => c.LastMessageAt)
            .HasColumnName("last_message_at")
            .IsRequired(false);

        builder.Property(c => c.UnreadMerchantMessages)
            .HasColumnName("unread_merchant_messages")
            .IsRequired();

        builder.Property(c => c.UnreadCustomerMessages)
            .HasColumnName("unread_customer_messages")
            .IsRequired();

        // Ignore Messages collection - managed separately
        builder.Ignore(c => c.Messages);

        // Indexes
        builder.HasIndex(c => c.StoreId)
            .HasDatabaseName("ix_chat_conversations_store_id");

        builder.HasIndex(c => c.CustomerId)
            .HasDatabaseName("ix_chat_conversations_customer_id");

        builder.HasIndex(c => new { c.StoreId, c.GuestSessionId })
            .HasDatabaseName("ix_chat_conversations_store_guest");

        builder.HasIndex(c => new { c.StoreId, c.Status, c.LastMessageAt })
            .HasDatabaseName("ix_chat_conversations_store_status_lastmessage");
    }
}
