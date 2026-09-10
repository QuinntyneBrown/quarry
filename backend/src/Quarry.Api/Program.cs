using Quarry.Application.Catalog;
using Quarry.Infrastructure.Catalog;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;
using Quarry.Application.Recommendations;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.RateLimiting;
using System.Globalization;
using System.Threading.RateLimiting;
using Quarry.Api.Contracts;
using Quarry.Api;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Http.Timeouts;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddSingleton(new SearchConcurrencyGate(builder.Configuration.GetValue("Search:MaximumConcurrentRequests", 16)));
builder.Services.AddRequestTimeouts(options => options.AddPolicy("framework-search", TimeSpan.FromSeconds(builder.Configuration.GetValue("Search:RequestTimeoutSeconds", 8))));
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Quarry";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Quarry.Maintenance";
var jwtSigningKey = builder.Configuration["Jwt:SigningKey"] ?? "development-only-signing-key-change-before-production";
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
        ValidateLifetime = true
    };
});
builder.Services.AddAuthorizationBuilder().AddPolicy("maintenance", policy => policy.RequireAuthenticatedUser().RequireClaim("permission", "maintenance"));
var rateLimitWindowSeconds = builder.Configuration.GetValue("RateLimits:WindowSeconds", 60);
var catalogReadPermitLimit = builder.Configuration.GetValue("RateLimits:CatalogReadPermitLimit", 120);
var searchPermitLimit = builder.Configuration.GetValue("RateLimits:SearchPermitLimit", 30);
builder.Services.AddRateLimiter(options =>
{
    options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    options.OnRejected = async (context, cancellationToken) =>
    {
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter = Math.Max(1, Math.Ceiling(retryAfter.TotalSeconds)).ToString(CultureInfo.InvariantCulture);
        }

        await context.HttpContext.Response.WriteAsJsonAsync(
            new SafeErrorResponse("rate_limit_exceeded", context.HttpContext.TraceIdentifier),
            cancellationToken);
    };

    options.AddPolicy("catalog-read", httpContext => CreateFixedWindowPartition(httpContext, catalogReadPermitLimit, rateLimitWindowSeconds));
    options.AddPolicy("framework-search", httpContext => CreateFixedWindowPartition(httpContext, searchPermitLimit, rateLimitWindowSeconds));
});
builder.Services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(typeof(BrowseFrameworksQuery).Assembly));
builder.Services.AddDbContext<QuarryDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Quarry")));
builder.Services.Configure<OllamaEmbeddingOptions>(builder.Configuration.GetSection(OllamaEmbeddingOptions.SectionName));
builder.Services.AddHttpClient<OllamaTextEmbeddingProvider>(client =>
{
    client.BaseAddress = new Uri(builder.Configuration["Embeddings:Endpoint"] ?? "http://localhost:11434/");
    client.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddScoped<ITextEmbeddingProvider>(serviceProvider => serviceProvider.GetRequiredService<OllamaTextEmbeddingProvider>());
builder.Services.AddScoped<IFrameworkVectorRepository, SqlFrameworkVectorRepository>();
builder.Services.AddScoped<IFrameworkSearchIndexMaintenance, SqlFrameworkSearchIndexMaintenance>();
builder.Services.AddSingleton<CosineSimilarityRanker>();
builder.Services.AddScoped<SqlFrameworkCatalogReader>();
builder.Services.AddSingleton<DevelopmentFrameworkCatalogReader>();
builder.Services.AddScoped<IFrameworkCatalogReader>(serviceProvider => builder.Configuration.GetValue<bool>("Catalog:SeedDevelopmentEvaluationData")
    ? serviceProvider.GetRequiredService<DevelopmentFrameworkCatalogReader>()
    : serviceProvider.GetRequiredService<SqlFrameworkCatalogReader>());
builder.Services.AddScoped<IFrameworkDetailsReader>(serviceProvider => builder.Configuration.GetValue<bool>("Catalog:SeedDevelopmentEvaluationData")
    ? serviceProvider.GetRequiredService<DevelopmentFrameworkCatalogReader>()
    : serviceProvider.GetRequiredService<SqlFrameworkCatalogReader>());

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseRequestTimeouts();

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();

static RateLimitPartition<string> CreateFixedWindowPartition(HttpContext httpContext, int permitLimit, int windowSeconds)
{
    var clientAddress = httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown";
    return RateLimitPartition.GetFixedWindowLimiter(clientAddress, _ => new FixedWindowRateLimiterOptions
    {
        PermitLimit = permitLimit,
        Window = TimeSpan.FromSeconds(windowSeconds),
        QueueLimit = 0,
        AutoReplenishment = true
    });
}
