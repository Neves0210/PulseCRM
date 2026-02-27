using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PulseCRM.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class KanbanDeals : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "pipeline_stages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Order = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_pipeline_stages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_pipeline_stages_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deals",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    StageId = table.Column<Guid>(type: "uuid", nullable: false),
                    Title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Company = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: true),
                    Amount = table.Column<decimal>(type: "numeric", nullable: true),
                    Status = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deals", x => x.Id);
                    table.ForeignKey(
                        name: "FK_deals_pipeline_stages_StageId",
                        column: x => x.StageId,
                        principalTable: "pipeline_stages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_deals_tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "deal_stage_history",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    DealId = table.Column<Guid>(type: "uuid", nullable: false),
                    FromStageId = table.Column<Guid>(type: "uuid", nullable: false),
                    ToStageId = table.Column<Guid>(type: "uuid", nullable: false),
                    MovedByUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    MovedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_deal_stage_history", x => x.Id);
                    table.ForeignKey(
                        name: "FK_deal_stage_history_deals_DealId",
                        column: x => x.DealId,
                        principalTable: "deals",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_deal_stage_history_DealId",
                table: "deal_stage_history",
                column: "DealId");

            migrationBuilder.CreateIndex(
                name: "IX_deal_stage_history_TenantId_DealId_MovedAtUtc",
                table: "deal_stage_history",
                columns: new[] { "TenantId", "DealId", "MovedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_deals_StageId",
                table: "deals",
                column: "StageId");

            migrationBuilder.CreateIndex(
                name: "IX_deals_TenantId_StageId_CreatedAtUtc",
                table: "deals",
                columns: new[] { "TenantId", "StageId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_pipeline_stages_TenantId_Order",
                table: "pipeline_stages",
                columns: new[] { "TenantId", "Order" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "deal_stage_history");

            migrationBuilder.DropTable(
                name: "deals");

            migrationBuilder.DropTable(
                name: "pipeline_stages");
        }
    }
}
