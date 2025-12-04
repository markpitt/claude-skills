# Reactive Programming and Animations

Advanced reactive patterns and animation techniques for creating responsive, dynamic Avalonia applications.

## ReactiveUI Integration

### Core Concepts

ReactiveUI provides:
- Reactive MVVM patterns
- Observable sequences for event handling
- Built-in commands with CanExecute support
- Reactive properties that notify on change

### Installation

```xml
<!-- Project.csproj -->
<ItemGroup>
    <PackageReference Include="ReactiveUI" Version="19.*" />
    <PackageReference Include="ReactiveUI.Avalonia" Version="19.*" />
    <PackageReference Include="System.Reactive" Version="5.*" />
</ItemGroup>
```

### Reactive Properties

```csharp
using ReactiveUI;

public class SearchViewModel : ReactiveObject
{
    private string _searchText;
    public string SearchText
    {
        get => _searchText;
        set => this.RaiseAndSetIfChanged(ref _searchText, value);
    }

    private ObservableCollection<Result> _results;
    public ObservableCollection<Result> Results
    {
        get => _results;
        set => this.RaiseAndSetIfChanged(ref _results, value);
    }

    private bool _isSearching;
    public bool IsSearching
    {
        get => _isSearching;
        set => this.RaiseAndSetIfChanged(ref _isSearching, value);
    }

    public SearchViewModel()
    {
        // React to search text changes
        this.WhenAnyValue(x => x.SearchText)
            .Throttle(TimeSpan.FromMilliseconds(300))
            .DistinctUntilChanged()
            .ObserveOn(RxApp.MainThreadScheduler)
            .Subscribe(async text => await PerformSearch(text));
    }

    private async Task PerformSearch(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
        {
            Results = new ObservableCollection<Result>();
            return;
        }

        IsSearching = true;
        try
        {
            var results = await _searchService.SearchAsync(text);
            Results = new ObservableCollection<Result>(results);
        }
        finally
        {
            IsSearching = false;
        }
    }
}
```

### Reactive Commands

```csharp
public class MainViewModel : ReactiveObject
{
    private string _name;
    public string Name
    {
        get => _name;
        set => this.RaiseAndSetIfChanged(ref _name, value);
    }

    private string _email;
    public string Email
    {
        get => _email;
        set => this.RaiseAndSetIfChanged(ref _email, value);
    }

    public ReactiveCommand<Unit, Unit> SaveCommand { get; }

    public MainViewModel()
    {
        // CanExecute based on observable condition
        var canSave = this.WhenAnyValue(
            x => x.Name,
            x => x.Email,
            (name, email) => !string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(email));

        SaveCommand = ReactiveCommand.Create(Save, canSave);
    }

    private void Save()
    {
        // Save logic
    }
}
```

### Async Reactive Commands

```csharp
public class DataViewModel : ReactiveObject
{
    private ObservableCollection<Item> _items;
    public ObservableCollection<Item> Items
    {
        get => _items;
        set => this.RaiseAndSetIfChanged(ref _items, value);
    }

    public ReactiveCommand<Unit, IEnumerable<Item>> LoadCommand { get; }
    public ReactiveCommand<Item, Unit> DeleteCommand { get; }

    public DataViewModel()
    {
        // Async command that returns results
        LoadCommand = ReactiveCommand.CreateFromTask(LoadDataAsync);

        LoadCommand.Subscribe(items =>
        {
            Items = new ObservableCollection<Item>(items);
        });

        // Handle errors
        LoadCommand.ThrownExceptions.Subscribe(ex =>
        {
            ErrorMessage = ex.Message;
        });

        // Delete command with parameter
        var canDelete = this.WhenAnyValue(x => x.SelectedItem)
            .Select(item => item != null);

        DeleteCommand = ReactiveCommand.CreateFromTask<Item>(DeleteItemAsync, canDelete);
    }

    private async Task<IEnumerable<Item>> LoadDataAsync()
    {
        return await _dataService.GetItemsAsync();
    }

    private async Task DeleteItemAsync(Item item)
    {
        await _dataService.DeleteItemAsync(item);
        Items.Remove(item);
    }
}
```

### Observable Sequences

```csharp
public class EventViewModel : ReactiveObject
{
    private string _input;
    public string Input
    {
        get => _input;
        set => this.RaiseAndSetIfChanged(ref _input, value);
    }

    public ReactiveCommand<Unit, Unit> ClickCommand { get; }

    public EventViewModel()
    {
        // Throttle rapid changes
        this.WhenAnyValue(x => x.Input)
            .Throttle(TimeSpan.FromMilliseconds(500))
            .Subscribe(value => ProcessInput(value));

        // Debounce with distinctness
        this.WhenAnyValue(x => x.Input)
            .Debounce(TimeSpan.FromMilliseconds(500))
            .DistinctUntilChanged()
            .Subscribe(value => SearchAsync(value));

        // Combine multiple values
        var canExecute = this.WhenAnyValue(
            x => x.Input,
            input => !string.IsNullOrEmpty(input));

        ClickCommand = ReactiveCommand.Create(OnClick, canExecute);
    }

    private void ProcessInput(string value)
    {
        // Handle input
    }

    private async Task SearchAsync(string value)
    {
        // Perform search
    }

    private void OnClick()
    {
        // Handle click
    }
}
```

## Animations

### Basic Animations

```xml
<Styles xmlns="https://github.com/avaloniaui">
    <!-- Fade in animation -->
    <Style Selector="Button:pointerover">
        <Style.Animations>
            <Animation Duration="0:0:0.2" FillMode="Forward">
                <KeyFrame Cue="0%">
                    <Setter Property="Opacity" Value="1" />
                </KeyFrame>
                <KeyFrame Cue="100%">
                    <Setter Property="Opacity" Value="0.8" />
                </KeyFrame>
            </Animation>
        </Style.Animations>
    </Style>

    <!-- Color transition -->
    <Style Selector="Button:pressed">
        <Style.Animations>
            <Animation Duration="0:0:0.1" FillMode="Forward">
                <KeyFrame Cue="0%">
                    <Setter Property="Background" Value="Blue" />
                </KeyFrame>
                <KeyFrame Cue="100%">
                    <Setter Property="Background" Value="DarkBlue" />
                </KeyFrame>
            </Animation>
        </Style.Animations>
    </Style>
</Styles>
```

### Transitions

```xml
<!-- Smooth property transitions -->
<Button>
    <Button.Transitions>
        <Transitions>
            <!-- Transition for Opacity changes -->
            <DoubleTransition Property="Opacity" Duration="0:0:0.3" Easing="CubicEaseInOut" />
            
            <!-- Transition for Transform changes -->
            <TransformOperationsTransition Property="RenderTransform" Duration="0:0:0.3" />
        </Transitions>
    </Button.Transitions>
</Button>
```

### Complex Multi-Step Animations

```xml
<!-- Pulse animation (infinite) -->
<Style Selector="Border.Pulse">
    <Style.Animations>
        <Animation Duration="0:0:1" IterationCount="Infinite">
            <KeyFrame Cue="0%">
                <Setter Property="Opacity" Value="1" />
                <Setter Property="ScaleTransform.ScaleX" Value="1" />
                <Setter Property="ScaleTransform.ScaleY" Value="1" />
            </KeyFrame>
            <KeyFrame Cue="50%">
                <Setter Property="Opacity" Value="0.6" />
                <Setter Property="ScaleTransform.ScaleX" Value="1.1" />
                <Setter Property="ScaleTransform.ScaleY" Value="1.1" />
            </KeyFrame>
            <KeyFrame Cue="100%">
                <Setter Property="Opacity" Value="1" />
                <Setter Property="ScaleTransform.ScaleX" Value="1" />
                <Setter Property="ScaleTransform.ScaleY" Value="1" />
            </KeyFrame>
        </Animation>
    </Style.Animations>
</Style>

<!-- Slide-in animation -->
<Style Selector="Border.SlideIn">
    <Style.Animations>
        <Animation Duration="0:0:0.5" FillMode="Forward">
            <KeyFrame Cue="0%">
                <Setter Property="TranslateTransform.X" Value="-300" />
                <Setter Property="Opacity" Value="0" />
            </KeyFrame>
            <KeyFrame Cue="100%">
                <Setter Property="TranslateTransform.X" Value="0" />
                <Setter Property="Opacity" Value="1" />
            </KeyFrame>
        </Animation>
    </Style.Animations>
</Style>

<!-- Bounce animation -->
<Style Selector="Border.Bounce">
    <Style.Animations>
        <Animation Duration="0:0:0.5" Easing="BounceEaseOut">
            <KeyFrame Cue="0%">
                <Setter Property="TranslateTransform.Y" Value="-50" />
            </KeyFrame>
            <KeyFrame Cue="100%">
                <Setter Property="TranslateTransform.Y" Value="0" />
            </KeyFrame>
        </Animation>
    </Style.Animations>
</Style>
```

### Easing Functions

Available easing functions:

- `LinearEasing`
- `QuadraticEaseIn`, `QuadraticEaseOut`, `QuadraticEaseInOut`
- `CubicEaseIn`, `CubicEaseOut`, `CubicEaseInOut`
- `QuarticEaseIn`, `QuarticEaseOut`, `QuarticEaseInOut`
- `QuinticEaseIn`, `QuinticEaseOut`, `QuinticEaseInOut`
- `SineEaseIn`, `SineEaseOut`, `SineEaseInOut`
- `CircularEaseIn`, `CircularEaseOut`, `CircularEaseInOut`
- `BounceEaseIn`, `BounceEaseOut`, `BounceEaseInOut`
- `ElasticEaseIn`, `ElasticEaseOut`, `ElasticEaseInOut`
- `BackEaseIn`, `BackEaseOut`, `BackEaseInOut`

```xml
<!-- Using different easing functions -->
<Style Selector="Border.Ease">
    <Style.Animations>
        <Animation Duration="0:0:1" Easing="CubicEaseInOut">
            <KeyFrame Cue="100%">
                <Setter Property="TranslateTransform.X" Value="100" />
            </KeyFrame>
        </Animation>
    </Style.Animations>
</Style>
```

### Programmatic Animations

```csharp
using Avalonia.Animation;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    public async void AnimateButton()
    {
        var button = this.FindControl<Button>("MyButton");
        var animation = new Animation
        {
            Duration = TimeSpan.FromSeconds(0.5),
            Easing = new CubicEaseInOut(),
            Children =
            {
                new KeyFrame
                {
                    Cue = new Cue(0.0),
                    Setters =
                    {
                        new Setter(OpacityProperty, 0.0)
                    }
                },
                new KeyFrame
                {
                    Cue = new Cue(1.0),
                    Setters =
                    {
                        new Setter(OpacityProperty, 1.0)
                    }
                }
            }
        };

        await animation.RunAsync(button);
    }
}
```

## Observable Patterns

### Filtering and Transformation

```csharp
// Filter values based on condition
this.WhenAnyValue(x => x.Items)
    .Select(items => items?.Where(i => i.IsActive))
    .Subscribe(filtered => ProcessItems(filtered));

// Transform values
this.WhenAnyValue(x => x.Price)
    .Select(price => price * 1.1m) // Apply 10% markup
    .Subscribe(adjusted => AdjustedPrice = adjusted);

// Skip initial value
this.WhenAnyValue(x => x.SearchText)
    .Skip(1)
    .Subscribe(text => PerformSearch(text));

// Take first N values
this.WhenAnyValue(x => x.Input)
    .Take(5)
    .Subscribe(value => ProcessLimit(value));
```

### Combining Observables

```csharp
// Combine multiple observables
Observable.CombineLatest(
    this.WhenAnyValue(x => x.Username),
    this.WhenAnyValue(x => x.Password),
    (username, password) => !string.IsNullOrEmpty(username) && !string.IsNullOrEmpty(password))
    .Subscribe(canLogin => CanLogin = canLogin);

// Merge multiple observables
Observable.Merge(
    this.WhenAnyValue(x => x.PropertyA).Select(_ => "A changed"),
    this.WhenAnyValue(x => x.PropertyB).Select(_ => "B changed"))
    .Subscribe(message => OnPropertyChanged(message));

// Switch observables
this.WhenAnyValue(x => x.SelectedTab)
    .Switch()
    .Subscribe(tabContent => LoadContent(tabContent));
```

### Buffering and Grouping

```csharp
// Buffer values
this.WhenAnyValue(x => x.InputValue)
    .Buffer(TimeSpan.FromSeconds(1))
    .Subscribe(batch => ProcessBatch(batch));

// Group values
_clickCommand.Executed
    .GroupByUntil(
        _ => Guid.NewGuid(),
        _ => Observable.Timer(TimeSpan.FromMilliseconds(300)))
    .Subscribe(group => HandleClickGroup(group));
```

## Performance Optimization

### Reactive Performance

```csharp
// Debounce for performance
this.WhenAnyValue(x => x.SearchText)
    .Debounce(TimeSpan.FromMilliseconds(500))
    .DistinctUntilChanged()
    .Subscribe(text => PerformSearch(text));

// Throttle rapid updates
this.WhenAnyValue(x => x.MousePosition)
    .Throttle(TimeSpan.FromMilliseconds(16)) // ~60fps
    .Subscribe(pos => UpdateUI(pos));

// Sample values at intervals
this.WhenAnyValue(x => x.SensorValue)
    .Sample(TimeSpan.FromMilliseconds(100))
    .Subscribe(value => RecordSensorData(value));
```

### Memory Management

```csharp
public class DisposableViewModel : ReactiveObject, IDisposable
{
    private readonly CompositeDisposable _disposables;

    public DisposableViewModel()
    {
        _disposables = new CompositeDisposable();

        // Register subscriptions for cleanup
        this.WhenAnyValue(x => x.PropertyA)
            .Subscribe(value => OnPropertyAChanged(value))
            .DisposeWith(_disposables);

        this.WhenAnyValue(x => x.PropertyB)
            .Subscribe(value => OnPropertyBChanged(value))
            .DisposeWith(_disposables);
    }

    public void Dispose()
    {
        _disposables?.Dispose();
    }
}
```

## Common Reactive Patterns

### Search with Debounce

```csharp
public class SearchViewModel : ReactiveObject
{
    private string _searchText;
    public string SearchText
    {
        get => _searchText;
        set => this.RaiseAndSetIfChanged(ref _searchText, value);
    }

    private ObservableCollection<Result> _results;
    public ObservableCollection<Result> Results
    {
        get => _results;
        set => this.RaiseAndSetIfChanged(ref _results, value);
    }

    public SearchViewModel(ISearchService searchService)
    {
        this.WhenAnyValue(x => x.SearchText)
            .Where(text => !string.IsNullOrWhiteSpace(text))
            .Debounce(TimeSpan.FromMilliseconds(500))
            .DistinctUntilChanged()
            .ObserveOn(RxApp.MainThreadScheduler)
            .Subscribe(async text => await PerformSearch(text));
    }

    private async Task PerformSearch(string text)
    {
        var results = await _searchService.SearchAsync(text);
        Results = new ObservableCollection<Result>(results);
    }
}
```

### Form Validation

```csharp
public class FormViewModel : ReactiveObject
{
    private string _email;
    public string Email
    {
        get => _email;
        set => this.RaiseAndSetIfChanged(ref _email, value);
    }

    private string _emailError;
    public string EmailError
    {
        get => _emailError;
        set => this.RaiseAndSetIfChanged(ref _emailError, value);
    }

    public ReactiveCommand<Unit, Unit> SubmitCommand { get; }

    public FormViewModel()
    {
        // Validate email in real-time
        this.WhenAnyValue(x => x.Email)
            .Select(ValidateEmail)
            .Subscribe(error => EmailError = error);

        // Enable submit only if form is valid
        var canSubmit = this.WhenAnyValue(
            x => x.Email,
            x => x.EmailError,
            (email, error) => !string.IsNullOrEmpty(email) && string.IsNullOrEmpty(error));

        SubmitCommand = ReactiveCommand.Create(Submit, canSubmit);
    }

    private string ValidateEmail(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return "Email is required";
        if (!Regex.IsMatch(email, @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
            return "Invalid email format";
        return null;
    }

    private void Submit()
    {
        // Submit form
    }
}
```

### Auto-Complete

```csharp
public class AutoCompleteViewModel : ReactiveObject
{
    private string _input;
    public string Input
    {
        get => _input;
        set => this.RaiseAndSetIfChanged(ref _input, value);
    }

    private ObservableCollection<string> _suggestions;
    public ObservableCollection<string> Suggestions
    {
        get => _suggestions;
        set => this.RaiseAndSetIfChanged(ref _suggestions, value);
    }

    public AutoCompleteViewModel(IAutoCompleteService service)
    {
        this.WhenAnyValue(x => x.Input)
            .Where(text => text?.Length >= 2)
            .Debounce(TimeSpan.FromMilliseconds(300))
            .DistinctUntilChanged()
            .ObserveOn(RxApp.MainThreadScheduler)
            .Subscribe(async text => await GetSuggestions(text));
    }

    private async Task GetSuggestions(string text)
    {
        var suggestions = await _service.GetSuggestionsAsync(text);
        Suggestions = new ObservableCollection<string>(suggestions);
    }
}
```

## Best Practices

1. **Use Reactive UI consistently** - Embrace observable patterns throughout
2. **Throttle/Debounce wisely** - Prevent performance issues from rapid updates
3. **Manage subscriptions** - Use CompositeDisposable to clean up
4. **Handle errors** - Subscribe to ThrownExceptions on commands
5. **Main thread scheduling** - Use RxApp.MainThreadScheduler for UI updates
6. **Test observables** - Use TestScheduler for deterministic testing
7. **Avoid nested subscriptions** - Use SelectMany or CombineLatest instead
8. **Document complex chains** - Add comments explaining observable flow
9. **Monitor performance** - Profile reactive chains in production
10. **Keep it simple** - Don't over-engineer with complex reactive patterns
