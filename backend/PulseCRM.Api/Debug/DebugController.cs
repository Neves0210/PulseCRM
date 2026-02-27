using Microsoft.AspNetCore.Mvc;

namespace PulseCRM.Api.Debug;

[ApiController]
[Route("debug")]
public class DebugController : ControllerBase
{
    private readonly IConfiguration _cfg;
    private readonly IWebHostEnvironment _env;

    public DebugController(IConfiguration cfg, IWebHostEnvironment env)
    {
        _cfg = cfg;
        _env = env;
    }

    [HttpGet("env")]
    public IActionResult EnvCheck()
    {
        var csDefault = _cfg.GetConnectionString("Default");
        var dbUrl = _cfg["DATABASE_URL"];

        return Ok(new
        {
            environment = _env.EnvironmentName,

            has_ConnectionStrings__Default = !string.IsNullOrWhiteSpace(csDefault),
            ConnectionStrings__Default_startsWith = Start(dbUrlOrCs: csDefault),

            has_DATABASE_URL = !string.IsNullOrWhiteSpace(dbUrl),
            DATABASE_URL_startsWith = Start(dbUrlOrCs: dbUrl),

            // Ajuda a detectar “colei JSON/objeto” ou lixo
            looksLikeUrl = LooksLikePostgresUrl(csDefault) || LooksLikePostgresUrl(dbUrl),
            looksLikeKeyValue = LooksLikeKeyValue(csDefault) || LooksLikeKeyValue(dbUrl)
        });

        static string? Start(string? dbUrlOrCs)
        {
            if (string.IsNullOrWhiteSpace(dbUrlOrCs)) return null;
            var s = dbUrlOrCs.Trim();
            return s.Length <= 20 ? s : s[..20];
        }

        static bool LooksLikePostgresUrl(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return false;
            s = s.Trim().ToLowerInvariant();
            return s.StartsWith("postgres://") || s.StartsWith("postgresql://");
        }

        static bool LooksLikeKeyValue(string? s)
        {
            if (string.IsNullOrWhiteSpace(s)) return false;
            s = s.Trim();
            // formato típico: Host=...;Database=...;Username=...;Password=...
            return s.Contains("Host=", StringComparison.OrdinalIgnoreCase)
                && s.Contains("Database=", StringComparison.OrdinalIgnoreCase);
        }
    }
}