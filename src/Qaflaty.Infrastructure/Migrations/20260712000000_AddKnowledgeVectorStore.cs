using System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;
using Qaflaty.Infrastructure.Persistence;

#nullable disable

namespace Qaflaty.Infrastructure.Migrations
{
    /// <inheritdoc />
    [DbContext(typeof(QaflatyDbContext))]
    [Migration("20260712000000_AddKnowledgeVectorStore")]
    public partial class AddKnowledgeVectorStore : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // pgvector must exist before any vector(N) column is created.
            migrationBuilder.Sql("CREATE EXTENSION IF NOT EXISTS vector;");

            migrationBuilder.CreateTable(
                name: "knowledge_documents",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    source_type = table.Column<int>(type: "integer", nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    source_key = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    original_file_name = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    content_type = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    storage_path = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: true),
                    status = table.Column<int>(type: "integer", nullable: false),
                    error_message = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    chunk_count = table.Column<int>(type: "integer", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_knowledge_documents", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "knowledge_chunks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    document_id = table.Column<Guid>(type: "uuid", nullable: false),
                    store_id = table.Column<Guid>(type: "uuid", nullable: false),
                    chunk_index = table.Column<int>(type: "integer", nullable: false),
                    doc_type = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    title = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    content = table.Column<string>(type: "text", nullable: false),
                    embedding = table.Column<Vector>(type: "vector(768)", nullable: false),
                    name_embedding = table.Column<Vector>(type: "vector(768)", nullable: true),
                    metadata = table.Column<string>(type: "jsonb", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_knowledge_chunks", x => x.id);
                    table.ForeignKey(
                        name: "FK_knowledge_chunks_knowledge_documents_document_id",
                        column: x => x.document_id,
                        principalTable: "knowledge_documents",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "ix_knowledge_documents_store_status",
                table: "knowledge_documents",
                columns: new[] { "store_id", "status" });

            migrationBuilder.CreateIndex(
                name: "ux_knowledge_documents_store_source_key",
                table: "knowledge_documents",
                columns: new[] { "store_id", "source_key" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "ix_knowledge_chunks_store",
                table: "knowledge_chunks",
                column: "store_id");

            migrationBuilder.CreateIndex(
                name: "ix_knowledge_chunks_document",
                table: "knowledge_chunks",
                column: "document_id");

            // Approximate-nearest-neighbour indexes for cosine distance. HNSW handles incremental
            // upserts well (no training/list tuning). Cannot be expressed via the fluent API.
            migrationBuilder.Sql(
                "CREATE INDEX ix_knowledge_chunks_embedding_hnsw ON knowledge_chunks " +
                "USING hnsw (embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);");

            migrationBuilder.Sql(
                "CREATE INDEX ix_knowledge_chunks_name_embedding_hnsw ON knowledge_chunks " +
                "USING hnsw (name_embedding vector_cosine_ops) WITH (m = 16, ef_construction = 64);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "knowledge_chunks");
            migrationBuilder.DropTable(name: "knowledge_documents");
            // The vector extension is intentionally left installed; other objects may depend on it.
        }
    }
}
