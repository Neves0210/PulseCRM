var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// CORS: libera o domínio do frontend (Vercel) via ENV FRONTEND_URL.
// Em dev, libera tudo.
var frontendUrl = builder.Configuration["FRONTEND_URL"];
builder.Services.AddCors(options =>
{
    options.AddPolicy("web", p =>
    {
        if (!string.IsNullOrWhiteSpace(frontendUrl))
            p.WithOrigins(frontendUrl).AllowAnyHeader().AllowAnyMethod();
        else
            p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
    });
});

builder.Services.AddHealthChecks();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseHttpsRedirection();
app.UseCors("web");
app.MapHealthChecks("/health");
app.MapControllers();

// rota simples pra testar
app.MapGet("/", () => Results.Ok(new { name = "PulseCRM API", status = "ok" }));

app.Run();