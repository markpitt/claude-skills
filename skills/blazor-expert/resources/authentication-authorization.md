# Blazor Authentication & Authorization

## Authentication Setup

### Blazor Server Setup

```csharp
// Program.cs
var builder = WebApplication.CreateBuilder(args);

// Add authentication
builder.Services
    .AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.LoginPath = "/login";
        options.LogoutPath = "/logout";
        options.AccessDeniedPath = "/unauthorized";
    });

builder.Services.AddAuthorizationCore();

// Add Blazor Server
builder.Services.AddRazorPages();
builder.Services.AddServerSideBlazor();

var app = builder.Build();

// Add authentication middleware BEFORE MapRazorPages
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();

app.MapRazorPages();
app.MapBlazorHub();
```

### Blazor WebAssembly Setup

```csharp
// Program.cs
var builder = WebAssemblyHostBuilder.CreateDefault(args);

builder.RootComponents.Add<App>("#app");

// Add authentication
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
builder.Services.AddScoped<HttpClient>(sp =>
    new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) });

await builder.Build().RunAsync();

// CustomAuthStateProvider
public class CustomAuthStateProvider : AuthenticationStateProvider
{
    private readonly HttpClient httpClient;

    public CustomAuthStateProvider(HttpClient httpClient)
    {
        this.httpClient = httpClient;
    }

    public override async Task<AuthenticationState> GetAuthenticationStateAsync()
    {
        try
        {
            var user = await httpClient.GetJsonAsync<UserInfo>("/api/user");
            
            var claims = new[]
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.Name),
                new Claim(ClaimTypes.Email, user.Email)
            };

            var identity = new ClaimsIdentity(claims, "Custom");
            return new AuthenticationState(new ClaimsPrincipal(identity));
        }
        catch
        {
            return new AuthenticationState(new ClaimsPrincipal(new ClaimsIdentity()));
        }
    }
}
```

## AuthorizeView Component

AuthorizeView displays content conditionally based on authorization status.

### Basic Authorization Check

```html
<AuthorizeView>
    <Authorized>
        <p>Hello, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>Please log in.</p>
    </NotAuthorized>
</AuthorizeView>
```

### Authorize by Role

```html
<AuthorizeView Roles="Admin">
    <p>This content is only for Admins</p>
</AuthorizeView>

<AuthorizeView Roles="User, Moderator">
    <p>User or Moderator content</p>
</AuthorizeView>
```

### Authorize by Policy

```html
<AuthorizeView Policy="ContentEditor">
    <p>Only content editors can see this</p>
</AuthorizeView>
```

### Multiple AuthorizeView States

```html
<AuthorizeView>
    <Authorized>
        @if (context.User.IsInRole("Admin"))
        {
            <p>Admin dashboard</p>
        }
        else if (context.User.IsInRole("Editor"))
        {
            <p>Editor dashboard</p>
        }
        else
        {
            <p>User dashboard</p>
        }
    </Authorized>
    <Authorizing>
        <p>Checking authorization...</p>
    </Authorizing>
    <NotAuthorized>
        <p>Not authorized</p>
    </NotAuthorized>
</AuthorizeView>
```

### Authorize Multiple Resources

```html
<AuthorizeView Context="Auth">
    <Authorized>
        <div>
            <h2>@Auth.User.Identity?.Name</h2>
            
            @if (Auth.User.IsInRole("Admin"))
            {
                <a href="/admin">Admin Panel</a>
            }
            
            @if (Auth.User.HasClaim("department", "engineering"))
            {
                <a href="/engineering">Engineering</a>
            }
        </div>
    </Authorized>
</AuthorizeView>
```

## Authorize Attribute

Apply `[Authorize]` to pages to require authentication.

### Basic Page Authorization

```csharp
@page "/admin"
@attribute [Authorize]

<h2>Admin Page</h2>
<p>Only authenticated users can see this.</p>
```

### Role-Based Authorization

```csharp
@page "/admin"
@attribute [Authorize(Roles = "Admin")]

<h2>Admin Panel</h2>
<p>Only admins can access this page.</p>
```

### Policy-Based Authorization

```csharp
@page "/dashboard"
@attribute [Authorize(Policy = "RequireAdminRole")]

<h2>Dashboard</h2>
```

### Multiple Requirements

```csharp
@page "/admin"
@attribute [Authorize(Roles = "Admin, Manager")]
@attribute [Authorize(Policy = "ActiveSubscription")]

<h2>Admin Dashboard</h2>
```

## Authorization Policies

Define fine-grained authorization policies.

### Setup Policies

```csharp
// Program.cs
builder.Services.AddAuthorizationCore(options =>
{
    options.AddPolicy("RequireAdminRole", policy =>
        policy.RequireRole("Admin"));

    options.AddPolicy("ActiveSubscription", policy =>
        policy.Requirements.Add(new ActiveSubscriptionRequirement()));

    options.AddPolicy("ContentEditor", policy =>
        policy.RequireClaim("department", "engineering", "content"));

    options.AddPolicy("AdultUser", policy =>
        policy.Requirements.Add(new MinimumAgeRequirement(18)));
});

// Add custom policy handler
builder.Services.AddSingleton<IAuthorizationHandler, ActiveSubscriptionHandler>();
```

### Custom Policy Handlers

```csharp
public class ActiveSubscriptionRequirement : IAuthorizationRequirement { }

public class ActiveSubscriptionHandler : AuthorizationHandler<ActiveSubscriptionRequirement>
{
    private readonly IUserService userService;

    public ActiveSubscriptionHandler(IUserService userService)
    {
        this.userService = userService;
    }

    protected override async Task HandleRequirementAsync(
        AuthorizationHandlerContext context,
        ActiveSubscriptionRequirement requirement)
    {
        var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
        if (string.IsNullOrEmpty(userId))
        {
            context.Fail();
            return;
        }

        var user = await userService.GetUserAsync(userId);
        
        if (user?.SubscriptionActive == true)
        {
            context.Succeed(requirement);
        }
        else
        {
            context.Fail();
        }
    }
}

public class MinimumAgeRequirement : IAuthorizationRequirement
{
    public int MinimumAge { get; set; }

    public MinimumAgeRequirement(int minimumAge)
    {
        MinimumAge = minimumAge;
    }
}
```

## Accessing Authentication State

### In Components

```csharp
@page "/user-profile"

@if (authState == null)
{
    <p>Loading...</p>
}
else if (authState.User.Identity?.IsAuthenticated == true)
{
    <h2>Welcome, @authState.User.Identity?.Name</h2>
}
else
{
    <p>Not authenticated</p>
}

@code {
    [CascadingParameter]
    private Task<AuthenticationState>? AuthStateTask { get; set; }

    private AuthenticationState? authState;

    protected override async Task OnInitializedAsync()
    {
        authState = await AuthStateTask!;
    }
}
```

### Check Claims and Roles

```csharp
@code {
    private async Task CheckUserAsync()
    {
        var authState = await AuthStateTask!;
        var user = authState.User;

        if (user.Identity?.IsAuthenticated == true)
        {
            var name = user.Identity.Name;
            var email = user.FindFirst(ClaimTypes.Email)?.Value;
            var isAdmin = user.IsInRole("Admin");
            var department = user.FindFirst("department")?.Value;
        }
    }
}
```

## Login/Logout Implementation

### Login Page

```csharp
@page "/login"
@layout BlankLayout

<div class="login-form">
    <h2>Login</h2>

    @if (!string.IsNullOrEmpty(errorMessage))
    {
        <div class="alert alert-danger">@errorMessage</div>
    }

    <EditForm Model="@model" OnValidSubmit="@HandleLoginAsync">
        <DataAnnotationsValidator />

        <div class="form-group">
            <label>Email:</label>
            <InputText @bind-Value="model.Email" class="form-control" />
        </div>

        <div class="form-group">
            <label>Password:</label>
            <InputText @bind-Value="model.Password" type="password" class="form-control" />
        </div>

        <button type="submit" class="btn btn-primary">Login</button>
    </EditForm>
</div>

@code {
    [SupplyParameterFromQuery]
    public string? ReturnUrl { get; set; }

    @inject AuthenticationStateProvider AuthStateProvider
    @inject NavigationManager Navigation

    private LoginModel model = new();
    private string? errorMessage;

    private async Task HandleLoginAsync()
    {
        try
        {
            var result = await AuthService.LoginAsync(model.Email, model.Password);
            
            // Update authentication state
            if (AuthStateProvider is CustomAuthStateProvider customAuth)
            {
                await customAuth.SetUserAsync(result.User);
            }

            // Redirect to return URL or home
            var url = !string.IsNullOrEmpty(ReturnUrl) ? ReturnUrl : "/";
            Navigation.NavigateTo(url, forceLoad: true);
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
        }
    }
}

public class LoginModel
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    public string Password { get; set; } = "";
}
```

### Logout Endpoint

```csharp
// Pages/Logout.cshtml (in Blazor Server)
@page "/logout"
@using Microsoft.AspNetCore.Identity
@inject SignInManager<IdentityUser> SignInManager
@inject NavigationManager Navigation

@code {
    protected override async Task OnInitializedAsync()
    {
        await SignInManager.SignOutAsync();
        Navigation.NavigateTo("/");
    }
}
```

## Claims-Based Authorization

Working with claims for fine-grained authorization.

### Add Claims to User

```csharp
var claims = new List<Claim>
{
    new Claim(ClaimTypes.NameIdentifier, user.Id),
    new Claim(ClaimTypes.Name, user.Name),
    new Claim(ClaimTypes.Email, user.Email),
    new Claim("department", "engineering"),
    new Claim("level", "senior")
};

var identity = new ClaimsIdentity(claims, "Custom");
var principal = new ClaimsPrincipal(identity);
```

### Check Claims in Component

```csharp
@code {
    private async Task CheckDepartmentAsync()
    {
        var authState = await AuthStateTask!;
        var user = authState.User;

        var department = user.FindFirst("department")?.Value;
        var level = user.FindFirst("level")?.Value;

        if (department == "engineering")
        {
            // Show engineering-specific UI
        }
    }
}
```

## Best Practices

### Use Cascading AuthenticationState
```csharp
// App.razor - already cascades AuthenticationState by default
<CascadingAuthenticationState>
    <Router ... />
</CascadingAuthenticationState>
```

### Always Check firstRender in OnAfterRender
```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Initialize only once
        authState = await AuthStateTask!;
        StateHasChanged();
    }
}
```

### Use forceLoad for Logout
```csharp
private async Task LogoutAsync()
{
    await AuthService.LogoutAsync();
    // forceLoad clears client-side state
    Navigation.NavigateTo("/", forceLoad: true);
}
```

### Validate on Server
- Never trust client-side authorization
- Always validate authorization on backend API
- Check claims/roles on server methods

### Use ReturnUrl After Login
```csharp
// Redirect back to originally-requested page
Navigation.NavigateTo($"/login?returnUrl={Uri.EscapeDataString(Navigation.Uri)}");
```

---

**Related Resources:** See [routing-navigation.md](routing-navigation.md) for route-based authorization. See [components-lifecycle.md](components-lifecycle.md) for parameter security.
