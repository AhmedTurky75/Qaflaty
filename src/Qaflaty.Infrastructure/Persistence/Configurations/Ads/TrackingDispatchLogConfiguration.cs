using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Ads.Aggregates.TrackingEvent;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Ads;

public class TrackingDispatchLogConfiguration : IEntityTypeConfiguration<TrackingDispatchLog>
{
    public void Configure(EntityTypeBuilder<TrackingDispatchLog> builder)
    {
        builder.ToTable("tracking_dispatch_logs");

        builder.HasKey(l => l.Id);
        builder.Property(l => l.Id).HasColumnName("id").ValueGeneratedNever();

        builder.Property(l => l.Provider)
            .HasColumnName("provider")
            .HasConversion<string>();

        builder.Property(l => l.Status)
            .HasColumnName("status")
            .HasConversion<string>();

        builder.Property(l => l.AttemptCount).HasColumnName("attempt_count");
        builder.Property(l => l.LastAttemptAt).HasColumnName("last_attempt_at");
        builder.Property(l => l.NextRetryAt).HasColumnName("next_retry_at");
        builder.Property(l => l.DurationMs).HasColumnName("duration_ms");
        builder.Property(l => l.ResponseStatus).HasColumnName("response_status");
        builder.Property(l => l.ResponseBody).HasColumnName("response_body");
        builder.Property(l => l.ErrorMessage).HasColumnName("error_message").HasMaxLength(1000);
        builder.Property(l => l.CreatedAt).HasColumnName("created_at");
        builder.Property(l => l.UpdatedAt).HasColumnName("updated_at");

        builder.HasIndex("TrackingEventId");
        builder.HasIndex(l => l.NextRetryAt);
        builder.HasIndex(l => l.Status);
    }
}
