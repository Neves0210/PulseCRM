using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using PulseCRM.Api.Models;

namespace PulseCRM.Api.Auth;

public class JwtTokenService
{
    private readonly IConfiguration _cfg;

    public JwtTokenService(IConfiguration cfg)
    {
        _cfg = cfg;
    }

    public string CreateToken(User user)
    {
        var key = _cfg["Jwt:Key"]!;
        var issuer = _cfg["Jwt:Issuer"];
        var audience = _cfg["Jwt:Audience"];
        var expiresMinutes = int.Parse(_cfg["Jwt:ExpiresMinutes"]!);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new("tenant_id", user.TenantId.ToString()),
            new(ClaimTypes.Role, user.Role),
            new(ClaimTypes.Email, user.Email),
            new("name", user.Name)
        };

        var creds = new SigningCredentials(
            new SymmetricSecurityKey(Encoding.UTF8.GetBytes(key)),
            SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer,
            audience,
            claims,
            expires: DateTime.UtcNow.AddMinutes(expiresMinutes),
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}