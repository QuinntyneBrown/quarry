using Quarry.Indexing.Worker;
using Microsoft.EntityFrameworkCore;
using Quarry.Application.Recommendations;
using Quarry.Infrastructure.Persistence;
using Quarry.Infrastructure.Recommendations;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddDbContext<QuarryDbContext>(options => options.UseSqlServer(builder.Configuration.GetConnectionString("Quarry")));
builder.Services.Configure<OllamaEmbeddingOptions>(builder.Configuration.GetSection(OllamaEmbeddingOptions.SectionName));
builder.Services.AddHttpClient<OllamaTextEmbeddingProvider>(client => client.BaseAddress = new Uri(builder.Configuration["Embeddings:Endpoint"] ?? "http://localhost:11434/"));
builder.Services.AddScoped<ITextEmbeddingProvider>(serviceProvider => serviceProvider.GetRequiredService<OllamaTextEmbeddingProvider>());
builder.Services.AddHostedService<Worker>();

var host = builder.Build();
host.Run();
