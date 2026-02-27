using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace PulseCRM.Api.Auth;

[ApiController]
[Route("me")]
public class MeController : ControllerBase
{
    [Authorize]
    [HttpGet]
    public IActionResult GetMe()
    {
        return Ok(new
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier) 
                     ?? User.FindFirstValue("sub"),
            email = User.FindFirstValue(ClaimTypes.Email),
            role = User.FindFirstValue(ClaimTypes.Role),
            tenantId = User.FindFirstValue("tenant_id"),
            name = User.FindFirstValue("name")
        });
    }
}