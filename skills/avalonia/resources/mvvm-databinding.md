# MVVM Architecture and Data Binding

Core patterns for implementing Model-View-ViewModel architecture and establishing data bindings in Avalonia applications.

## MVVM Architecture

### Overview

Model-View-ViewModel (MVVM) separates concerns into three layers:

- **Model**: Business logic and data
- **View**: UI presentation (XAML)
- **ViewModel**: Bridge between View and Model, handles state and commands

### Project Structure

```
MyAvaloniaApp/
├── Models/                     # Business logic and data
│   ├── User.cs
│   ├── Product.cs
│   └── IDataService.cs        # Service interfaces
├── ViewModels/                # MVVM logic
│   ├── MainViewModel.cs
│   ├── UserListViewModel.cs
│   └── ViewModelBase.cs       # Common base class
├── Views/                     # XAML views
│   ├── MainWindow.axaml
│   ├── UserListView.axaml
│   └── ...
└── Services/                  # Application services
    ├── DataService.cs
    ├── NavigationService.cs
    └── ...
```

### ViewModel Base Class

Use ReactiveUI's `ReactiveObject` or implement `INotifyPropertyChanged`:

```csharp
using ReactiveUI;
using System.Reactive;
using System.Collections.ObjectModel;

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

    private ObservableCollection<User> _users;
    public ObservableCollection<User> Users
    {
        get => _users;
        set => this.RaiseAndSetIfChanged(ref _users, value);
    }

    public ReactiveCommand<Unit, Unit> SaveCommand { get; }
    public ReactiveCommand<Unit, Unit> LoadCommand { get; }

    public MainViewModel()
    {
        SaveCommand = ReactiveCommand.Create(Save);
        LoadCommand = ReactiveCommand.Create(Load);

        Users = new ObservableCollection<User>();
    }

    private void Save()
    {
        // Save logic
    }

    private void Load()
    {
        // Load logic
    }
}
```

### INotifyPropertyChanged Implementation

For projects not using ReactiveUI:

```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

public class MainViewModel : INotifyPropertyChanged
{
    private string _name;
    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }

    private string _email;
    public string Email
    {
        get => _email;
        set => SetProperty(ref _email, value);
    }

    public event PropertyChangedEventHandler PropertyChanged;

    protected void SetProperty<T>(ref T field, T value, [CallerMemberName] string propertyName = "")
    {
        if (!Equals(field, value))
        {
            field = value;
            OnPropertyChanged(propertyName);
        }
    }

    protected void OnPropertyChanged(string propertyName)
    {
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(propertyName));
    }
}
```

## Data Binding Fundamentals

### Binding Modes

```xml
<!-- OneWay: View updates when ViewModel changes (default for TextBlock) -->
<TextBlock Text="{Binding Name}" />

<!-- TwoWay: View and ViewModel sync bidirectionally (default for TextBox) -->
<TextBox Text="{Binding Name, Mode=TwoWay}" />

<!-- OneTime: Bind once at initialization, no updates -->
<TextBlock Text="{Binding Name, Mode=OneTime}" />

<!-- OneWayToSource: ViewModel updates when View changes -->
<Slider Value="{Binding Volume, Mode=OneWayToSource}" />
```

### Binding Paths

```xml
<!-- Simple property binding -->
<TextBlock Text="{Binding Name}" />

<!-- Nested property binding -->
<TextBlock Text="{Binding User.Name}" />

<!-- Collection indexing -->
<TextBlock Text="{Binding Items[0].Name}" />

<!-- Binding to parent DataContext -->
<TextBlock Text="{Binding Path=DataContext.Title, RelativeSource={RelativeSource AncestorType=Window}}" />

<!-- Self binding -->
<Button Content="{Binding Path=(Button.Content), RelativeSource={RelativeSource Self}}" />
```

### Binding to Commands

```xml
<!-- Basic command -->
<Button Content="Save" Command="{Binding SaveCommand}" />

<!-- Command with parameter -->
<Button Content="Delete" 
        Command="{Binding DeleteCommand}"
        CommandParameter="{Binding SelectedItem}" />

<!-- Multi-binding to command -->
<Button Content="Search">
    <Button.Command>
        <MultiBinding>
            <Binding Path="SearchCommand" />
            <Binding Path="SearchText" />
            <Binding Path="SearchCategory" />
        </MultiBinding>
    </Button.Command>
</Button>
```

### Multi-Binding

```xml
<!-- Combine multiple bindings -->
<TextBlock>
    <TextBlock.Text>
        <MultiBinding StringFormat="{}{0} - {1}">
            <Binding Path="FirstName" />
            <Binding Path="LastName" />
        </MultiBinding>
    </TextBlock.Text>
</TextBlock>

<!-- Multi-binding with converter -->
<TextBlock>
    <TextBlock.Text>
        <MultiBinding Converter="{StaticResource FullAddressConverter}">
            <Binding Path="Street" />
            <Binding Path="City" />
            <Binding Path="State" />
            <Binding Path="ZipCode" />
        </MultiBinding>
    </TextBlock.Text>
</TextBlock>
```

### Binding Validation

```xml
<!-- Validate with bound property -->
<TextBox Text="{Binding Email}">
    <DataValidationErrors.Error>
        <Binding Path="Email" />
    </DataValidationErrors.Error>
</TextBox>

<!-- Display validation errors -->
<TextBlock Foreground="Red" 
           Text="{Binding (DataValidationErrors.Error)}" />
```

## Value Converters

### Basic Converter

```csharp
using System.Globalization;
using Avalonia.Data.Converters;

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
        if (value is Avalonia.Controls.Visibility visibility)
            return visibility == Avalonia.Controls.Visibility.Visible;
        return false;
    }
}
```

### Multi-Value Converter

```csharp
public class FullNameConverter : IMultiValueConverter
{
    public object Convert(IList<object> values, Type targetType, object parameter, CultureInfo culture)
    {
        if (values.Count < 2) return "";
        var firstName = values[0]?.ToString() ?? "";
        var lastName = values[1]?.ToString() ?? "";
        return $"{firstName} {lastName}".Trim();
    }
}
```

### Using Converters

```xml
<Window.Resources>
    <converters:BoolToVisibilityConverter x:Key="BoolToVisibility" />
    <converters:FullNameConverter x:Key="FullName" />
</Window.Resources>

<!-- Single value converter -->
<TextBlock Text="{Binding Status, Converter={StaticResource StatusToStringConverter}}" />

<!-- Multi-value converter -->
<TextBlock>
    <TextBlock.Text>
        <MultiBinding Converter="{StaticResource FullName}">
            <Binding Path="FirstName" />
            <Binding Path="LastName" />
        </MultiBinding>
    </TextBlock.Text>
</TextBlock>
```

## Dependency Injection

### Service Registration

```csharp
using Microsoft.Extensions.DependencyInjection;

public override void OnFrameworkInitializationCompleted()
{
    var services = new ServiceCollection();

    // Register application services
    services.AddSingleton<IDataService, DataService>();
    services.AddSingleton<INavigationService, NavigationService>();
    services.AddSingleton<IFileService, FileService>();

    // Register view models
    services.AddTransient<MainViewModel>();
    services.AddTransient<UserListViewModel>();

    // Register views
    services.AddSingleton<MainWindow>();

    var provider = services.BuildServiceProvider();

    if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
    {
        desktop.MainWindow = provider.GetRequiredService<MainWindow>();
    }

    base.OnFrameworkInitializationCompleted();
}
```

### View-ViewModel Binding

```csharp
// App.axaml.cs
public class App : Application
{
    private ServiceProvider _serviceProvider;

    public override void OnFrameworkInitializationCompleted()
    {
        _serviceProvider = new ServiceCollection()
            .AddSingleton<IDataService, DataService>()
            .AddTransient<MainViewModel>()
            .AddSingleton<MainWindow>()
            .BuildServiceProvider();

        if (ApplicationLifetime is IClassicDesktopStyleApplicationLifetime desktop)
        {
            desktop.MainWindow = _serviceProvider.GetRequiredService<MainWindow>();
        }

        base.OnFrameworkInitializationCompleted();
    }
}
```

```csharp
// MainWindow.axaml.cs
public partial class MainWindow : Window
{
    public MainWindow(MainViewModel viewModel)
    {
        InitializeComponent();
        DataContext = viewModel;
    }
}
```

## Collections and Binding

### ObservableCollection Binding

```csharp
public class UserListViewModel : ReactiveObject
{
    private ObservableCollection<User> _users;
    public ObservableCollection<User> Users
    {
        get => _users;
        set => this.RaiseAndSetIfChanged(ref _users, value);
    }

    private User _selectedUser;
    public User SelectedUser
    {
        get => _selectedUser;
        set => this.RaiseAndSetIfChanged(ref _selectedUser, value);
    }

    public UserListViewModel()
    {
        Users = new ObservableCollection<User>();
        LoadUsers();
    }

    private void LoadUsers()
    {
        var users = _dataService.GetAllUsers();
        Users = new ObservableCollection<User>(users);
    }

    public void AddUser(User user)
    {
        Users.Add(user);
    }

    public void RemoveUser(User user)
    {
        Users.Remove(user);
    }
}
```

### ListBox Binding

```xml
<ListBox ItemsSource="{Binding Users}"
         SelectedItem="{Binding SelectedUser, Mode=TwoWay}"
         SelectionMode="Single">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <StackPanel Orientation="Horizontal" Spacing="10">
                <Image Source="{Binding Avatar}" Width="32" Height="32" />
                <StackPanel>
                    <TextBlock Text="{Binding Name}" FontWeight="Bold" />
                    <TextBlock Text="{Binding Email}" FontSize="11" Foreground="Gray" />
                </StackPanel>
            </StackPanel>
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

### DataGrid Binding

```xml
<DataGrid ItemsSource="{Binding Users}"
          SelectedItem="{Binding SelectedUser, Mode=TwoWay}"
          AutoGenerateColumns="False"
          CanUserReorderColumns="True">
    <DataGrid.Columns>
        <DataGridTextColumn Header="Name" Binding="{Binding Name}" />
        <DataGridTextColumn Header="Email" Binding="{Binding Email}" />
        <DataGridCheckBoxColumn Header="Active" Binding="{Binding IsActive}" />
        <DataGridTemplateColumn Header="Actions" Width="100">
            <DataGridTemplateColumn.CellTemplate>
                <DataTemplate>
                    <StackPanel Orientation="Horizontal" Spacing="5">
                        <Button Content="Edit" Command="{Binding EditCommand}" />
                        <Button Content="Delete" Command="{Binding DeleteCommand}" />
                    </StackPanel>
                </DataTemplate>
            </DataGridTemplateColumn.CellTemplate>
        </DataGridTemplateColumn>
    </DataGrid.Columns>
</DataGrid>
```

## Design-Time Data

### Design DataContext

```xml
<Window xmlns:vm="using:MyApp.ViewModels"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Class="MyApp.Views.MainWindow">

    <Design.DataContext>
        <vm:MainViewModel />
    </Design.DataContext>

    <StackPanel Spacing="10">
        <TextBlock Text="{Binding Title}" FontSize="24" FontWeight="Bold" />
        <TextBlock Text="{Binding Description}" TextWrapping="Wrap" />
    </StackPanel>
</Window>
```

### Design Data in ViewModel

```csharp
public class MainViewModel : ReactiveObject
{
    private string _title;
    public string Title
    {
        get => _title;
        set => this.RaiseAndSetIfChanged(ref _title, value);
    }

    public MainViewModel()
    {
        if (Design.IsDesignMode)
        {
            // Populate with design data
            Title = "Sample Title";
            Users = new ObservableCollection<User>
            {
                new User { Name = "John Doe", Email = "john@example.com" },
                new User { Name = "Jane Smith", Email = "jane@example.com" }
            };
        }
        else
        {
            // Load real data
            LoadUsers();
        }
    }
}
```

## Common Patterns

### Master-Detail Pattern

```xml
<Grid ColumnDefinitions="200,*">
    <!-- Master list -->
    <ListBox Grid.Column="0"
             ItemsSource="{Binding Items}"
             SelectedItem="{Binding SelectedItem, Mode=TwoWay}" />

    <!-- Detail view -->
    <ContentControl Grid.Column="1"
                    Content="{Binding SelectedItem}">
        <ContentControl.ContentTemplate>
            <DataTemplate>
                <StackPanel Margin="10">
                    <TextBlock Text="{Binding Name}" FontSize="20" FontWeight="Bold" />
                    <TextBlock Text="{Binding Description}" TextWrapping="Wrap" Margin="0,10,0,0" />
                </StackPanel>
            </DataTemplate>
        </ContentControl.ContentTemplate>
    </ContentControl>
</Grid>
```

### Tab Navigation

```xml
<TabControl SelectedIndex="{Binding SelectedTabIndex, Mode=TwoWay}">
    <TabItem Header="Home">
        <views:HomeView DataContext="{Binding HomeViewModel}" />
    </TabItem>
    <TabItem Header="Settings">
        <views:SettingsView DataContext="{Binding SettingsViewModel}" />
    </TabItem>
    <TabItem Header="About">
        <views:AboutView DataContext="{Binding AboutViewModel}" />
    </TabItem>
</TabControl>
```

### Loading State

```csharp
public class DataViewModel : ReactiveObject
{
    private bool _isLoading;
    public bool IsLoading
    {
        get => _isLoading;
        set => this.RaiseAndSetIfChanged(ref _isLoading, value);
    }

    private ObservableCollection<Item> _items;
    public ObservableCollection<Item> Items
    {
        get => _items;
        set => this.RaiseAndSetIfChanged(ref _items, value);
    }

    public ReactiveCommand<Unit, Unit> LoadCommand { get; }

    public DataViewModel()
    {
        LoadCommand = ReactiveCommand.CreateFromTask(LoadAsync);
    }

    private async Task LoadAsync()
    {
        IsLoading = true;
        try
        {
            var data = await _service.FetchDataAsync();
            Items = new ObservableCollection<Item>(data);
        }
        finally
        {
            IsLoading = false;
        }
    }
}
```

```xml
<Panel>
    <ListBox ItemsSource="{Binding Items}" />

    <!-- Loading overlay -->
    <Border Background="#80000000" IsVisible="{Binding IsLoading}">
        <StackPanel HorizontalAlignment="Center" VerticalAlignment="Center">
            <ProgressBar IsIndeterminate="True" Width="200" />
            <TextBlock Text="Loading..." Foreground="White" Margin="0,10,0,0" />
        </StackPanel>
    </Border>
</Panel>
```

## Best Practices

1. **Separate Concerns**: Keep UI logic separate from business logic
2. **Use Commands**: Bind to commands instead of events when possible
3. **Validate Input**: Implement validation in the ViewModel
4. **Async Operations**: Use async/await with ReactiveCommand.CreateFromTask
5. **Dispose Resources**: Implement IDisposable for resource cleanup
6. **Test ViewModels**: ViewModels are easy to test in isolation
7. **Use Design Data**: Populate design-time DataContext for XAML preview
8. **Weak Event Binding**: Use weak event patterns to prevent memory leaks
9. **Property Changed Notifications**: Always notify when properties change
10. **Keep State Synchronized**: Ensure View and ViewModel stay in sync
