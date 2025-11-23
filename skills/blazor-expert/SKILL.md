---
name: blazor-expert
description: Comprehensive Blazor development expertise covering Blazor Server, WebAssembly, and Hybrid apps. Use when building Blazor components, implementing state management, handling routing, JavaScript interop, forms and validation, authentication, or optimizing Blazor applications. Includes best practices, architecture patterns, and troubleshooting guidance.
version: 1.0
---

# Blazor Expert

Expert-level guidance for developing applications with Blazor, Microsoft's framework for building interactive web UIs using C# instead of JavaScript.

## Blazor Hosting Models

### Blazor Server
- **Execution**: Runs on the server via SignalR connection
- **Advantages**: Small download size, full .NET runtime, works on older browsers
- **Disadvantages**: Higher latency, requires constant connection, server resource intensive
- **Use when**: Building line-of-business apps, need full .NET features, prioritize initial load time

### Blazor WebAssembly (WASM)
- **Execution**: Runs entirely in browser via WebAssembly
- **Advantages**: Offline capability, no server dependency after load, reduced server costs
- **Disadvantages**: Larger initial download, limited .NET APIs, slower cold start
- **Use when**: Building PWAs, offline-first apps, client-heavy applications

### Blazor Hybrid
- **Execution**: Runs in native mobile/desktop apps (MAUI, WPF, WinForms)
- **Advantages**: Full platform access, native performance, code sharing
- **Use when**: Building cross-platform desktop/mobile apps with Blazor UI

## Component Development

### Component Structure
```csharp
@page "/example"
@using MyApp.Services
@inject IMyService MyService

<h3>@Title</h3>
<div>@ChildContent</div>

@code {
    [Parameter]
    public string Title { get; set; } = "Default";

    [Parameter]
    public RenderFragment? ChildContent { get; set; }

    protected override async Task OnInitializedAsync()
    {
        await base.OnInitializedAsync();
        // Initialization logic
    }
}
```

### Component Lifecycle Methods
1. **SetParametersAsync**: First method called, parameters set
2. **OnInitialized/OnInitializedAsync**: Component initialized, runs once
3. **OnParametersSet/OnParametersSetAsync**: After parameters set, runs on each render
4. **OnAfterRender/OnAfterRenderAsync**: After component rendered (UI updated)
   - Use `firstRender` parameter for one-time JS interop initialization

### Parameter Best Practices
- Use `[Parameter]` attribute for component parameters
- Use `[CascadingParameter]` for values from ancestor components
- Mark optional parameters with nullable types or default values
- Use `[EditorRequired]` for required parameters (C# 11+)
- Use `EventCallback<T>` for child-to-parent communication

```csharp
[Parameter, EditorRequired]
public string RequiredId { get; set; } = default!;

[Parameter]
public EventCallback<string> OnValueChanged { get; set; }

[CascadingParameter]
public ThemeInfo? Theme { get; set; }
```

## State Management

### Component State
- Use private fields/properties for component-specific state
- Call `StateHasChanged()` when state updates outside Blazor event handlers
- Use `InvokeAsync()` for thread-safe state updates

### Cascading Values
```csharp
// Provide value to descendant components
<CascadingValue Value="@currentUser">
    @ChildContent
</CascadingValue>

// Receive in child component
[CascadingParameter]
public User? CurrentUser { get; set; }
```

### Service-Based State
- Register services in Program.cs: `builder.Services.AddScoped<AppState>()`
- Use scoped services for user-specific state (Blazor Server and WASM)
- Use singleton services for app-wide state (use with caution in Server)
- Implement `INotifyPropertyChanged` or events for reactive state

```csharp
public class AppState
{
    private string _username = "";
    public event Action? OnChange;

    public string Username
    {
        get => _username;
        set
        {
            if (_username != value)
            {
                _username = value;
                NotifyStateChanged();
            }
        }
    }

    private void NotifyStateChanged() => OnChange?.Invoke();
}

// In component
@implements IDisposable
@inject AppState AppState

protected override void OnInitialized()
{
    AppState.OnChange += StateHasChanged;
}

public void Dispose()
{
    AppState.OnChange -= StateHasChanged;
}
```

## Routing and Navigation

### Route Definition
```csharp
@page "/product/{Id:int}"
@page "/product/{Id:int}/details"

@code {
    [Parameter]
    public int Id { get; set; }
}
```

### Route Constraints
- `:int`, `:long`, `:guid`, `:bool`, `:datetime`, `:decimal`, `:double`, `:float`
- Custom constraints via `IRouteConstraint`

### Navigation
```csharp
@inject NavigationManager Navigation

// Navigate programmatically
Navigation.NavigateTo("/target");
Navigation.NavigateTo("/target", forceLoad: true); // Full page reload

// Listen to location changes
Navigation.LocationChanged += OnLocationChanged;

// Query strings
var uri = Navigation.ToAbsoluteUri(Navigation.Uri);
var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
var value = query["paramName"];
```

### NavLink Component
```html
<NavLink href="/counter" Match="NavLinkMatch.All">
    <span class="icon">🔢</span> Counter
</NavLink>
```

## JavaScript Interop

### Call JavaScript from C#
```csharp
@inject IJSRuntime JS

// Simple call
await JS.InvokeVoidAsync("console.log", "Hello from Blazor");

// With return value
var result = await JS.InvokeAsync<string>("myJsFunction", arg1, arg2);

// Isolate JS modules (recommended)
var module = await JS.InvokeAsync<IJSObjectReference>(
    "import", "./scripts/myModule.js");
await module.InvokeVoidAsync("myFunction");
```

### Call C# from JavaScript
```csharp
// Static method
[JSInvokable]
public static Task<string> GetData()
{
    return Task.FromResult("Data from C#");
}

// Instance method
[JSInvokable]
public Task DoSomething(string value)
{
    // Implementation
    return Task.CompletedTask;
}

// Pass DotNetObjectReference to JS
var objRef = DotNetObjectReference.Create(this);
await JS.InvokeVoidAsync("setupInterop", objRef);

// In JavaScript:
// dotnetHelper.invokeMethodAsync('DoSomething', value);
```

### Best Practices
- Dispose JS object references: `await module.DisposeAsync()`
- Use `IJSInProcessRuntime` for synchronous calls (WASM only)
- Minimize interop calls for performance
- Use JS isolation for module-scoped code

## Forms and Validation

### EditForm Component
```csharp
<EditForm Model="@model" OnValidSubmit="@HandleValidSubmit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <InputText @bind-Value="model.Name" />
    <ValidationMessage For="@(() => model.Name)" />

    <InputNumber @bind-Value="model.Age" />
    <ValidationMessage For="@(() => model.Age)" />

    <InputSelect @bind-Value="model.Category">
        <option value="">Select...</option>
        <option value="A">Category A</option>
        <option value="B">Category B</option>
    </InputSelect>

    <button type="submit">Submit</button>
</EditForm>

@code {
    private MyModel model = new();

    private async Task HandleValidSubmit()
    {
        // Form is valid, process data
        await SaveData(model);
    }
}

public class MyModel
{
    [Required]
    [StringLength(100)]
    public string Name { get; set; } = "";

    [Range(1, 120)]
    public int Age { get; set; }

    [Required]
    public string Category { get; set; } = "";
}
```

### Custom Validation
```csharp
public class MyModel : IValidatableObject
{
    public string Email { get; set; } = "";
    public string ConfirmEmail { get; set; } = "";

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (Email != ConfirmEmail)
        {
            yield return new ValidationResult(
                "Email addresses must match",
                new[] { nameof(ConfirmEmail) }
            );
        }
    }
}
```

### Input Components
- `InputText`, `InputTextArea`: Text input
- `InputNumber<T>`: Numeric input
- `InputDate<T>`: Date input
- `InputSelect<T>`: Dropdown selection
- `InputCheckbox`: Boolean checkbox
- `InputRadio<T>`, `InputRadioGroup<T>`: Radio buttons
- `InputFile`: File upload

## Authentication and Authorization

### Setup (Program.cs)
```csharp
// Blazor Server
builder.Services.AddAuthentication(/* options */)
    .AddCookie(/* cookie options */);
builder.Services.AddAuthorization();

// Blazor WASM
builder.Services.AddAuthorizationCore();
builder.Services.AddScoped<AuthenticationStateProvider, CustomAuthStateProvider>();
```

### AuthorizeView Component
```html
<AuthorizeView>
    <Authorized>
        <p>Hello, @context.User.Identity?.Name!</p>
    </Authorized>
    <NotAuthorized>
        <p>Please log in.</p>
    </NotAuthorized>
</AuthorizeView>

<AuthorizeView Roles="Admin">
    <p>Admin content</p>
</AuthorizeView>

<AuthorizeView Policy="ContentEditor">
    <p>Editor content</p>
</AuthorizeView>
```

### Page Authorization
```csharp
@page "/admin"
@attribute [Authorize]
@attribute [Authorize(Roles = "Admin")]
@attribute [Authorize(Policy = "RequireAdminRole")]
```

### Access AuthenticationState
```csharp
[CascadingParameter]
private Task<AuthenticationState>? AuthStateTask { get; set; }

protected override async Task OnInitializedAsync()
{
    var authState = await AuthStateTask!;
    var user = authState.User;

    if (user.Identity?.IsAuthenticated == true)
    {
        var userName = user.Identity.Name;
        var isAdmin = user.IsInRole("Admin");
    }
}
```

## Performance Optimization

### Rendering Optimization
- Override `ShouldRender()` to prevent unnecessary renders
- Use `@key` directive for list items to help diffing algorithm
- Implement `IDisposable` and clean up event handlers
- Use `StateHasChanged()` judiciously

```csharp
@foreach (var item in items)
{
    <div @key="item.Id">@item.Name</div>
}

protected override bool ShouldRender()
{
    // Return false to skip render
    return shouldUpdate;
}
```

### Virtualization
```html
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize Items="@largeList" Context="item">
    <div>@item.Name</div>
</Virtualize>

<!-- Or with ItemsProvider for async loading -->
<Virtualize ItemsProvider="@LoadItems" Context="item">
    <div>@item.Name</div>
</Virtualize>

@code {
    private async ValueTask<ItemsProviderResult<MyItem>> LoadItems(
        ItemsProviderRequest request)
    {
        var items = await FetchItems(request.StartIndex, request.Count);
        return new ItemsProviderResult<MyItem>(items, totalCount);
    }
}
```

### Lazy Loading
```csharp
// Enable in Router component
<Router AppAssembly="@typeof(App).Assembly"
        OnNavigateAsync="@OnNavigateAsync">
    <Navigating>
        <p>Loading...</p>
    </Navigating>
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
    </Found>
</Router>

@code {
    private async Task OnNavigateAsync(NavigationContext context)
    {
        // Lazy load assemblies if needed
    }
}
```

### WASM Performance
- Use AOT compilation for production: `<RunAOTCompilation>true</RunAOTCompilation>`
- Enable trimming: `<PublishTrimmed>true</PublishTrimmed>`
- Use compression (Brotli/Gzip) on server
- Implement lazy loading for large apps
- Minimize JavaScript interop calls

## Best Practices

### Component Design
- **Single Responsibility**: Each component should have one clear purpose
- **Reusability**: Extract common UI patterns into shared components
- **Composition**: Use RenderFragments for flexible component composition
- **Parameter Naming**: Use clear, descriptive parameter names
- **Events**: Use EventCallback for proper async handling

### Code Organization
- **Pages vs Components**: Use `@page` directive only for routable pages
- **Shared Components**: Place in `Shared/` folder
- **Services**: Keep business logic in injected services, not components
- **Models**: Define data models in separate files
- **Constants**: Use static classes or configuration for magic strings

### Error Handling
```csharp
// Error boundary
<ErrorBoundary>
    <ChildContent>
        @ChildContent
    </ChildContent>
    <ErrorContent Context="exception">
        <p>An error occurred: @exception.Message</p>
    </ErrorContent>
</ErrorBoundary>

// Try-catch in components
@code {
    private string? errorMessage;

    private async Task LoadData()
    {
        try
        {
            await DataService.GetData();
        }
        catch (Exception ex)
        {
            errorMessage = $"Error loading data: {ex.Message}";
            Logger.LogError(ex, "Error loading data");
        }
    }
}
```

### Dependency Injection Lifetimes
- **Transient**: New instance every time (rare in Blazor)
- **Scoped**: Instance per circuit/user session (recommended for most services)
- **Singleton**: Single instance for all users (use carefully, especially in Server)

### CSS Isolation
```html
<!-- Component: MyComponent.razor -->
<div class="container">
    <h1>Title</h1>
</div>

<!-- MyComponent.razor.css -->
/* Scoped to this component only */
.container {
    background: blue;
}

h1 {
    color: white;
}
```

## Common Patterns

### Loading State
```csharp
@if (isLoading)
{
    <p>Loading...</p>
}
else if (error != null)
{
    <p class="error">@error</p>
}
else if (data != null)
{
    <DisplayData Data="@data" />
}
```

### Debouncing Input
```csharp
<input @bind="searchTerm" @bind:event="oninput" />

@code {
    private string searchTerm = "";
    private Timer? debounceTimer;

    private string SearchTerm
    {
        get => searchTerm;
        set
        {
            searchTerm = value;
            debounceTimer?.Dispose();
            debounceTimer = new Timer(PerformSearch, null, 300, Timeout.Infinite);
        }
    }

    private void PerformSearch(object? state)
    {
        InvokeAsync(async () =>
        {
            await SearchAsync(searchTerm);
            StateHasChanged();
        });
    }
}
```

### Confirmation Dialog
```csharp
<button @onclick="DeleteWithConfirmation">Delete</button>

@if (showConfirmation)
{
    <div class="modal">
        <p>Are you sure?</p>
        <button @onclick="ConfirmDelete">Yes</button>
        <button @onclick="CancelDelete">No</button>
    </div>
}

@code {
    private bool showConfirmation;

    private void DeleteWithConfirmation()
    {
        showConfirmation = true;
    }

    private async Task ConfirmDelete()
    {
        showConfirmation = false;
        await PerformDelete();
    }

    private void CancelDelete()
    {
        showConfirmation = false;
    }
}
```

## Troubleshooting

### Common Issues

**Circuit/Connection Lost (Blazor Server)**
- Implement reconnection UI
- Handle `OnCircuitClosed` event
- Increase timeout: `services.AddServerSideBlazor().AddCircuitOptions(o => o.DisconnectedCircuitRetentionPeriod = TimeSpan.FromMinutes(3))`

**WASM Load Time**
- Enable compression, use AOT compilation, implement lazy loading
- Consider Blazor Server for faster initial load

**StateHasChanged Not Working**
- Ensure called within `InvokeAsync()` when updating from background thread
- Check component lifecycle (may not be initialized)

**JavaScript Interop Errors**
- Call JS only in `OnAfterRender` with `firstRender` check
- Ensure JS libraries loaded before calling
- Check browser console for JS errors

**Parameter Not Updating**
- Parameters only update on parent re-render
- Use `OnParametersSet` to react to parameter changes
- Check parent is passing new reference (not mutating object)

## Implementation Approach

When implementing Blazor features:

1. **Choose hosting model** based on requirements (Server/WASM/Hybrid)
2. **Design component hierarchy** - identify reusable components
3. **Define data flow** - parameters down, events up
4. **Implement state management** - component state, cascading values, or services
5. **Add validation** - use DataAnnotations and EditForm
6. **Handle errors** - ErrorBoundary and try-catch patterns
7. **Optimize** - virtualization, lazy loading, rendering optimization
8. **Test** - unit tests with bUnit, integration tests

## Resources Reference

For detailed documentation, refer to:
- Microsoft Blazor documentation
- Component API reference
- Blazor hosting models comparison
- Performance best practices guides
