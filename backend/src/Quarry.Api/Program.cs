using Quarry.Application.Catalog;
using Quarry.Infrastructure.Catalog;
using Quarry.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
builder.Services.AddMediatR(configuration => configuration.RegisterServicesFromAssembly(typeof(BrowseFrameworksQuery).Assembly));
builder.Services.AddSingleton<IFrameworkCatalogReader, DevelopmentFrameworkCatalogReader>();
builder.Services.AddDbContext<QuarryDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Quarry")));

var app = builder.Build();

// Configure the HTTP request pipeline.

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();
