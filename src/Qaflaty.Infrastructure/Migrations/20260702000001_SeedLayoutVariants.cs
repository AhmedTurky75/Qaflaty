using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260702000001_SeedLayoutVariants")]
    public partial class SeedLayoutVariants : Migration
    {
        // Codes match exactly what the storefront renderer switches on
        // (layout-renderer / product-card / product-list). type: 1=Header 2=Footer 3=ProductCard 4=ProductGrid.

        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
INSERT INTO layout_variants (id, type, code, name_en, name_ar, sort_order, is_active) VALUES
    ('11111111-1111-4111-8111-111111110001', 1, 'header-minimal',  'Minimal',       'بسيط',        1, TRUE),
    ('11111111-1111-4111-8111-111111110002', 1, 'header-full',     'Full Width',    'عريض',        2, TRUE),
    ('11111111-1111-4111-8111-111111110003', 1, 'header-centered', 'Centered',      'موسّط',       3, TRUE),
    ('11111111-1111-4111-8111-111111110004', 1, 'header-sidebar',  'Sidebar',       'شريط جانبي',  4, TRUE),
    ('22222222-2222-4222-8222-222222220001', 2, 'footer-standard', 'Standard',      'قياسي',       1, TRUE),
    ('22222222-2222-4222-8222-222222220002', 2, 'footer-minimal',  'Minimal',       'بسيط',        2, TRUE),
    ('22222222-2222-4222-8222-222222220003', 2, 'footer-centered', 'Centered',      'موسّط',       3, TRUE),
    ('33333333-3333-4333-8333-333333330001', 3, 'card-standard',   'Standard',      'قياسي',       1, TRUE),
    ('33333333-3333-4333-8333-333333330002', 3, 'card-minimal',    'Minimal',       'بسيط',        2, TRUE),
    ('33333333-3333-4333-8333-333333330003', 3, 'card-detailed',   'Detailed',      'تفصيلي',      3, TRUE),
    ('33333333-3333-4333-8333-333333330004', 3, 'card-overlay',    'Overlay',       'متراكب',      4, TRUE),
    ('44444444-4444-4444-8444-444444440002', 4, 'grid-2',          'Two Columns',   'عمودان',      1, TRUE),
    ('44444444-4444-4444-8444-444444440003', 4, 'grid-3',          'Three Columns', 'ثلاثة أعمدة', 2, TRUE),
    ('44444444-4444-4444-8444-444444440004', 4, 'grid-4',          'Four Columns',  'أربعة أعمدة', 3, TRUE),
    ('44444444-4444-4444-8444-444444440005', 4, 'grid-masonry',    'Masonry',       'متداخل',      4, TRUE);
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DELETE FROM layout_variants WHERE id IN (
    '11111111-1111-4111-8111-111111110001',
    '11111111-1111-4111-8111-111111110002',
    '11111111-1111-4111-8111-111111110003',
    '11111111-1111-4111-8111-111111110004',
    '22222222-2222-4222-8222-222222220001',
    '22222222-2222-4222-8222-222222220002',
    '22222222-2222-4222-8222-222222220003',
    '33333333-3333-4333-8333-333333330001',
    '33333333-3333-4333-8333-333333330002',
    '33333333-3333-4333-8333-333333330003',
    '33333333-3333-4333-8333-333333330004',
    '44444444-4444-4444-8444-444444440002',
    '44444444-4444-4444-8444-444444440003',
    '44444444-4444-4444-8444-444444440004',
    '44444444-4444-4444-8444-444444440005'
);
");
        }
    }
}
