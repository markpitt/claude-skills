---
name: dotnet-aspire
description: Adds .NET Aspire cloud-native orchestration to existing .NET solutions. Analyzes solution structure to identify services (APIs, web apps, workers), creates AppHost and ServiceDefaults projects, configures service discovery, adds NuGet packages, and sets up distributed application orchestration. Use when adding Aspire to .NET solutions or creating new cloud-ready distributed applications.
version: 1.0
---

# .NET Aspire Integration Skill

This skill helps add .NET Aspire to existing .NET solutions or create new Aspire-enabled distributed applications. It analyzes solution structure, identifies services, and configures the necessary Aspire components for cloud-native orchestration.

## Overview

.NET Aspire is an opinionated, cloud-ready stack for building observable, production-ready, distributed applications. It provides:

- **Service orchestration** - Coordinate multiple projects and services
- **Service discovery** - Automatic discovery and connection between services
- **Telemetry and observability** - Built-in logging, metrics, and tracing
- **Configuration management** - Centralized configuration with strong typing
- **Resource provisioning** - Integration with databases, caching, messaging, and cloud services

## When to Use This Skill

Use this skill when:
- Adding Aspire to an existing .NET solution with multiple services
- Creating a new distributed application with Aspire
- Modernizing microservices or distributed systems for cloud deployment
- Setting up service orchestration for local development and deployment
- Integrating cloud-native observability and configuration patterns

## Workflow

### 1. Analysis Phase

**Analyze the solution structure** to identify:
- Web APIs (ASP.NET Core projects)
- Web applications (Blazor, MVC, Razor Pages)
- Worker services and background jobs
- Console applications that could be services
- Class libraries that define shared contracts
- Existing infrastructure dependencies (databases, Redis, message queues)

**Key files to examine:**
- `*.sln` - Solution file listing all projects
- `*.csproj` - Project files to understand project types
- `appsettings.json` - Configuration to identify external dependencies
- `Program.cs` - Startup code to understand service patterns

**If the solution structure is unclear**, ask the user:
1. Which projects should be orchestrated as services?
2. What external resources are needed (databases, Redis, storage, etc.)?
3. Should this use the minimal Aspire setup or include additional components?
4. Are there any existing Docker or orchestration configurations?

### 2. Clarification Questions

Before implementing, confirm with the user:

**Service Identification:**
- "I've identified [X] services in your solution: [list]. Should all of these be included in Aspire orchestration?"
- "Are there any additional services or projects that should be added?"

**Infrastructure Requirements:**
- "I see references to [database/Redis/etc.]. Should Aspire manage these resources?"
- "Do you want to use container resources or connection string configuration?"

**Aspire Structure:**
- "Should I create a new AppHost project named '[SolutionName].AppHost' and ServiceDefaults project named '[SolutionName].ServiceDefaults'?"
- "Do you prefer a specific naming convention?"

**Dependencies:**
- "Which services depend on each other? (This helps set up service discovery)"
- "Are there any startup ordering requirements?"

### 3. Implementation Steps

#### Step 1: Create Aspire Projects

**Create the AppHost project:**
```bash
dotnet new aspire-apphost -n [SolutionName].AppHost
```

The AppHost project:
- Orchestrates all services and resources
- Defines service dependencies and configurations
- Provides the developer dashboard for local development
- Contains `Program.cs` with application composition

**Create the ServiceDefaults project:**
```bash
dotnet new aspire-servicedefaults -n [SolutionName].ServiceDefaults
```

The ServiceDefaults project:
- Provides shared service configuration
- Configures OpenTelemetry, health checks, and service discovery
- Applied to all services for consistent behavior

**Add projects to solution:**
```bash
dotnet sln add [SolutionName].AppHost/[SolutionName].AppHost.csproj
dotnet sln add [SolutionName].ServiceDefaults/[SolutionName].ServiceDefaults.csproj
```

#### Step 2: Configure Service Projects

**For each service project** (API, Web App, Worker):

1. **Add ServiceDefaults reference:**
```bash
dotnet add [ServiceProject] reference [SolutionName].ServiceDefaults/[SolutionName].ServiceDefaults.csproj
```

2. **Update Program.cs** to register service defaults:
```csharp
// At the top of Program.cs, after builder creation
var builder = WebApplication.CreateBuilder(args);

// Add this line
builder.AddServiceDefaults();

// ... rest of service configuration ...

var app = builder.Build();

// Add this line before app.Run()
app.MapDefaultEndpoints();

app.Run();
```

3. **For Worker Services**, the pattern is similar:
```csharp
var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults();

// ... service configuration ...

var host = builder.Build();
host.Run();
```

#### Step 3: Configure the AppHost

**Add project references** in AppHost:
```bash
dotnet add [SolutionName].AppHost reference [ServiceProject1]/[ServiceProject1].csproj
dotnet add [SolutionName].AppHost reference [ServiceProject2]/[ServiceProject2].csproj
```

**Update AppHost Program.cs** to orchestrate services:

```csharp
var builder = DistributedApplication.CreateBuilder(args);

// Add infrastructure resources
var cache = builder.AddRedis("cache");
var postgres = builder.AddPostgres("postgres")
    .AddDatabase("appdb");

// Add services with dependencies
var apiService = builder.AddProject<Projects.MyApi>("apiservice")
    .WithReference(postgres)
    .WithReference(cache);

var webApp = builder.AddProject<Projects.MyWebApp>("webapp")
    .WithReference(apiService)
    .WithExternalHttpEndpoints();

builder.Build().Run();
```

**Common resource methods:**
- `.AddRedis("name")` - Redis cache
- `.AddPostgres("name").AddDatabase("dbname")` - PostgreSQL
- `.AddSqlServer("name").AddDatabase("dbname")` - SQL Server
- `.AddRabbitMQ("name")` - RabbitMQ messaging
- `.AddMongoDB("name").AddDatabase("dbname")` - MongoDB
- `.AddAzureStorage("name")` - Azure Storage

**Service configuration methods:**
- `.WithReference(resource)` - Add dependency and inject connection info
- `.WithExternalHttpEndpoints()` - Make service accessible externally
- `.WithReplicas(count)` - Run multiple instances
- `.WithEnvironment("KEY", "value")` - Add environment variables
- `.WithHttpsEndpoint(port: 7001)` - Specify HTTPS port

#### Step 4: Add Required NuGet Packages

Aspire packages are automatically added by templates, but verify:

**AppHost project:**
- `Aspire.Hosting.AppHost` (typically included via workload)
- Additional hosting packages for resources (e.g., `Aspire.Hosting.PostgreSQL`)

**ServiceDefaults project:**
- `Microsoft.Extensions.Http.Resilience`
- `Microsoft.Extensions.ServiceDiscovery`
- `OpenTelemetry.Exporter.OpenTelemetryProtocol`
- `OpenTelemetry.Extensions.Hosting`
- `OpenTelemetry.Instrumentation.AspNetCore`
- `OpenTelemetry.Instrumentation.Http`
- `OpenTelemetry.Instrumentation.Runtime`

**Service projects:**
- `Aspire.Npgsql.EntityFrameworkCore.PostgreSQL` (if using PostgreSQL)
- `Aspire.StackExchange.Redis` (if using Redis)
- Component packages as needed for databases, messaging, etc.

**Install packages:**
```bash
dotnet add [Project] package [PackageName]
```

#### Step 5: Update Service Communication

**For services that call other services**, use service discovery:

**Before (hardcoded URLs):**
```csharp
builder.Services.AddHttpClient("apiservice", client =>
{
    client.BaseAddress = new Uri("https://localhost:7001");
});
```

**After (service discovery):**
```csharp
builder.Services.AddHttpClient("apiservice", client =>
{
    client.BaseAddress = new Uri("http://apiservice");
});
```

The service name matches the name in AppHost's `AddProject<>()` call.

**For typed HttpClients:**
```csharp
builder.Services.AddHttpClient<IApiClient, ApiClient>(client =>
{
    client.BaseAddress = new Uri("http://apiservice");
});
```

#### Step 6: Configuration and Connection Strings

**Resource connection strings** are automatically injected. Update service configuration:

**Before:**
```csharp
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

**After:**
```csharp
builder.AddNpgsqlDbContext<AppDbContext>("appdb");
```

The connection name ("appdb") matches the database name in AppHost.

**For Redis:**
```csharp
builder.AddRedisClient("cache");
```

#### Step 7: Verify and Test

**Run the AppHost project:**
```bash
dotnet run --project [SolutionName].AppHost
```

This launches:
- The Aspire dashboard (typically at https://localhost:15001)
- All configured services
- Any resource containers (Redis, PostgreSQL, etc.)

**Verify:**
1. Dashboard shows all services running
2. Services can communicate via service discovery
3. Telemetry data appears in the dashboard
4. Resource connections work correctly

### 4. Advanced Configurations

#### External Services

For services not in the solution:
```csharp
var externalApi = builder.AddProject<Projects.ExternalApi>("external-api")
    .WithHttpsEndpoint(port: 8001);
```

#### Container Resources

Run services in containers:
```csharp
var myApi = builder.AddContainer("myapi", "myapiimage")
    .WithHttpEndpoint(port: 8000, targetPort: 80);
```

#### Azure Resources

For Azure-hosted resources:
```csharp
var storage = builder.AddAzureStorage("storage")
    .AddBlobs("blobs");

var keyVault = builder.AddAzureKeyVault("keyvault");
```

#### Custom Resources

Extend Aspire with custom resources:
```csharp
var customResource = builder.AddResource(new CustomResource("name"))
    .WithEndpoint("http", endpoint => endpoint.Port = 9000);
```

## Best Practices

### 1. Service Organization
- Keep AppHost focused on orchestration, not business logic
- Use ServiceDefaults for cross-cutting concerns
- Ensure each service is independently runnable (with fallback config)

### 2. Resource Management
- Use Aspire-managed resources for local development
- Use connection strings for production deployments
- Configure resource persistence for databases (avoid data loss)

### 3. Configuration
- Use `appsettings.Development.json` for local overrides
- Keep sensitive data in user secrets or key vaults
- Use environment-specific configurations

### 4. Dependencies
- Define explicit service dependencies in AppHost
- Use `.WithReference()` to inject connection information
- Consider startup order for database migrations

### 5. Observability
- Leverage built-in OpenTelemetry for distributed tracing
- Use the dashboard for local debugging
- Configure appropriate log levels per service

## Common Patterns

### API Gateway Pattern
```csharp
var apiGateway = builder.AddProject<Projects.ApiGateway>("gateway")
    .WithExternalHttpEndpoints();

var serviceA = builder.AddProject<Projects.ServiceA>("servicea");
var serviceB = builder.AddProject<Projects.ServiceB>("serviceb");

apiGateway.WithReference(serviceA).WithReference(serviceB);
```

### Worker with Message Queue
```csharp
var messaging = builder.AddRabbitMQ("messaging");

var worker = builder.AddProject<Projects.Worker>("worker")
    .WithReference(messaging);

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(messaging);
```

### Web App with Backend API
```csharp
var cache = builder.AddRedis("cache");
var database = builder.AddPostgres("postgres").AddDatabase("appdb");

var api = builder.AddProject<Projects.Api>("api")
    .WithReference(database)
    .WithReference(cache);

var web = builder.AddProject<Projects.Web>("web")
    .WithReference(api)
    .WithExternalHttpEndpoints();
```

## Troubleshooting

### Service Discovery Not Working
- Ensure `builder.AddServiceDefaults()` is called in service Program.cs
- Verify service name in HttpClient matches AppHost AddProject name
- Check that `app.MapDefaultEndpoints()` is called for ASP.NET services

### Connection Strings Not Injected
- Confirm resource name matches in both AppHost and service configuration
- Use `builder.AddNpgsqlDbContext<>()` instead of manual AddDbContext
- Verify ServiceDefaults reference exists

### Dashboard Not Accessible
- Check AppHost is running (not individual services)
- Verify port isn't blocked (default: 15001)
- Look for dashboard URL in AppHost console output

### Resources Not Starting
- Ensure Docker Desktop is running (for container resources)
- Check for port conflicts with existing services
- Review AppHost console for startup errors

## Files to Modify

When adding Aspire to an existing solution, expect to modify:

1. **Solution file (.sln)** - Add AppHost and ServiceDefaults projects
2. **Each service's Program.cs** - Add service defaults registration
3. **Each service's .csproj** - Add ServiceDefaults reference
4. **AppHost/Program.cs** - Define orchestration and resources
5. **Service configuration** - Replace hardcoded URLs with service discovery
6. **Database configuration** - Use Aspire component methods

## Prerequisites

Ensure the following are installed:
- .NET 8.0 SDK or later
- .NET Aspire workload: `dotnet workload install aspire`
- Docker Desktop (for container resources)

Verify installation:
```bash
dotnet workload list
```

Should show "aspire" in the installed workloads.

## Summary Checklist

After implementing Aspire, verify:
- [ ] AppHost project created and added to solution
- [ ] ServiceDefaults project created and added to solution
- [ ] All service projects reference ServiceDefaults
- [ ] Service Program.cs files call `AddServiceDefaults()` and `MapDefaultEndpoints()`
- [ ] AppHost Program.cs orchestrates all services with proper dependencies
- [ ] Service-to-service communication uses service discovery (not hardcoded URLs)
- [ ] Database and cache connections use Aspire component methods
- [ ] AppHost runs successfully and launches dashboard
- [ ] All services appear in dashboard and show healthy status
- [ ] Telemetry data appears for requests across services

## Additional Resources

For detailed information about specific components and patterns, see:
- `resources/components.md` - Aspire component packages and configurations
- `resources/deployment.md` - Deploying Aspire applications to production

## Example Output

When complete, the solution structure should look like:
```
MySolution/
├── MySolution.sln
├── MySolution.AppHost/
│   ├── Program.cs                 # Orchestration configuration
│   ├── MySolution.AppHost.csproj
│   └── appsettings.json
├── MySolution.ServiceDefaults/
│   ├── Extensions.cs              # Service defaults implementation
│   └── MySolution.ServiceDefaults.csproj
├── MySolution.Api/
│   ├── Program.cs                 # Calls AddServiceDefaults()
│   └── MySolution.Api.csproj      # References ServiceDefaults
├── MySolution.Web/
│   ├── Program.cs                 # Calls AddServiceDefaults()
│   └── MySolution.Web.csproj      # References ServiceDefaults
└── MySolution.Worker/
    ├── Program.cs                 # Calls AddServiceDefaults()
    └── MySolution.Worker.csproj   # References ServiceDefaults
```

Running `dotnet run --project MySolution.AppHost` starts all services and opens the dashboard for monitoring and debugging the distributed application.
