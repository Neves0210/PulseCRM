using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Tenants;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using PulseCRM.Api.Auth;

var builder = WebApplication.CreateBuilder(args);

// Controllers + API behavior
builder.Services.AddControllers();
builder.Services.AddProblemDetails();

builder.Services.AddScoped<TenantContext>();

// Swagger / OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<AppDbContext>(options =>
{
    var cs =
        builder.Configuration.GetConnectionString("Default")
        ?? builder.Configuration["DATABASE_URL"];

    if (string.IsNullOrWhiteSpace(cs))
        throw new InvalidOperationException("Database connection string not configured.");

    options.UseNpgsql(cs);
});

builder.Services.AddScoped<JwtTokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        var key = builder.Configuration["Jwt:Key"]!;
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(key))
        };
    });

builder.Services.AddAuthorization();

// CORS (Render API + Front Vercel)
// Defina no Render: CORS_ORIGINS=https://seuapp.vercel.app,http://localhost:5173
builder.Services.AddCors(options =>
{
    options.AddPolicy("cors", policy =>
    {
        var origins = (builder.Configuration["CORS_ORIGINS"] ?? "")
            .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

        if (origins.Length == 0)
        {
            // fallback seguro pra dev local
            policy.WithOrigins("http://localhost:5173", "http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
        else
        {
            policy.WithOrigins(origins)
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        }
    });
});

// Se você usa auth depois, já deixa a ordem pronta:
// builder.Services.AddAuthentication(...);
// builder.Services.AddAuthorization();

var app = builder.Build();

// Proxy headers (Render / reverse proxy)
app.UseForwardedHeaders(new ForwardedHeadersOptions
{
    ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto
});

// Segurança/headers
if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
}

// Em proxy, HTTPS redirection pode atrapalhar.
// Se você quiser, deixe só em DEV:
if (app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

// CORS antes de auth/controllers
app.UseCors("cors");

app.UseMiddleware<TenantMiddleware>();

// Swagger: só em DEV (ou force via env var ENABLE_SWAGGER=true)
var enableSwagger = app.Environment.IsDevelopment() ||
                    string.Equals(builder.Configuration["ENABLE_SWAGGER"], "true", StringComparison.OrdinalIgnoreCase);

if (enableSwagger)
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthentication();
app.UseAuthorization();

// Health endpoints (para Vercel “Health”)
app.MapGet("/", () => Results.Ok(new { name = "PulseCRM.Api", status = "ok" }));
app.MapGet("/health", () => Results.Ok(new { status = "ok" }));
app.MapGet("/ready", () => Results.Ok(new { status = "ready" }));

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.Migrate();
}

app.MapControllers();

app.Run();