# Blazor Components & Component Lifecycle

## Component Structure

Components are the fundamental building blocks of Blazor applications. A Blazor component is a self-contained piece of UI with an optional logic.

### Basic Component Syntax

```csharp
@page "/example"
@using MyApp.Services
@inject IMyService MyService

<h3>@Title</h3>
<div>@ChildContent</div>
<button @onclick="HandleClick">Click me</button>

@code {
    [Parameter]
    public string Title { get; set; } = "Default";

    [Parameter]
    public RenderFragment? ChildContent { get; set; }

    private void HandleClick()
    {
        // Handle button click
    }
}
```

Key elements:
- **`@page` directive**: Makes component routable (optional for non-page components)
- **`@using`**: Import namespaces
- **`@inject`**: Dependency injection
- **HTML markup**: Regular HTML with Blazor directives
- **`@code` block**: C# logic including lifecycle methods

### Component vs Page

- **Page Component**: Has `@page` directive, routable via URL
  - Example: `/Counter` route
  - Located in `Pages/` folder (convention)
  
- **Reusable Component**: No `@page` directive, used by other components
  - Example: `<UserCard @bind-User="user" />`
  - Located in `Shared/` or domain-specific folder

## Component Lifecycle

### Lifecycle Sequence

Component lifecycle methods execute in this order:

```
1. SetParametersAsync()
   ↓
2. OnInitialized() or OnInitializedAsync()
   ↓
3. OnParametersSet() or OnParametersSetAsync()
   ↓
4. ShouldRender() [decision point - skip if returns false]
   ↓
5. OnAfterRender() or OnAfterRenderAsync()
```

When parameters change (parent re-renders):
```
SetParametersAsync() [parameters updated]
  ↓
OnParametersSet() [NOT OnInitialized - that runs once only]
  ↓
ShouldRender()
  ↓
OnAfterRender()
```

### Lifecycle Methods Detailed

#### SetParametersAsync()
- **When**: First method called, before initialization
- **Purpose**: Set component parameters
- **Usage**: Rarely overridden, use OnInitialized instead
- **Code Example**:
```csharp
public override async Task SetParametersAsync(ParameterView parameters)
{
    // Custom parameter processing if needed
    await base.SetParametersAsync(parameters);
}
```

#### OnInitialized / OnInitializedAsync()
- **When**: Once per component lifetime, after parameters set
- **Purpose**: Initialize component state, load data
- **Runs**: Only ONCE, even if parameters change
- **Code Example**:
```csharp
protected override async Task OnInitializedAsync()
{
    await base.OnInitializedAsync();
    data = await Service.LoadDataAsync();
}
```

**Common Uses:**
- Load initial data from API
- Set up subscriptions
- Initialize state based on parameters

#### OnParametersSet / OnParametersSetAsync()
- **When**: After parameters set, runs EVERY time parameters change
- **Purpose**: React to parameter changes
- **Runs**: Every time parent re-renders with different values
- **Code Example**:
```csharp
protected override async Task OnParametersSetAsync()
{
    await base.OnParametersSetAsync();
    if (UserId != previousUserId)
    {
        data = await Service.LoadUserDataAsync(UserId);
        previousUserId = UserId;
    }
}
```

**Common Uses:**
- Update UI based on new parameter values
- Fetch new data when ID parameter changes
- React to cascading parameter changes

#### ShouldRender()
- **When**: Before DOM rendering, decision point
- **Purpose**: Optimize rendering by skipping unnecessary renders
- **Returns**: true (render) or false (skip)
- **Code Example**:
```csharp
protected override bool ShouldRender()
{
    // Only render if specific field changed
    return hasChanged;
}
```

**Common Optimizations:**
- Skip render if data unchanged
- Prevent re-render from external events
- Implement custom change detection

#### OnAfterRender / OnAfterRenderAsync()
- **When**: After component rendered to DOM
- **Purpose**: Work with DOM, initialize JS libraries, final setup
- **Parameter**: `firstRender` - true only on first render
- **Code Example**:
```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        // Initialize JS library only once
        await JS.InvokeVoidAsync("initializeChart", elementRef);
    }
}
```

**Critical Use Case:**
```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
    await base.OnAfterRenderAsync(firstRender);
    
    if (firstRender)
    {
        // Load JS module
        module = await JS.InvokeAsync<IJSObjectReference>(
            "import", "./scripts/myScript.js");
        
        // Initialize library
        await module.InvokeVoidAsync("setupChart", element);
    }
}
```

**Important:** Always use `firstRender` check for one-time initialization. This prevents re-initializing on every parameter change.

## Component Parameters

### Parameter Declaration

```csharp
@code {
    // Simple parameter
    [Parameter]
    public string Title { get; set; } = "Default";

    // Required parameter (C# 11+)
    [Parameter, EditorRequired]
    public int UserId { get; set; }

    // Child content
    [Parameter]
    public RenderFragment? ChildContent { get; set; }

    // Event callback
    [Parameter]
    public EventCallback<string> OnValueChanged { get; set; }

    // Cascading parameter
    [CascadingParameter]
    public ThemeInfo? CurrentTheme { get; set; }
}
```

### Parameter Best Practices

**Use Clear Names:**
```csharp
// ✅ Good - clear intent
[Parameter]
public bool IsVisible { get; set; }

// ❌ Poor - ambiguous
[Parameter]
public bool State { get; set; }
```

**Use Nullable Types for Optional:**
```csharp
// ✅ Good - nullable indicates optional
[Parameter]
public string? OptionalValue { get; set; }

// ✅ Good - default value
[Parameter]
public int MaxItems { get; set; } = 10;

// ❌ Poor - not clear if optional
[Parameter]
public string RequiredValue { get; set; }
```

**Use [EditorRequired] for Required Parameters (C# 11+):**
```csharp
// ✅ Best practice - compiler enforces, IDE warns
[Parameter, EditorRequired]
public string Title { get; set; } = default!;

// Fallback for older C#
[Parameter]
public string Title { get; set; } = default!;
```

**Use EventCallback for Child-to-Parent Communication:**
```csharp
// ✅ Correct - EventCallback for async safety
[Parameter]
public EventCallback<string> OnValueChanged { get; set; }

// ✅ With custom args
[Parameter]
public EventCallback<ValueChangeEventArgs> OnValueChanged { get; set; }

// ❌ Avoid - direct Action, not async-safe
[Parameter]
public Action<string>? OnValueChanged { get; set; }
```

### Parameter Change Detection

To know when a parameter changed:

```csharp
@code {
    private int previousUserId;

    [Parameter]
    public int UserId { get; set; }

    protected override async Task OnParametersSetAsync()
    {
        if (UserId != previousUserId)
        {
            previousUserId = UserId;
            await LoadUserData();
        }
    }
}
```

Or use a comparison strategy:

```csharp
private object? previousCriteria;

protected override async Task OnParametersSetAsync()
{
    var currentCriteria = (SearchId, SearchTerm);
    
    if (!Equals(previousCriteria, currentCriteria))
    {
        previousCriteria = currentCriteria;
        await PerformSearch();
    }
}
```

## Cascading Values

Cascading values allow ancestor components to provide data to all descendants without explicit parameter passing.

### Providing Cascading Values

```csharp
<!-- Parent component -->
<CascadingValue Value="@currentUser">
    @ChildContent
</CascadingValue>

@code {
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
    
    private User currentUser = new();
}
```

### Receiving Cascading Values

```csharp
<!-- Child component anywhere in hierarchy -->
@code {
    [CascadingParameter]
    public User? CurrentUser { get; set; }
    
    protected override void OnInitialized()
    {
        if (CurrentUser == null)
        {
            // Handle missing cascading value
        }
    }
}
```

### Multiple Cascading Values

```csharp
<!-- Provider -->
<CascadingValue Value="@theme">
    <CascadingValue Value="@currentUser">
        <CascadingValue Value="@permissions">
            @ChildContent
        </CascadingValue>
    </CascadingValue>
</CascadingValue>

<!-- Consumer - multiple parameters -->
@code {
    [CascadingParameter]
    public Theme? Theme { get; set; }
    
    [CascadingParameter]
    public User? CurrentUser { get; set; }
    
    [CascadingParameter]
    public Permissions? Permissions { get; set; }
}
```

### Named Cascading Values

For disambiguation when multiple values of same type:

```csharp
<!-- Provider -->
<CascadingValue Value="@themeLight" Name="Light">
    <CascadingValue Value="@themeDark" Name="Dark">
        @ChildContent
    </CascadingValue>
</CascadingValue>

<!-- Consumer -->
@code {
    [CascadingParameter(Name = "Light")]
    public Theme? LightTheme { get; set; }
    
    [CascadingParameter(Name = "Dark")]
    public Theme? DarkTheme { get; set; }
}
```

## RenderFragment for Component Composition

RenderFragment enables flexible component composition.

### Basic RenderFragment

```csharp
<!-- Parent component -->
<div>
    <h2>Header</h2>
    @ChildContent
    <footer>Footer</footer>
</div>

@code {
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}

<!-- Usage -->
<Layout>
    <p>This is the main content</p>
</Layout>
```

### Typed RenderFragment with Context

```csharp
<!-- ListComponent.razor -->
@foreach (var item in Items)
{
    @ItemTemplate(item)
}

@code {
    [Parameter]
    public IEnumerable<Item> Items { get; set; } = [];
    
    [Parameter]
    public RenderFragment<Item>? ItemTemplate { get; set; }
}

<!-- Usage -->
<ListComponent Items="@items">
    <ItemTemplate Context="item">
        <div>@item.Name - @item.Price</div>
    </ItemTemplate>
</ListComponent>
```

### Multiple Named Content Areas

```csharp
<!-- Card component with multiple slots -->
<div class="card">
    <div class="card-header">@Header</div>
    <div class="card-body">@Body</div>
    <div class="card-footer">@Footer</div>
</div>

@code {
    [Parameter]
    public RenderFragment? Header { get; set; }
    
    [Parameter]
    public RenderFragment? Body { get; set; }
    
    [Parameter]
    public RenderFragment? Footer { get; set; }
}

<!-- Usage -->
<Card>
    <Header>
        <h3>Card Title</h3>
    </Header>
    <Body>
        <p>Card content</p>
    </Body>
    <Footer>
        <button>Action</button>
    </Footer>
</Card>
```

## Component Best Practices

### Single Responsibility
- Each component should have one clear purpose
- Avoid god components that do too much
- Example: `UserProfile` component should focus on displaying user info, not handle complex business logic

### Composition Over Inheritance
- Use cascading values for shared state, not deep hierarchies
- Compose components rather than creating base classes
- Example: Create theme provider component instead of theme-aware base class

### Keep Components Simple
- Minimize `@code` block logic
- Move complex logic to services
- Example: Validation logic → ValidationService, not in component

### Proper Disposal
- Implement `IDisposable` or `IAsyncDisposable`
- Unsubscribe from events
- Dispose timers and resources

```csharp
@implements IAsyncDisposable
@inject IJSRuntime JS

private IJSObjectReference? module;

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
    if (module is not null)
    {
        await module.DisposeAsync();
    }
}
```

---

**Related Resources:** See [state-management-events.md](state-management-events.md) for event handling and state updates. See [performance-advanced.md](performance-advanced.md) for optimization techniques.
