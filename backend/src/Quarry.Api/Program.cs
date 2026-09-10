using Quarry.Application.Catalog;
using Quarry.Infrastructure.Catalog;
using Quarry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(typeof(BrowseFrameworksQuery).Assembly));
builder.Services.AddDbContext<QuarryDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Quarry")));
builder.Services.AddScoped<SqlFrameworkCatalogReader>();
builder.Services.AddSingleton<DevelopmentFrameworkCatalogReader>();
builder.Services.AddScoped<IFrameworkCatalogReader>(serviceProvider => builder.Configuration.GetValue<bool>("Catalog:SeedDevelopmentEvaluationData")
    ? serviceProvider.GetRequiredService<DevelopmentFrameworkCatalogReader>()
    : serviceProvider.GetRequiredService<SqlFrameworkCatalogReader>());

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
