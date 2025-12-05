# Blazor Routing & Navigation

## Route Definition

Routes map URL paths to Blazor components.

### Basic Route Definition

```csharp
@page "/product"
@page "/product/{id}"

<h3>Product: @Id</h3>

@code {
    [Parameter]
    public string? Id { get; set; }
}
```

**How it works:**
- `@page` directive makes component routable
- Parameter name in URL (`{id}`) must match parameter name in `@code` block
- Multiple `@page` directives supported (same component, multiple routes)

### Route Parameters

```csharp
@page "/product/{id}"
<p>Product: @id</p>

@page "/category/{categoryId}/product/{productId}"
<p>Category: @categoryId, Product: @productId</p>

@code {
    [Parameter]
    public string? id { get; set; }

    [Parameter]
    public string? categoryId { get; set; }

    [Parameter]
    public string? productId { get; set; }
}
```

**Parameter Matching:**
- Blazor matches route segments to parameter names (case-insensitive)
- `{id}` in route matches `Id` parameter
- Extra parameters in URL are ignored

### Route Constraints

Route constraints enforce parameter type and format:

```csharp
@page "/product/{id:int}"           <!-- Integer only -->
@page "/order/{orderId:long}"       <!-- Long integer -->
@page "/user/{id:guid}"             <!-- GUID format -->
@page "/article/{slug:string}"      <!-- String (default) -->
@page "/event/{date:datetime}"      <!-- DateTime format -->
@page "/price/{amount:decimal}"     <!-- Decimal number -->
@page "/flag/{active:bool}"         <!-- Boolean -->
@page "/value/{num:double}"         <!-- Double/Float -->

@code {
    [Parameter]
    public int id { get; set; }
    
    [Parameter]
    public Guid id { get; set; }
    
    [Parameter]
    public bool active { get; set; }
}
```

**Built-in Constraints:**
- `:int` - Integer values
- `:long` - Long integers
- `:guid` - GUID format
- `:bool` - Boolean
- `:datetime` - DateTime format
- `:decimal` - Decimal numbers
- `:double` / `:float` - Floating point
- `:string` - Any string (default)

### Optional Route Parameters

```csharp
@page "/search"
@page "/search/{searchTerm}"

<p>Search term: @(searchTerm ?? "All results")</p>

@code {
    [Parameter]
    public string? searchTerm { get; set; }
}
```

### Catch-All Routes

```csharp
@page "/{*pageRoute}"

<p>Page not found: @pageRoute</p>

@code {
    [Parameter]
    public string? pageRoute { get; set; }
}
```

## Navigation

### Programmatic Navigation

```csharp
@inject NavigationManager Navigation

<button @onclick="GoHome">Go Home</button>
<button @onclick="GoToUser">Go to User</button>

@code {
    private void GoHome()
    {
        Navigation.NavigateTo("/");
    }

    private void GoToUser()
    {
        Navigation.NavigateTo("/user/123");
    }
}
```

### Navigation with Options

```csharp
// Replace browser history entry instead of adding new one
Navigation.NavigateTo("/home", replace: true);

// Force full page reload from server
Navigation.NavigateTo("/refresh", forceLoad: true);

// Combine options
Navigation.NavigateTo("/new-page", replace: true, forceLoad: true);
```

**When to use `forceLoad: true`:**
- After logout to clear client-side state
- Accessing completely different app
- Clearing service worker cache
- Full server-side initialization needed

### NavLink Component

NavLink automatically highlights active route:

```csharp
<NavLink href="/home" Match="NavLinkMatch.All">
    <span class="icon">🏠</span> Home
</NavLink>

<NavLink href="/products" Match="NavLinkMatch.Prefix">
    <span class="icon">📦</span> Products
</NavLink>

<NavLink href="/about" Match="NavLinkMatch.None">
    About
</NavLink>

@code {
    // CSS class applied to active NavLink: active
}
```

**Match options:**
- `NavLinkMatch.All` - Exact URL match required
- `NavLinkMatch.Prefix` - URL starts with href (default)
- `NavLinkMatch.None` - Never highlights

**CSS:**
```css
a.active {
    color: white;
    background-color: blue;
}
```

### Listen to Location Changes

```csharp
@implements IDisposable
@inject NavigationManager Navigation

<p>Current location: @Navigation.Uri</p>

@code {
    protected override void OnInitialized()
    {
        Navigation.LocationChanged += LocationChanged;
    }

    private void LocationChanged(object? sender, LocationChangedEventArgs e)
    {
        Console.WriteLine($"New location: {e.Location}");
        
        // React to navigation
        StateHasChanged();
    }

    public void Dispose()
    {
        Navigation.LocationChanged -= LocationChanged;
    }
}
```

## Query Strings

### Reading Query Parameters

```csharp
@page "/search"
@inject NavigationManager Navigation

<p>Search results for: @searchQuery</p>

@code {
    private string? searchQuery;

    protected override void OnInitialized()
    {
        var uri = Navigation.ToAbsoluteUri(Navigation.Uri);
        var query = System.Web.HttpUtility.ParseQueryString(uri.Query);
        searchQuery = query["q"];
    }
}
```

**Usage:** `/search?q=blazor` → `searchQuery = "blazor"`

### Building Query Strings

```csharp
private void Search(string term)
{
    Navigation.NavigateTo($"/search?q={Uri.EscapeDataString(term)}");
}

// Or use QueryHelpers (in .NET 6+)
var query = new Dictionary<string, string>
{
    { "q", "blazor" },
    { "page", "1" }
};

var url = NavigationManager.GetUriWithQueryParameters("/search", query);
Navigation.NavigateTo(url);
```

### Multiple Query Parameters

```csharp
var uri = Navigation.ToAbsoluteUri(Navigation.Uri);
var query = System.Web.HttpUtility.ParseQueryString(uri.Query);

var category = query["category"];
var page = int.TryParse(query["page"], out var p) ? p : 1;
var sort = query["sort"] ?? "name";
```

**Usage:** `/products?category=electronics&page=2&sort=price`

## Router Configuration

The Router component in `App.razor` configures routing:

```csharp
<!-- App.razor -->
<Router AppAssembly="@typeof(App).Assembly"
        AdditionalAssemblies="@additionalAssemblies"
        OnNavigateAsync="@OnNavigateAsync">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(MainLayout)" />
        <PageTitle>@pageTitle</PageTitle>
    </Found>
    <NotFound>
        <LayoutView Layout="@typeof(MainLayout)">
            <p>Page not found</p>
        </LayoutView>
    </NotFound>
</Router>

@code {
    private List<Assembly>? additionalAssemblies;
    private string pageTitle = "Loading...";

    protected override async Task OnInitializedAsync()
    {
        // Load assemblies dynamically if needed
        additionalAssemblies = new List<Assembly>
        {
            typeof(SomeOtherAssembly).Assembly
        };
    }

    private async Task OnNavigateAsync(NavigationContext context)
    {
        // Can be used for lazy loading assemblies
        // Not commonly needed
    }
}
```

## Layouts

Layouts are parent components that wrap pages.

### Define a Layout

```csharp
<!-- Layouts/MainLayout.razor -->
@inherits LayoutComponentBase

<header>@Header</header>
<nav>@Navigation</nav>

<main>@Body</main>

<footer>@Footer</footer>

@code {
    [Parameter]
    public RenderFragment? Header { get; set; }
    
    [Parameter]
    public RenderFragment? Navigation { get; set; }
    
    [Parameter]
    public RenderFragment? Body { get; set; }
    
    [Parameter]
    public RenderFragment? Footer { get; set; }
}
```

### Apply Layout to Page

```csharp
@page "/products"
@layout MainLayout

<h2>Products</h2>
```

### Apply Layout to Multiple Pages

```csharp
<!-- _Imports.razor -->
@layout MainLayout
```

Add this line to `_Imports.razor` to apply layout to all components in folder and below.

### Nested Layouts

```csharp
<!-- AdminLayout inherits from MainLayout -->
@inherits MainLayout

<aside>Admin sidebar</aside>
@Body
```

## Page Titles

Update page title (browser tab) dynamically:

```csharp
@page "/products/{id}"
@inject NavigationManager Navigation

<PageTitle>@title</PageTitle>

<h1>@title</h1>

@code {
    [Parameter]
    public string? id { get; set; }

    private string? title;

    protected override async Task OnParametersSetAsync()
    {
        title = await LoadProductTitleAsync(id);
    }

    private async Task<string> LoadProductTitleAsync(string? id)
    {
        // Load from service
        return $"Product {id}";
    }
}
```

## Common Routing Patterns

### Master-Detail Pattern

```csharp
@page "/products"
@page "/products/{id}"

<div style="display: grid; grid-template-columns: 1fr 1fr;">
    <ProductList OnSelectProduct="@SelectProduct" />
    @if (selectedId != null)
    {
        <ProductDetail Id="@selectedId" />
    }
</div>

@code {
    [Parameter]
    public string? id { get; set; }

    private string? selectedId;

    protected override void OnParametersSet()
    {
        selectedId = id;
    }

    private void SelectProduct(string productId)
    {
        Navigation.NavigateTo($"/products/{productId}");
    }
}
```

### Breadcrumb Navigation

```csharp
@page "/category/{categoryId}/product/{productId}"

<div class="breadcrumb">
    <a href="/">Home</a> /
    <a href="/category/@categoryId">@categoryName</a> /
    <span>@productName</span>
</div>

@code {
    [Parameter]
    public string? categoryId { get; set; }

    [Parameter]
    public string? productId { get; set; }

    private string? categoryName;
    private string? productName;

    protected override async Task OnParametersSetAsync()
    {
        categoryName = await LoadCategoryAsync(categoryId);
        productName = await LoadProductAsync(productId);
    }
}
```

### Tab-Based Navigation

```csharp
@page "/settings"

<div class="tabs">
    <NavLink href="/settings/profile" Match="NavLinkMatch.All">Profile</NavLink>
    <NavLink href="/settings/security" Match="NavLinkMatch.All">Security</NavLink>
    <NavLink href="/settings/notifications" Match="NavLinkMatch.All">Notifications</NavLink>
</div>

<Router AppAssembly="@typeof(App).Assembly">
    <Found Context="routeData">
        <RouteView RouteData="@routeData" DefaultLayout="@typeof(SettingsLayout)" />
    </Found>
</Router>
```

---

**Related Resources:** See [components-lifecycle.md](components-lifecycle.md) for parameter handling. See [authentication-authorization.md](authentication-authorization.md) for route authorization.
