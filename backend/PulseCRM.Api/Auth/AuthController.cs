using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PulseCRM.Api.Data;
using PulseCRM.Api.Tenants;

namespace PulseCRM.Api.Auth;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly TenantContext _tenant;
    private readonly JwtTokenService _jwt;

    public AuthController(AppDbContext db, TenantContext tenant, JwtTokenService jwt)
    {
        _db = db;
        _tenant = tenant;
        _jwt = jwt;
    }

    public record LoginRequest(string Email, string Password);

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();

        var user = await _db.Users.FirstOrDefaultAsync(u =>
            u.TenantId == _tenant.TenantId &&
            u.Email == email &&
            u.IsActive);

        if (user == null)
            return Unauthorized(new { error = "Invalid credentials" });

        if (!PasswordHasher.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials" });

        var token = _jwt.CreateToken(user);

        return Ok(new
        {
            access_token = token,
            token_type = "Bearer"
        });
    }
}