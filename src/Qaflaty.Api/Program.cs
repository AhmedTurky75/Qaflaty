using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using Qaflaty.Api.Common;
using Qaflaty.Api.Middleware;
using Qaflaty.Application;
using Qaflaty.Infrastructure;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Increase request body size limit for image uploads (up to 10 × 5 MB + overhead)
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = 55 * 1024 * 1024; // 55 MB
});

builder.WebHost.ConfigureKestrel(serverOptions =>
{
    serverOptions.Limits.MaxRequestBodySize = 55 * 1024 * 1024; // 55 MB
});

// Add services to the container
builder.Services.AddControllers(options =>
    {
        // Enforce tenant isolation: the route {storeId} must match the token's store_id claim.
        options.Filters.Add<StoreScopeAuthorizationFilter>();
    })
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// Add SignalR for real-time chat
builder.Services.AddSignalR();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(
                "http://localhost:4200",  // Landing app
                "http://localhost:4201",  // Store app
                "http://localhost:4202")  // Merchant app
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure JWT Authentication
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSettings["SecretKey"]
    ?? throw new InvalidOperationException("JWT SecretKey is not configured");

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
        ClockSkew = TimeSpan.Zero
    };

    // Support JWT from query string (SignalR) and httpOnly cookies
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            // SignalR: read from query string for the chat hub
            var accessToken = context.Request.Query["access_token"];
            if (!string.IsNullOrEmpty(accessToken) &&
                context.HttpContext.Request.Path.StartsWithSegments("/hubs/chat"))
            {
                context.Token = accessToken;
                return Task.CompletedTask;
            }

            // httpOnly cookie authentication — try merchant cookie first, then customer
            if (context.Request.Cookies.TryGetValue("merchant_access_token", out var merchantToken))
                context.Token = merchantToken;
            else if (context.Request.Cookies.TryGetValue("customer_access_token", out var customerToken))
                context.Token = customerToken;
            // Legacy fallback for existing sessions until they expire
            else if (context.Request.Cookies.TryGetValue("access_token", out var legacyToken))
                context.Token = legacyToken;

            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization(options =>
{
    // Base role policies
    options.AddPolicy("MerchantPolicy", policy =>
        policy.RequireRole("merchant"));

    options.AddPolicy("CustomerPolicy", policy =>
        policy.RequireRole("customer"));

    // Merchant role hierarchy policies
    options.AddPolicy("StaffOrAbove", policy =>
        policy.RequireRole("merchant"));

    options.AddPolicy("ManagerOrAbove", policy =>
        policy.RequireRole("merchant")
              .RequireClaim("role", "Owner", "Admin", "Manager"));

    options.AddPolicy("AdminOrAbove", policy =>
        policy.RequireRole("merchant")
              .RequireClaim("role", "Owner", "Admin"));

    options.AddPolicy("OwnerPolicy", policy =>
        policy.RequireRole("merchant")
              .RequireClaim("role", "Owner"));

    // Permission-based policies
    options.AddPolicy("CanManageProducts", policy =>
        policy.RequireRole("merchant")
              .RequireAssertion(ctx =>
              {
                  var perms = ctx.User.FindFirst("permissions")?.Value ?? "";
                  return perms.Contains("ManageProducts");
              }));

    options.AddPolicy("CanManageOrders", policy =>
        policy.RequireRole("merchant")
              .RequireAssertion(ctx =>
              {
                  var perms = ctx.User.FindFirst("permissions")?.Value ?? "";
                  return perms.Contains("ManageOrders");
              }));

    options.AddPolicy("CanManageCustomers", policy =>
        policy.RequireRole("merchant")
              .RequireAssertion(ctx =>
              {
                  var perms = ctx.User.FindFirst("permissions")?.Value ?? "";
                  return perms.Contains("ManageCustomers");
              }));

    options.AddPolicy("CanManageStore", policy =>
        policy.RequireRole("merchant"));

    options.AddPolicy("CanManageAds", policy =>
        policy.RequireRole("merchant"));
             

    options.AddPolicy("CanManageUsers", policy =>
        policy.RequireRole("merchant")
              .RequireClaim("role", "Owner"));
});

// Data Protection (used to encrypt ad-provider access tokens at rest — see ICredentialProtector).
// Persist the key ring to a stable folder and pin the application name so tokens encrypted
// before an app restart stay decryptable afterward — otherwise a restart rotates the key and
// every stored provider token becomes unreadable ("reconnect this provider" on dispatch).
// In production, point this at a durable/shared location (mounted volume, blob, etc.).
var dataProtectionKeysPath = Path.Combine(builder.Environment.ContentRootPath, "keys", "dataprotection");
Directory.CreateDirectory(dataProtectionKeysPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionKeysPath))
    .SetApplicationName("Qaflaty");

// Antiforgery (CSRF protection)
builder.Services.AddAntiforgery(opts =>
{
    opts.HeaderName = "X-XSRF-TOKEN";
    opts.Cookie.Name = "XSRF-TOKEN";
    opts.Cookie.HttpOnly = false;
    opts.Cookie.SameSite = SameSiteMode.Lax;
});

// Register Application and Infrastructure layers
builder.Services.AddApplication();
builder.Services.AddInfrastructure(builder.Configuration);
builder.Services.AddHttpContextAccessor();

// Configure Swagger/OpenAPI
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Qaflaty API",
        Version = "v1",
        Description = "Qaflaty Multi-Vendor E-Commerce Platform API"
    });

    // Configure JWT Bearer authentication in Swagger
    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter your JWT token in the text input below.\n\nExample: \"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...\""
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// Global exception handler must be early in the pipeline
app.UseMiddleware<GlobalExceptionHandlerMiddleware>();

// Skipped in Development: the Angular dev-server proxy talks to this API over plain
// HTTP (see proxy.conf.json), and an HTTPS redirect here would send the browser an
// absolute https://localhost:5000 Location header, bypassing the proxy and turning
// the request cross-origin again.
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();

app.UseCors();

app.UseSerilogRequestLogging();

app.UseAuthentication();
app.UseAuthorization();

// Tenant resolution for storefront routes
app.UseMiddleware<TenantMiddleware>();

// Map SignalR Hub
app.MapHub<Qaflaty.Api.Hubs.ChatHub>("/hubs/chat");

app.MapControllers();

try
{
    Log.Information("Starting Qaflaty API");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
