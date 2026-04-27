using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using Qaflaty.Domain.Identity.Aggregates.AccessDeniedReport;

namespace Qaflaty.Infrastructure.Persistence.Configurations.Identity;

public class AccessDeniedReportConfiguration : IEntityTypeConfiguration<AccessDeniedReport>
{
    public void Configure(EntityTypeBuilder<AccessDeniedReport> builder)
    {
        builder.ToTable("access_denied_reports");

        builder.HasKey(r => r.Id);

        builder.Property(r => r.Id)
            .HasColumnName("id")
            .ValueGeneratedNever();

        builder.Property(r => r.UserId)
            .HasColumnName("user_id")
            .HasMaxLength(100)
            .IsRequired(false);

        builder.Property(r => r.UserType)
            .HasColumnName("user_type")
            .HasMaxLength(20)
            .IsRequired();

        builder.Property(r => r.Endpoint)
            .HasColumnName("endpoint")
            .HasMaxLength(500)
            .IsRequired();

        builder.Property(r => r.ReportedAt)
            .HasColumnName("reported_at")
            .IsRequired();

        builder.Property(r => r.IsReviewed)
            .HasColumnName("is_reviewed")
            .IsRequired();

        builder.HasIndex(r => r.UserId);
        builder.HasIndex(r => r.ReportedAt);
    }
}
