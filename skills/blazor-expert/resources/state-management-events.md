# Blazor State Management & Events

## Component State

State represents the data that a component manages and renders.

### Local Component State

```csharp
@page "/counter"

<p>Count: @count</p>
<button @onclick="Increment">Click me</button>

@code {
    private int count = 0;

    private void Increment()
    {
        count++;
        // Re-render happens automatically after event handler
    }
}
```

**How it works:**
- Blazor detects state change during event handler execution
- Automatically calls `StateHasChanged()` after handler completes
- Component re-renders with new state

### StateHasChanged() for External Updates

When state updates from outside Blazor's event system, call `StateHasChanged()` explicitly:

```csharp
@implements IDisposable
@inject IJSRuntime JS

private string? externalData;

protected override void OnInitialized()
{
    // Subscribe to external event
    JS.InvokeVoidAsync("subscribeToEvent", DotNetObjectReference.Create(this));
}

[JSInvokable]
public void NotifyUpdate(string data)
{
    externalData = data;
    // Blazor doesn't know about JS update, must call explicitly
    StateHasChanged();
}

public void Dispose()
{
    // Clean up external subscriptions
}
```

### Thread-Safe State Updates with InvokeAsync()

When updating state from background threads (timers, async tasks outside event handlers):

```csharp
@implements IDisposable

private Timer? timer;
private int count = 0;

protected override void OnInitialized()
{
    // Timer running on background thread
    timer = new Timer(_ => UpdateCount(), null, TimeSpan.Zero, TimeSpan.FromSeconds(1));
}

private void UpdateCount()
{
    // WRONG - can't update state from background thread directly
    // count++;

    // CORRECT - use InvokeAsync to marshal to UI thread
    InvokeAsync(() =>
    {
        count++;
        StateHasChanged();
    });
}

public void Dispose()
{
    timer?.Dispose();
}
```

### State Immutability Pattern

For complex state (objects, lists), follow immutability pattern:

```csharp
@code {
    private List<Item> items = [];

    // WRONG - mutates in place, may not trigger re-render
    private void AddItem()
    {
        items.Add(new Item { Name = "New" });
    }

    // CORRECT - create new collection
    private void AddItem()
    {
        items = items.Append(new Item { Name = "New" }).ToList();
    }
}
```

## Event Handling

### Basic Click Handler

```csharp
<button @onclick="HandleClick">Click me</button>

@code {
    private void HandleClick()
    {
        // Event handler logic
    }
}
```

### EventCallback Pattern (Recommended)

EventCallback is the proper way to notify parent components of events:

```csharp
<!-- Child component -->
<button @onclick="OnClick">Click me</button>

@code {
    [Parameter]
    public EventCallback<string> OnValueChanged { get; set; }

    private async Task OnClick()
    {
        await OnValueChanged.InvokeAsync("New Value");
    }
}

<!-- Parent component -->
<ChildComponent OnValueChanged="@HandleValueChanged" />

@code {
    private void HandleValueChanged(string value)
    {
        // Handle value change
    }
}
```

### EventCallback with Arguments

```csharp
<!-- Child -->
<button @onclick="NotifyParent">Send Data</button>

@code {
    [Parameter]
    public EventCallback<CustomArgs> OnDataChanged { get; set; }

    private async Task NotifyParent()
    {
        var args = new CustomArgs { Id = 123, Name = "Test" };
        await OnValueChanged.InvokeAsync(args);
    }
}

public class CustomArgs
{
    public int Id { get; set; }
    public string? Name { get; set; }
}

<!-- Parent -->
<ChildComponent OnDataChanged="@(args => HandleData(args.Id, args.Name))" />

@code {
    private void HandleData(int id, string? name)
    {
        // Process data
    }
}
```

### Async Event Handlers

Always use async properly with EventCallback:

```csharp
<!-- Good - async handler, proper awaiting -->
<button @onclick="SaveAsync">Save</button>

@code {
    private async Task SaveAsync()
    {
        isLoading = true;
        try
        {
            await Service.SaveDataAsync(data);
            successMessage = "Saved!";
        }
        catch (Exception ex)
        {
            errorMessage = ex.Message;
        }
        finally
        {
            isLoading = false;
        }
    }
}
```

### Common Event Handlers

```csharp
<!-- Click -->
<button @onclick="HandleClick">Click</button>

<!-- Double click -->
<div @ondblclick="HandleDoubleClick">Double click</div>

<!-- Focus/Blur -->
<input @onfocus="HandleFocus" @onblur="HandleBlur" />

<!-- Key events -->
<input @onkeydown="HandleKeyDown" @onkeyup="HandleKeyUp" />

<!-- Mouse events -->
<div @onmouseover="HandleMouseOver" @onmouseout="HandleMouseOut" />

<!-- Change -->
<select @onchange="HandleChange">
    <option>Option 1</option>
</select>

<!-- Submit -->
<form @onsubmit="HandleSubmit">
    <button type="submit">Submit</button>
</form>
```

### preventDefault and stopPropagation

```csharp
<!-- Prevent form submission -->
<form @onsubmit:preventDefault="true" @onsubmit="HandleSubmit">
    <input type="text" />
    <button type="submit">Submit</button>
</form>

<!-- Stop event propagation -->
<div @onclick="ParentClick">
    <button @onclick="ChildClick" @onclick:stopPropagation="true">
        Click - won't bubble
    </button>
</div>
```

## Data Binding

### Two-Way Binding (@bind)

```csharp
<input @bind="name" />
<p>You entered: @name</p>

@code {
    private string name = "";
}
```

**How it works:**
- `@bind` = `@bind-value` + `@bind-value:event="onchange"`
- Sets value property, listens to onchange event
- Automatic two-way synchronization

### Custom Events with @bind

```csharp
<input @bind="value" @bind:event="oninput" />

@code {
    private string value = "";
}
```

Events: `onchange` (default), `oninput` (real-time), `onblur`, etc.

### Numeric Binding

```csharp
<input @bind="age" @bind:culture="CultureInfo.InvariantCulture" />

@code {
    private int age = 0;
}
```

### DateTime Binding

```csharp
<input type="date" @bind="date" />
<input type="datetime-local" @bind="dateTime" />

@code {
    private DateOnly date = DateOnly.FromDateTime(DateTime.Now);
    private DateTime dateTime = DateTime.Now;
}
```

### Binding with Format Specifiers

```csharp
<input @bind="price" @bind:format="N2" />
<p>Price: @price.ToString("C")</p>

@code {
    private decimal price = 0;
}
```

### Bind Modifiers

```csharp
<!-- @bind:get / @bind:set for custom logic -->
<input @bind="@value" 
       @bind:get="parsedValue" 
       @bind:set="@SetValue" />

@code {
    private string value = "";
    
    private string parsedValue
    {
        get => value.ToUpper();
    }
    
    private void SetValue(string val)
    {
        value = val.ToLower();
    }
}
```

## Cascading Values with Events

Provide shared state and event callbacks to child components:

```csharp
<!-- Parent - AppState provider -->
<CascadingValue Value="@appState">
    @ChildContent
</CascadingValue>

@code {
    private AppState appState = new();
    
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}

<!-- AppState service -->
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

    public void NotifyStateChanged() => OnChange?.Invoke();
}

<!-- Child component - subscribe to state changes -->
@implements IDisposable
@code {
    [CascadingParameter]
    public AppState? AppState { get; set; }

    protected override void OnInitialized()
    {
        if (AppState != null)
        {
            AppState.OnChange += StateHasChanged;
        }
    }

    public void Dispose()
    {
        if (AppState != null)
        {
            AppState.OnChange -= StateHasChanged;
        }
    }
}
```

## Service-Based State Management

For application-wide state, use services:

```csharp
// Program.cs
builder.Services.AddScoped<AppState>();

// AppState service
public class AppState
{
    private string _theme = "light";
    private User? _currentUser;
    
    public event Func<Task>? OnStateChange;

    public string Theme
    {
        get => _theme;
        set
        {
            if (_theme != value)
            {
                _theme = value;
                NotifyStateChanged();
            }
        }
    }

    public User? CurrentUser
    {
        get => _currentUser;
        set
        {
            if (_currentUser != value)
            {
                _currentUser = value;
                NotifyStateChanged();
            }
        }
    }

    private async Task NotifyStateChanged()
    {
        if (OnStateChange != null)
        {
            await OnStateChange.Invoke();
        }
    }
}

// Component using AppState
@inject AppState AppState
@implements IAsyncDisposable

@code {
    protected override async Task OnInitializedAsync()
    {
        AppState.OnStateChange += StateHasChanged;
        AppState.CurrentUser = await LoadUserAsync();
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (AppState != null)
        {
            AppState.OnStateChange -= StateHasChanged;
        }
    }
}
```

## Parent-Child Communication Pattern

**Data flow:** Parents pass data DOWN via parameters, children notify UP via events.

```csharp
<!-- Parent -->
@page "/parent"

<h2>Parent: @selectedId</h2>
<Child SelectedId="@selectedId" 
       OnIdChanged="@HandleIdChanged" />

@code {
    private int selectedId = 0;

    private async Task HandleIdChanged(int newId)
    {
        selectedId = newId;
    }
}

<!-- Child -->
<select @onchange="OnSelectionChanged">
    @foreach (var item in Items)
    {
        <option value="@item.Id">@item.Name</option>
    }
</select>

@code {
    [Parameter]
    public int SelectedId { get; set; }

    [Parameter]
    public EventCallback<int> OnIdChanged { get; set; }

    private List<Item> Items { get; set; } = [];

    private async Task OnSelectionChanged(ChangeEventArgs args)
    {
        var newId = int.Parse(args.Value?.ToString() ?? "0");
        await OnIdChanged.InvokeAsync(newId);
    }
}
```

## Best Practices

### Always Use EventCallback
- ✅ `[Parameter] public EventCallback OnEvent { get; set; }`
- ❌ `[Parameter] public Action? OnEvent { get; set; }`

EventCallback handles async properly and integrates better with Blazor's rendering pipeline.

### Keep Event Handlers Focused
- Do one thing per handler
- Move complex logic to services
- Keep components as thin view layers

### Unsubscribe from Events
Always clean up subscriptions to prevent memory leaks:

```csharp
@implements IDisposable

protected override void OnInitialized()
{
    Service.OnChange += HandleChange;
}

public void Dispose()
{
    Service.OnChange -= HandleChange;
}
```

### Use Immutable Updates
- Create new objects/collections for state updates
- Don't mutate objects in place
- Helps with change detection and debugging

---

**Related Resources:** See [components-lifecycle.md](components-lifecycle.md) for component parameters and cascading values. See [forms-validation.md](forms-validation.md) for form event handling.
