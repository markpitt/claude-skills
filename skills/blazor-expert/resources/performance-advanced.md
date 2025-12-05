# Blazor Performance & Advanced Patterns

## Rendering Optimization

### ShouldRender Override

Control when components re-render to prevent unnecessary rendering cycles.

```csharp
@page "/optimized"

<button @onclick="IncrementCount">Clicked @count times</button>
<ChildComponent Value="@value" />

@code {
    private int count = 0;
    private string value = "test";

    protected override bool ShouldRender()
    {
        // Only render if value changed, not if count changed
        // This component doesn't display count directly
        return false; // Skip render
    }

    private void IncrementCount()
    {
        count++;
        // Component won't re-render, child component won't re-render either
    }
}
```

### Tracking Changed Fields

```csharp
@page "/tracker"

<button @onclick="UpdateName">Update Name</button>
<button @onclick="UpdateAge">Update Age</button>

<p>Name: @name</p>
<p>Age: @age</p>

@code {
    private string? name;
    private int age;
    private bool nameChanged = false;
    private bool ageChanged = false;

    protected override bool ShouldRender()
    {
        if (!nameChanged && !ageChanged)
        {
            return false;
        }

        nameChanged = false;
        ageChanged = false;
        return true;
    }

    private void UpdateName()
    {
        name = "New Name";
        nameChanged = true;
    }

    private void UpdateAge()
    {
        age = 30;
        ageChanged = true;
    }
}
```

### Key Directive for List Items

```csharp
@page "/list"

<button @onclick="AddItem">Add Item</button>

@foreach (var item in items)
{
    <!-- WITHOUT @key - new ItemComponent created for each item -->
    <!-- <ItemComponent Item="@item" />-->

    <!-- WITH @key - same ItemComponent reused if item.Id stays in list -->
    <ItemComponent @key="item.Id" Item="@item" />
}

@code {
    private List<Item> items = [];

    private void AddItem()
    {
        items = items.Prepend(new Item { Id = Guid.NewGuid(), Name = "New" }).ToList();
    }
}

public class Item
{
    public Guid Id { get; set; }
    public string? Name { get; set; }
}
```

**Why @key matters:**
- Helps Blazor's diffing algorithm match old components to new items
- Prevents component state loss during list reordering
- Improves performance with large lists

### IDisposable for Cleanup

```csharp
@implements IAsyncDisposable
@inject IJSRuntime JS

private IJSObjectReference? module;
private Timer? timer;

protected override async Task OnInitializedAsync()
{
    timer = new Timer(_ => UpdateAsync(), null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
}

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        module = await JS.InvokeAsync<IJSObjectReference>(
            "import", "./myScript.js");
    }
}

async ValueTask IAsyncDisposable.DisposeAsync()
{
    timer?.Dispose();
    
    if (module is not null)
    {
        await module.DisposeAsync();
    }
}
```

## Virtualization

Virtualize large lists to render only visible items.

### Basic Virtualization

```csharp
@page "/large-list"
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize Items="@largeList" Context="item">
    <div class="item">
        <p>@item.Id - @item.Name</p>
    </div>
</Virtualize>

@code {
    private List<Item> largeList = [];

    protected override void OnInitialized()
    {
        // Generate 100,000 items
        largeList = Enumerable.Range(1, 100000)
            .Select(i => new Item { Id = i, Name = $"Item {i}" })
            .ToList();
    }
}
```

### Async Virtualization (Infinite Scroll)

```csharp
@page "/infinite-scroll"
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize ItemsProvider="@LoadItems" Context="item" OverscanCount="5">
    <div>@item.Name</div>
</Virtualize>

@code {
    private async ValueTask<ItemsProviderResult<Item>> LoadItems(
        ItemsProviderRequest request)
    {
        // Simulate loading from server
        var startIndex = request.StartIndex;
        var count = request.Count;

        var items = await Service.GetItemsAsync(startIndex, count);

        // Return items and total count for scrollbar sizing
        return new ItemsProviderResult<Item>(items, totalItemCount: 1000000);
    }
}
```

**Parameters:**
- `Items` - Static list of items to virtualize
- `ItemsProvider` - Async method to load items on demand
- `OverscanCount` - Extra items to render outside viewport (default 3)
- `ItemSize` - Estimated height for scrollbar calculation

## JavaScript Interop

### Invoke JavaScript from C#

```csharp
@inject IJSRuntime JS

<button @onclick="CallJavaScript">Click me</button>

@code {
    private async Task CallJavaScript()
    {
        // Simple call - no return value
        await JS.InvokeVoidAsync("console.log", "Hello from Blazor");

        // With return value
        var result = await JS.InvokeAsync<string>("myFunction", arg1, arg2);

        // Generic call with any return type
        var data = await JS.InvokeAsync<Data>("loadData");
    }
}
```

### JS Module Isolation (Recommended)

```csharp
// Component.razor
@implements IAsyncDisposable
@inject IJSRuntime JS

<div @ref="element">
    <canvas id="chart"></canvas>
</div>

@code {
    private ElementReference element;
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            // Import JS module
            module = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./scripts/chart.js");

            // Call exported function
            await module.InvokeVoidAsync("initChart", element);
        }
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (module is not null)
        {
            await module.DisposeAsync();
        }
    }
}

/* scripts/chart.js */
export function initChart(element) {
    const canvas = element.querySelector('#chart');
    // Initialize chart library
}
```

### Invoke C# from JavaScript

```csharp
// Component.razor
@implements IAsyncDisposable
@inject IJSRuntime JS

<button @onclick="SetupInterop">Setup</button>

@code {
    private IJSObjectReference? module;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            module = await JS.InvokeAsync<IJSObjectReference>(
                "import", "./scripts/interop.js");

            // Pass C# object reference to JS
            var objRef = DotNetObjectReference.Create(this);
            await module.InvokeVoidAsync("setupInterop", objRef);
        }
    }

    [JSInvokable]
    public async Task HandleJSEvent(string data)
    {
        Console.WriteLine($"JS called C#: {data}");
        // Update component state
        StateHasChanged();
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (module is not null)
        {
            await module.DisposeAsync();
        }
    }
}

/* scripts/interop.js */
let dotnetHelper;

export function setupInterop(dotnetRef) {
    dotnetHelper = dotnetRef;
    
    // Call C# method from JS
    document.addEventListener('click', async (e) => {
        await dotnetHelper.invokeMethodAsync('HandleJSEvent', 'User clicked');
    });
}
```

### Error Handling in Interop

```csharp
@code {
    private async Task SafeInvokeAsync()
    {
        try
        {
            await JS.InvokeVoidAsync("riskyFunction");
        }
        catch (JSException jsEx)
        {
            Console.WriteLine($"JS error: {jsEx.Message}");
        }
        catch (OperationCanceledException)
        {
            Console.WriteLine("JS call was cancelled");
        }
    }
}
```

## Lazy Loading

Load assemblies and components on demand.

### Lazy-Loaded Component Routes

```csharp
<!-- App.razor -->
<Router AppAssembly="@typeof(App).Assembly"
        AdditionalAssemblies="@additionalAssemblies"
        OnNavigateAsync="@OnNavigateAsync">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
    </Found>
    <NotFound>
        <p>Loading...</p>
    </NotFound>
</Router>

@code {
    private List<Assembly>? additionalAssemblies;

    protected override async Task OnInitializedAsync()
    {
        additionalAssemblies = new();
    }

    private async Task OnNavigateAsync(NavigationContext context)
    {
        // Load admin assembly only when accessing /admin
        if (context.Path.StartsWith("admin"))
        {
            var adminAssembly = await JS.InvokeAsync<byte[]>(
                "fetch", "./_framework/admin.wasm");
            
            additionalAssemblies!.Add(Assembly.Load(adminAssembly));
        }
    }
}
```

## WASM Performance Best Practices

### AOT Compilation

```xml
<!-- .csproj -->
<PropertyGroup>
    <RunAOTCompilation>true</RunAOTCompilation>
</PropertyGroup>
```

Benefits:
- No JIT compilation at runtime
- Faster startup time
- ~20% larger download
- Production recommended

### Trimming

```xml
<!-- .csproj -->
<PropertyGroup>
    <PublishTrimmed>true</PublishTrimmed>
</PropertyGroup>
```

Benefits:
- Removes unused code
- ~40% smaller download
- May cause runtime errors if reflection-based code removed
- Test thoroughly in Release build

### Compression

```xml
<!-- .csproj -->
<PropertyGroup>
    <BlazorWebAssemblyEnableCompression>true</BlazorWebAssemblyEnableCompression>
</PropertyGroup>
```

Server-side (in Program.cs):
```csharp
app.UseResponseCompression();

builder.Services.AddResponseCompression(opts =>
{
    opts.Filters.Add(new GzipCompressionProvider());
    opts.Filters.Add(new BrotliCompressionProvider());
});
```

### Minimize JavaScript Interop

```csharp
// INEFFICIENT - Many JS calls
for (int i = 0; i < 1000; i++)
{
    await JS.InvokeVoidAsync("updateUI", i);
}

// EFFICIENT - Single JS call with batch data
var updates = Enumerable.Range(0, 1000).ToList();
await JS.InvokeVoidAsync("updateUIBatch", updates);
```

## Error Boundaries

Handle component errors gracefully.

```csharp
@page "/error-demo"

<ErrorBoundary>
    <ChildContent>
        <ChildComponent />
    </ChildContent>
    <ErrorContent Context="ex">
        <div class="alert alert-danger">
            <h4>Error</h4>
            <p>@ex.Message</p>
            <button @onclick="ResetError">Try Again</button>
        </div>
    </ErrorContent>
</ErrorBoundary>

@code {
    private ErrorBoundary? errorBoundary;

    private async Task ResetError()
    {
        await errorBoundary!.RecoverAsync();
    }
}
```

## CSS Isolation

Scope CSS to specific components.

```html
<!-- MyComponent.razor -->
<div class="container">
    <h1>@Title</h1>
</div>

<!-- MyComponent.razor.css -->
.container {
    background-color: blue;
    padding: 20px;
}

h1 {
    color: white;
    font-size: 24px;
}
```

**Benefits:**
- No global namespace pollution
- Component-specific styling
- CSS automatically scoped to component
- Compiled into assembly

## Best Practices Summary

### Performance
- Use `@key` on list items
- Override `ShouldRender()` to prevent unnecessary renders
- Use virtualization for large lists
- Minimize JavaScript interop calls
- Enable AOT compilation and trimming for WASM

### JavaScript Interop
- Use module isolation pattern
- Always dispose JS module references
- Handle JS exceptions properly
- Only call JS in `OnAfterRender` with firstRender check
- Minimize interop calls for performance

### Architecture
- Keep components simple and focused
- Move logic to services
- Use cascading values for shared state
- Implement IDisposable for cleanup
- Validate authorization on server side

### User Experience
- Show loading states during async operations
- Provide error feedback
- Use AuthorizeView for conditional rendering
- Implement error boundaries
- Test on slow connections

---

**Related Resources:** See [components-lifecycle.md](components-lifecycle.md) for component disposal patterns. See [state-management-events.md](state-management-events.md) for state update optimization.
