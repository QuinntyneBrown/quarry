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
using Quarry.Application.Operations;
using Quarry.Infrastructure.Operations;
using Quarry.Infrastructure.Evaluation;

var builder = WebApplication.CreateBuilder(args);

if (builder.Configuration.GetValue<bool>("seed-evaluation"))
{
    if (!builder.Environment.IsDevelopment())
    {
        Console.Error.WriteLine("Evaluation seeding is available only in Development.");
        Environment.ExitCode = 1;
        return;
    }
    try
    {
        var connection = builder.Configuration.GetConnectionString("QuarryEvaluation")
            ?? throw new InvalidOperationException("Configure ConnectionStrings:QuarryEvaluation for a dedicated _Evaluation database.");
        await using var database = new QuarryDbContext(new DbContextOptionsBuilder<QuarryDbContext>().UseSqlServer(connection).Options);
        var embeddingOptions = builder.Configuration.GetSection("Embeddings").Get<OllamaEmbeddingOptions>() ?? new OllamaEmbeddingOptions();
        var imported = await new SqlEvaluationCatalogSeeder(database).SeedAsync(Path.Combine(AppContext.BaseDirectory, "evaluation-catalog.json"),
            Environment.UserName, embeddingOptions.CompatibilityKey, CancellationToken.None);
        Console.WriteLine(imported ? "Imported eight illustrative evaluation frameworks and queued indexing." : "This evaluation catalog was already imported; no records changed.");
    }
    catch (Exception error) when (error is InvalidOperationException or ArgumentException or IOException or System.Text.Json.JsonException
        or System.Data.Common.DbException or DbUpdateException or Quarry.Domain.Catalog.FrameworkValidationException)
    {
        Console.Error.WriteLine("Evaluation seed failed. Check Development mode, the dedicated _Evaluation connection, migrations, an empty catalog, and valid fixture/model configuration.");
        Environment.ExitCode = 1;
    }
    return;
}

// Add services to the container.

builder.Services.AddControllers().ConfigureApiBehaviorOptions(options =>
{
    options.InvalidModelStateResponseFactory = context => new Microsoft.AspNetCore.Mvc.BadRequestObjectResult(
        new SafeErrorResponse("invalid_request", context.HttpContext.TraceIdentifier));
});
builder.Services.AddSingleton(new SearchConcurrencyGate(builder.Configuration.GetValue("Search:MaximumConcurrentRequests", 16)));
builder.Services.AddRequestTimeouts(options => options.AddPolicy("framework-search", new RequestTimeoutPolicy
{
    Timeout = TimeSpan.FromSeconds(builder.Configuration.GetValue("Search:RequestTimeoutSeconds", 8)),
    TimeoutStatusCode = StatusCodes.Status504GatewayTimeout,
    WriteTimeoutResponse = context => context.Response.WriteAsJsonAsync(new SafeErrorResponse("search_deadline_exceeded", context.TraceIdentifier))
}));
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "Quarry";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "Quarry.Maintenance";
var jwtSigningKey = builder.Configuration["Jwt:SigningKey"];
if (!string.IsNullOrWhiteSpace(jwtSigningKey) && Encoding.UTF8.GetByteCount(jwtSigningKey) < 32)
{
    throw new InvalidOperationException("Jwt:SigningKey must contain at least 32 UTF-8 bytes.");
}
builder.Services.AddAuthentication().AddJwtBearer(options =>
{
    options.MapInboundClaims = false;
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidIssuer = jwtIssuer,
        ValidateAudience = true,
        ValidAudience = jwtAudience,
        ValidateIssuerSigningKey = true,
        IssuerSigningKey = string.IsNullOrWhiteSpace(jwtSigningKey) ? null : new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSigningKey)),
        RequireSignedTokens = true,
        ValidAlgorithms = [SecurityAlgorithms.HmacSha256],
        RequireExpirationTime = true,
        ValidateLifetime = true,
        ClockSkew = TimeSpan.Zero
    };
});
builder.Services.AddAuthorizationBuilder().AddPolicy("maintenance", policy => policy
    .RequireAuthenticatedUser()
    .RequireClaim("permission", "maintenance")
    .RequireAssertion(context => !string.IsNullOrWhiteSpace(context.User.FindFirst("sub")?.Value)));
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
builder.Services.AddDbContext<QuarryDbContext>(options => options.UseSqlServer(
    builder.Configuration.GetConnectionString("QuarryRead") ?? builder.Configuration.GetConnectionString("Quarry")));
builder.Services.AddKeyedScoped<QuarryDbContext>("maintenance", (_, _) => new QuarryDbContext(new DbContextOptionsBuilder<QuarryDbContext>()
    .UseSqlServer(builder.Configuration.GetConnectionString("QuarryMaintenance") ?? builder.Configuration.GetConnectionString("Quarry")).Options));
builder.Services.Configure<OllamaEmbeddingOptions>(builder.Configuration.GetSection(OllamaEmbeddingOptions.SectionName));
builder.Services.AddHttpClient<OllamaTextEmbeddingProvider>(client =>
{
    if (Uri.TryCreate(builder.Configuration["Embeddings:Endpoint"] ?? "http://localhost:11434/", UriKind.Absolute, out var endpoint)
        && endpoint.Scheme is "http" or "https") client.BaseAddress = endpoint;
    client.Timeout = TimeSpan.FromSeconds(5);
});
builder.Services.AddScoped<ITextEmbeddingProvider>(serviceProvider => serviceProvider.GetRequiredService<OllamaTextEmbeddingProvider>());
builder.Services.AddScoped<IServiceHealthReader, SqlServiceHealthReader>();
builder.Services.AddScoped<IFrameworkVectorRepository, SqlFrameworkVectorRepository>();
builder.Services.AddScoped<IFrameworkSearchIndexMaintenance>(services => ActivatorUtilities.CreateInstance<SqlFrameworkSearchIndexMaintenance>(services,
    services.GetRequiredKeyedService<QuarryDbContext>("maintenance")));
builder.Services.AddScoped<SqlIndexWorkRepository>(services => new SqlIndexWorkRepository(services.GetRequiredKeyedService<QuarryDbContext>("maintenance")));
builder.Services.AddSingleton<CosineSimilarityRanker>();
builder.Services.AddScoped<SqlFrameworkCatalogReader>();
builder.Services.AddScoped<IFrameworkDraftRepository>(services => new SqlFrameworkDraftRepository(services.GetRequiredKeyedService<QuarryDbContext>("maintenance")));
builder.Services.AddScoped<IFrameworkPublicationRepository>(services => ActivatorUtilities.CreateInstance<SqlFrameworkPublicationRepository>(services,
    services.GetRequiredKeyedService<QuarryDbContext>("maintenance")));
builder.Services.AddScoped<IFrameworkRetirementRepository>(services => new SqlFrameworkRetirementRepository(services.GetRequiredKeyedService<QuarryDbContext>("maintenance")));
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

app.UseMiddleware<RequestDiagnosticsMiddleware>();

app.UseRequestTimeouts();

app.UseRateLimiter();

app.UseAuthentication();

app.UseAuthorization();

app.UseMiddleware<RequestBodyLimitMiddleware>();

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
