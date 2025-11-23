---
name: avalonia
description: Expert guidance for developing cross-platform desktop applications with Avalonia UI framework. Use when building, debugging, or optimizing Avalonia apps including MVVM architecture, XAML design, data binding, styling, theming, custom controls, and cross-platform deployment for Windows, macOS, Linux, iOS, Android, and WebAssembly.
version: 1.0
---

# Avalonia UI Framework Expertise

Comprehensive guidance for developing cross-platform desktop and mobile applications using Avalonia UI, a WPF-inspired XAML-based framework for .NET.

## Core Concepts

### Avalonia Framework Overview
- **Cross-platform**: Single codebase for Windows, macOS, Linux, iOS, Android, Browser (WASM)
- **XAML-based**: Similar to WPF/UWP but cross-platform
- **MVVM-ready**: Built-in support for data binding and commanding
- **Styling system**: CSS-like styling with Fluent and other themes
- **Modern .NET**: Supports .NET 6+ and .NET Standard 2.0

### Project Structure
```
MyAvaloniaApp/
├── MyAvaloniaApp/              # Main application (shared)
│   ├── App.axaml               # Application entry point
│   ├── App.axaml.cs
│   ├── Views/                  # UI views
│   ├── ViewModels/             # View models
│   ├── Models/                 # Data models
│   ├── Services/               # Business logic
│   ├── Assets/                 # Images, fonts
│   └── Styles/                 # Style resources
├── MyAvaloniaApp.Desktop/      # Desktop project (Windows/macOS/Linux)
├── MyAvaloniaApp.Android/      # Android project (optional)
├── MyAvaloniaApp.iOS/          # iOS project (optional)
└── MyAvaloniaApp.Browser/      # WebAssembly project (optional)
```

## MVVM Architecture

### ViewModel Base Class
Use ReactiveUI's `ReactiveObject` or implement `INotifyPropertyChanged`:

```csharp
using ReactiveUI;
using System.Reactive;

public class MainViewModel : ReactiveObject
{
    private string _name;
    public string Name
    {
        get => _name;
        set => this.RaiseAndSetIfChanged(ref _name, value);
    }

    private ObservableCollection<Item> _items;
    public ObservableCollection<Item> Items
    {
        get => _items;
        set => this.RaiseAndSetIfChanged(ref _items, value);
    }

    public ReactiveCommand<Unit, Unit> SaveCommand { get; }

    public MainViewModel()
    {
        SaveCommand = ReactiveCommand.Create(Save);
    }

    private void Save()
    {
        // Save logic
    }
}
```

### View Setup
```xml
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:vm="using:MyApp.ViewModels"
        x:Class="MyApp.Views.MainWindow"
        x:DataType="vm:MainViewModel"
        Title="My Application">

    <Design.DataContext>
        <vm:MainViewModel />
    </Design.DataContext>

    <!-- Content here -->
</Window>
```

### Dependency Injection
Use Microsoft.Extensions.DependencyInjection:

```csharp
// App.axaml.cs
public override void OnFrameworkInitializationCompleted()
{
    var services = new ServiceCollection();

    // Register services
    services.AddSingleton<IDataService, DataService>();
    services.AddTransient<MainViewModel>();

    var provider = services.BuildServiceProvider();

    if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
    {
        desktop.MainWindow = new MainWindow
        {
            DataContext = provider.GetRequiredService<MainViewModel>()
        };
    }

    base.OnFrameworkInitializationCompleted();
}
```

## XAML Best Practices

### Layouts
Common layout containers:

```xml
<!-- StackPanel - stacks items vertically or horizontally -->
<StackPanel Orientation="Vertical" Spacing="10">
    <TextBlock Text="Item 1" />
    <TextBlock Text="Item 2" />
</StackPanel>

<!-- Grid - flexible grid layout -->
<Grid ColumnDefinitions="Auto,*,Auto" RowDefinitions="Auto,*">
    <TextBlock Grid.Row="0" Grid.Column="0" Text="Label:" />
    <TextBox Grid.Row="0" Grid.Column="1" />
    <Button Grid.Row="0" Grid.Column="2" Content="Go" />
</Grid>

<!-- DockPanel - dock elements to edges -->
<DockPanel LastChildFill="True">
    <Menu DockPanel.Dock="Top" />
    <StatusBar DockPanel.Dock="Bottom" />
    <ContentControl /> <!-- fills remaining space -->
</DockPanel>

<!-- Panel - absolute positioning -->
<Panel>
    <Rectangle Canvas.Left="10" Canvas.Top="10" Width="100" Height="100" />
</Panel>
```

### Data Binding
```xml
<!-- One-way binding -->
<TextBlock Text="{Binding Name}" />

<!-- Two-way binding -->
<TextBox Text="{Binding Name, Mode=TwoWay}" />

<!-- Binding with converter -->
<TextBlock Text="{Binding Status, Converter={StaticResource StatusToStringConverter}}" />

<!-- Binding to command -->
<Button Content="Save" Command="{Binding SaveCommand}" />

<!-- Binding with command parameter -->
<Button Content="Delete"
        Command="{Binding DeleteCommand}"
        CommandParameter="{Binding SelectedItem}" />

<!-- Multi-binding -->
<TextBlock>
    <TextBlock.Text>
        <MultiBinding StringFormat="{}{0} - {1}">
            <Binding Path="FirstName" />
            <Binding Path="LastName" />
        </MultiBinding>
    </TextBlock.Text>
</TextBlock>
```

### Value Converters
```csharp
public class BoolToVisibilityConverter : IValueConverter
{
    public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
    {
        if (value is bool boolValue)
            return boolValue ? Avalonia.Controls.Visibility.Visible : Avalonia.Controls.Visibility.Collapsed;
        return Avalonia.Controls.Visibility.Collapsed;
    }

    public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
    {
        throw new NotImplementedException();
    }
}
```

Register in resources:
```xml
<Window.Resources>
    <converters:BoolToVisibilityConverter x:Key="BoolToVisibility" />
</Window.Resources>
```

## Styling and Theming

### Using Built-in Themes
```xml
<!-- App.axaml -->
<Application xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="MyApp.App">
    <Application.Styles>
        <!-- Fluent Theme (Windows 11 style) -->
        <FluentTheme />

        <!-- Simple Theme (lightweight) -->
        <!-- <SimpleTheme /> -->

        <!-- Custom styles -->
        <StyleInclude Source="/Styles/CustomStyles.axaml" />
    </Application.Styles>
</Application>
```

### Custom Styles
```xml
<!-- Styles/CustomStyles.axaml -->
<Styles xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">

    <!-- Style for all buttons -->
    <Style Selector="Button">
        <Setter Property="Background" Value="#007ACC" />
        <Setter Property="Foreground" Value="White" />
        <Setter Property="Padding" Value="10,5" />
        <Setter Property="CornerRadius" Value="4" />
    </Style>

    <!-- Style with class -->
    <Style Selector="Button.Primary">
        <Setter Property="Background" Value="#0078D4" />
    </Style>

    <!-- Pseudo-class styles -->
    <Style Selector="Button:pointerover">
        <Setter Property="Background" Value="#005A9E" />
    </Style>

    <!-- Style for specific control -->
    <Style Selector="TextBox.SearchBox">
        <Setter Property="Watermark" Value="Search..." />
        <Setter Property="CornerRadius" Value="15" />
    </Style>
</Styles>
```

### Dynamic Theme Switching
```csharp
// In ViewModel or code-behind
public void SetLightTheme()
{
    Application.Current.RequestedThemeVariant = ThemeVariant.Light;
}

public void SetDarkTheme()
{
    Application.Current.RequestedThemeVariant = ThemeVariant.Dark;
}
```

## Common Controls

### Data Display
```xml
<!-- ListBox -->
<ListBox ItemsSource="{Binding Items}" SelectedItem="{Binding SelectedItem}">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <StackPanel Orientation="Horizontal" Spacing="10">
                <Image Source="{Binding Icon}" Width="32" Height="32" />
                <TextBlock Text="{Binding Name}" VerticalAlignment="Center" />
            </StackPanel>
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>

<!-- DataGrid -->
<DataGrid ItemsSource="{Binding Users}" AutoGenerateColumns="False">
    <DataGrid.Columns>
        <DataGridTextColumn Header="Name" Binding="{Binding Name}" />
        <DataGridTextColumn Header="Email" Binding="{Binding Email}" />
        <DataGridCheckBoxColumn Header="Active" Binding="{Binding IsActive}" />
    </DataGrid.Columns>
</DataGrid>

<!-- TreeView -->
<TreeView ItemsSource="{Binding TreeItems}">
    <TreeView.ItemTemplate>
        <TreeDataTemplate ItemsSource="{Binding Children}">
            <TextBlock Text="{Binding Name}" />
        </TreeDataTemplate>
    </TreeView.ItemTemplate>
</TreeView>
```

### Input Controls
```xml
<!-- TextBox with validation -->
<TextBox Text="{Binding Email}" Watermark="Enter email">
    <DataValidationErrors.Error>
        <Binding Path="Email" />
    </DataValidationErrors.Error>
</TextBox>

<!-- ComboBox -->
<ComboBox ItemsSource="{Binding Countries}"
          SelectedItem="{Binding SelectedCountry}"
          PlaceholderText="Select country" />

<!-- DatePicker -->
<DatePicker SelectedDate="{Binding BirthDate}" />

<!-- NumericUpDown -->
<NumericUpDown Value="{Binding Age}" Minimum="0" Maximum="120" />

<!-- Slider -->
<Slider Value="{Binding Volume}" Minimum="0" Maximum="100" />
```

### Dialogs and Windows
```csharp
// Show message box
var messageBox = MessageBoxManager
    .GetMessageBoxStandard("Title", "Message", ButtonEnum.OkCancel);
var result = await messageBox.ShowAsync();

// Open file dialog
var dialog = new OpenFileDialog
{
    Title = "Select File",
    Filters = new List<FileDialogFilter>
    {
        new FileDialogFilter { Name = "Text Files", Extensions = { "txt" } },
        new FileDialogFilter { Name = "All Files", Extensions = { "*" } }
    }
};

var result = await dialog.ShowAsync(parentWindow);
if (result != null && result.Length > 0)
{
    var filePath = result[0];
}

// Show child window
var childWindow = new ChildWindow
{
    DataContext = new ChildViewModel()
};
await childWindow.ShowDialog(parentWindow);
```

## Custom Controls

### Creating a Custom Control
```csharp
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;

public class RatingControl : TemplatedControl
{
    public static readonly StyledProperty<int> RatingProperty =
        AvaloniaProperty.Register<RatingControl, int>(nameof(Rating));

    public int Rating
    {
        get => GetValue(RatingProperty);
        set => SetValue(RatingProperty, value);
    }

    protected override void OnApplyTemplate(TemplateAppliedEventArgs e)
    {
        base.OnApplyTemplate(e);
        // Access template parts here
    }
}
```

### Control Template
```xml
<!-- Themes/Generic.axaml -->
<Style Selector="local|RatingControl">
    <Setter Property="Template">
        <ControlTemplate>
            <ItemsControl ItemsSource="{TemplateBinding Stars}">
                <ItemsControl.ItemsPanel>
                    <ItemsPanelTemplate>
                        <StackPanel Orientation="Horizontal" />
                    </ItemsPanelTemplate>
                </ItemsControl.ItemsPanel>
            </ItemsControl>
        </ControlTemplate>
    </Setter>
</Style>
```

## Reactive Programming

### ReactiveUI Integration
```csharp
using ReactiveUI;
using System.Reactive.Linq;

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

    public SearchViewModel()
    {
        // Reactive search with debounce
        this.WhenAnyValue(x => x.SearchText)
            .Throttle(TimeSpan.FromMilliseconds(300))
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

        var results = await _searchService.SearchAsync(text);
        Results = new ObservableCollection<Result>(results);
    }
}
```

### Reactive Commands
```csharp
public class MainViewModel : ReactiveObject
{
    private bool _canSave;

    public ReactiveCommand<Unit, Unit> SaveCommand { get; }
    public ReactiveCommand<Unit, Task> LoadCommand { get; }

    public MainViewModel()
    {
        // Command with CanExecute observable
        var canSave = this.WhenAnyValue(
            x => x.Name,
            x => x.Email,
            (name, email) => !string.IsNullOrEmpty(name) && !string.IsNullOrEmpty(email));

        SaveCommand = ReactiveCommand.Create(Save, canSave);

        // Async command
        LoadCommand = ReactiveCommand.CreateFromTask(LoadDataAsync);

        // Handle command errors
        LoadCommand.ThrownExceptions.Subscribe(ex =>
        {
            // Handle error
            ErrorMessage = ex.Message;
        });
    }

    private void Save()
    {
        // Save logic
    }

    private async Task LoadDataAsync()
    {
        await Task.Delay(1000);
        // Load data
    }
}
```

## Cross-Platform Considerations

### Platform-Specific Code
```csharp
using Avalonia;
using System.Runtime.InteropServices;

public static class PlatformHelper
{
    public static bool IsWindows => RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
    public static bool IsMacOS => RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
    public static bool IsLinux => RuntimeInformation.IsOSPlatform(OSPlatform.Linux);

    public static void DosPlatformSpecificAction()
    {
        if (IsWindows)
        {
            // Windows-specific code
        }
        else if (IsMacOS)
        {
            // macOS-specific code
        }
        else if (IsLinux)
        {
            // Linux-specific code
        }
    }
}
```

### Platform-Specific Resources
```xml
<Window.Resources>
    <OnPlatform x:Key="FontSize" Default="14">
        <On Options="Windows" Content="12" />
        <On Options="macOS" Content="13" />
        <On Options="Linux" Content="14" />
    </OnPlatform>
</Window.Resources>

<TextBlock FontSize="{StaticResource FontSize}" />
```

### File System Access
```csharp
// Use cross-platform paths
var appData = Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
var configPath = Path.Combine(appData, "MyApp", "config.json");

// Ensure directory exists
Directory.CreateDirectory(Path.GetDirectoryName(configPath));
```

## Performance Optimization

### Virtualization
```xml
<!-- Use virtualization for large lists -->
<ListBox ItemsSource="{Binding LargeCollection}" VirtualizationMode="Simple">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding}" />
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

### Image Loading
```xml
<!-- Load images asynchronously -->
<Image Source="{Binding ImageUrl}" Stretch="Uniform">
    <Image.RenderOptions>
        <RenderOptions BitmapInterpolationMode="HighQuality" />
    </Image.RenderOptions>
</Image>
```

### Compiled Bindings
```xml
<!-- Use compiled bindings for better performance -->
<Window xmlns:vm="using:MyApp.ViewModels"
        x:DataType="vm:MainViewModel">

    <!-- Compiled binding (requires x:DataType) -->
    <TextBlock Text="{Binding Name}" />

    <!-- Reflection-based binding (slower) -->
    <TextBlock Text="{ReflectionBinding Name}" />
</Window>
```

### Render Transforms
```xml
<!-- Use RenderTransform instead of layout changes -->
<Border>
    <Border.RenderTransform>
        <TranslateTransform X="10" Y="10" />
    </Border.RenderTransform>
</Border>
```

## Common Patterns

### Master-Detail View
```xml
<Grid ColumnDefinitions="200,*">
    <!-- Master -->
    <ListBox Grid.Column="0"
             ItemsSource="{Binding Items}"
             SelectedItem="{Binding SelectedItem}" />

    <!-- Detail -->
    <ContentControl Grid.Column="1"
                    Content="{Binding SelectedItem}">
        <ContentControl.ContentTemplate>
            <DataTemplate>
                <StackPanel Margin="10">
                    <TextBlock Text="{Binding Name}" FontSize="20" />
                    <TextBlock Text="{Binding Description}" TextWrapping="Wrap" />
                </StackPanel>
            </DataTemplate>
        </ContentControl.ContentTemplate>
    </ContentControl>
</Grid>
```

### Tab Navigation
```xml
<TabControl>
    <TabItem Header="Home">
        <views:HomeView DataContext="{Binding HomeViewModel}" />
    </TabItem>
    <TabItem Header="Settings">
        <views:SettingsView DataContext="{Binding SettingsViewModel}" />
    </TabItem>
</TabControl>
```

### Loading Indicator
```xml
<Panel>
    <!-- Main content -->
    <ContentControl Content="{Binding MainContent}" />

    <!-- Loading overlay -->
    <Border Background="#80000000"
            IsVisible="{Binding IsLoading}">
        <StackPanel HorizontalAlignment="Center"
                    VerticalAlignment="Center">
            <ProgressBar IsIndeterminate="True" Width="200" />
            <TextBlock Text="Loading..."
                       Foreground="White"
                       Margin="0,10,0,0" />
        </StackPanel>
    </Border>
</Panel>
```

## Testing

### Unit Testing ViewModels
```csharp
using Xunit;
using MyApp.ViewModels;

public class MainViewModelTests
{
    [Fact]
    public void SaveCommand_WhenNameIsEmpty_CannotExecute()
    {
        var vm = new MainViewModel();
        vm.Name = "";

        Assert.False(vm.SaveCommand.CanExecute(null));
    }

    [Fact]
    public void SaveCommand_WhenNameIsValid_CanExecute()
    {
        var vm = new MainViewModel();
        vm.Name = "John";
        vm.Email = "john@example.com";

        Assert.True(vm.SaveCommand.CanExecute(null));
    }
}
```

### UI Testing with Avalonia.Headless
```csharp
using Avalonia.Headless.XUnit;
using Xunit;

public class MainWindowTests
{
    [AvaloniaFact]
    public void Button_Click_UpdatesText()
    {
        var window = new MainWindow();
        var button = window.FindControl<Button>("MyButton");
        var textBlock = window.FindControl<TextBlock>("MyTextBlock");

        button.RaiseEvent(new RoutedEventArgs(Button.ClickEvent));

        Assert.Equal("Clicked", textBlock.Text);
    }
}
```

## Debugging Tips

1. **Use Avalonia DevTools**: Press F12 in debug mode to inspect visual tree
2. **Enable XAML Hot Reload**: Modify XAML and see changes immediately
3. **Check Output Window**: Look for binding errors and warnings
4. **Use Design-Time Data**: Add Design.DataContext for previewing
5. **Breakpoint in Converters**: Debug value conversion issues

## Common Issues and Solutions

### Issue: Binding Not Working
- Verify property implements INotifyPropertyChanged
- Check DataContext is set correctly
- Look for binding errors in output window
- Ensure property names match exactly (case-sensitive)

### Issue: XAML Not Found at Runtime
- Ensure XAML files have Build Action set to "AvaloniaResource"
- Check namespace declarations in XAML
- Verify assembly name matches

### Issue: Styles Not Applied
- Check selector syntax matches control type
- Ensure styles are included in App.axaml
- Verify style resources are loaded before usage

### Issue: Performance Problems
- Use virtualization for large lists
- Enable compiled bindings with x:DataType
- Avoid complex layouts in ItemTemplates
- Profile with performance tools

## Best Practices

1. **Use MVVM consistently** - Separate UI from logic
2. **Leverage ReactiveUI** - For reactive programming patterns
3. **Design for cross-platform** - Test on all target platforms
4. **Use compiled bindings** - Better performance and compile-time checking
5. **Follow naming conventions** - Views in Views/, ViewModels in ViewModels/
6. **Implement proper error handling** - Especially in async operations
7. **Use dependency injection** - For testability and maintainability
8. **Keep XAML readable** - Extract complex templates to resources
9. **Optimize for performance** - Use virtualization, lazy loading
10. **Test thoroughly** - Unit tests for ViewModels, UI tests for critical paths

## Resources

For detailed documentation and additional examples, see the resources directory:
- `resources/controls-reference.md` - Complete controls documentation
- `resources/styling-guide.md` - Advanced styling techniques
- `resources/platform-specific.md` - Platform-specific implementation details
