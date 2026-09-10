using Quarry.Application.Catalog;
using Quarry.Infrastructure.Catalog;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(typeof(BrowseFrameworksQuery).Assembly));
builder.Services.AddSingleton<IFrameworkCatalogReader, DevelopmentFrameworkCatalogReader>();

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
