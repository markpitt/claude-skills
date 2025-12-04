# Custom Controls and Advanced Techniques

Building custom controls, advanced layouts, and optimization patterns for complex Avalonia applications.

## Custom Controls

### Creating a Custom Control

```csharp
using Avalonia;
using Avalonia.Controls;
using Avalonia.Controls.Primitives;
using Avalonia.Data;

public class RatingControl : TemplatedControl
{
    // Define attached property for rating value
    public static readonly StyledProperty<int> RatingProperty =
        AvaloniaProperty.Register<RatingControl, int>(
            nameof(Rating),
            defaultValue: 0,
            defaultBindingMode: BindingMode.TwoWay);

    public int Rating
    {
        get => GetValue(RatingProperty);
        set => SetValue(RatingProperty, value);
    }

    // Maximum rating (e.g., 5 stars)
    public static readonly StyledProperty<int> MaximumProperty =
        AvaloniaProperty.Register<RatingControl, int>(
            nameof(Maximum),
            defaultValue: 5);

    public int Maximum
    {
        get => GetValue(MaximumProperty);
        set => SetValue(MaximumProperty, value);
    }

    protected override void OnApplyTemplate(TemplateAppliedEventArgs e)
    {
        base.OnApplyTemplate(e);
        
        // Access template parts
        var grid = e.NameScope.Get<ItemsControl>("PART_ItemsControl");
        if (grid != null)
        {
            // Initialize template parts
        }
    }
}
```

### Control Template

```xml
<!-- Themes/Generic.axaml -->
<Styles xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:local="using:MyApp.Controls">

    <!-- Template for RatingControl -->
    <Style Selector="local|RatingControl">
        <Setter Property="Template">
            <ControlTemplate>
                <StackPanel Orientation="Horizontal" Spacing="2">
                    <ItemsControl x:Name="PART_ItemsControl"
                                  ItemsSource="{TemplateBinding Rating}">
                        <ItemsControl.ItemsPanel>
                            <ItemsPanelTemplate>
                                <StackPanel Orientation="Horizontal" />
                            </ItemsPanelTemplate>
                        </ItemsControl.ItemsPanel>
                        <ItemsControl.ItemTemplate>
                            <DataTemplate>
                                <Button Content="★"
                                        FontSize="24"
                                        Foreground="Gold"
                                        Background="Transparent"
                                        Command="{TemplateBinding SelectCommand}" />
                            </DataTemplate>
                        </ItemsControl.ItemTemplate>
                    </ItemsControl>
                </StackPanel>
            </ControlTemplate>
        </Setter>
    </Style>
</Styles>
```

### User Control (Composite Control)

```csharp
public partial class UserCard : UserControl
{
    public static readonly StyledProperty<string> NameProperty =
        AvaloniaProperty.Register<UserCard, string>(nameof(Name));

    public string Name
    {
        get => GetValue(NameProperty);
        set => SetValue(NameProperty, value);
    }

    public static readonly StyledProperty<string> EmailProperty =
        AvaloniaProperty.Register<UserCard, string>(nameof(Email));

    public string Email
    {
        get => GetValue(EmailProperty);
        set => SetValue(EmailProperty, value);
    }

    public static readonly StyledProperty<IImage> AvatarProperty =
        AvaloniaProperty.Register<UserCard, IImage>(nameof(Avatar));

    public IImage Avatar
    {
        get => GetValue(AvatarProperty);
        set => SetValue(AvatarProperty, value);
    }

    public UserCard()
    {
        InitializeComponent();
    }
}
```

```xml
<!-- UserCard.axaml -->
<UserControl xmlns="https://github.com/avaloniaui"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             x:Class="MyApp.UserCard">

    <Border BorderBrush="LightGray" BorderThickness="1" CornerRadius="8" Padding="12">
        <StackPanel Spacing="8">
            <Image Source="{Binding Avatar, RelativeSource={RelativeSource AncestorType=UserControl}}"
                   Width="64"
                   Height="64"
                   CornerRadius="32" />
            <TextBlock Text="{Binding Name, RelativeSource={RelativeSource AncestorType=UserControl}}"
                       FontSize="16"
                       FontWeight="Bold" />
            <TextBlock Text="{Binding Email, RelativeSource={RelativeSource AncestorType=UserControl}}"
                       FontSize="12"
                       Foreground="Gray" />
        </StackPanel>
    </Border>
</UserControl>
```

## Advanced Layouts

### Adaptive Layout

```csharp
public class AdaptivePanel : Panel
{
    protected override Size MeasureOverride(Size availableSize)
    {
        double totalWidth = 0;
        double maxHeight = 0;

        foreach (var child in Children)
        {
            child.Measure(availableSize);
            totalWidth += child.DesiredSize.Width;
            maxHeight = Math.Max(maxHeight, child.DesiredSize.Height);
        }

        return new Size(Math.Min(totalWidth, availableSize.Width), maxHeight);
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        double xOffset = 0;

        foreach (var child in Children)
        {
            child.Arrange(new Rect(xOffset, 0, child.DesiredSize.Width, finalSize.Height));
            xOffset += child.DesiredSize.Width;
        }

        return finalSize;
    }
}
```

### Virtualized Stack Panel

```csharp
public class VirtualizingStackPanel : VirtualizingPanel
{
    public static readonly StyledProperty<Orientation> OrientationProperty =
        AvaloniaProperty.Register<VirtualizingStackPanel, Orientation>(
            nameof(Orientation),
            Orientation.Vertical);

    public Orientation Orientation
    {
        get => GetValue(OrientationProperty);
        set => SetValue(OrientationProperty, value);
    }

    protected override Size MeasureOverride(Size availableSize)
    {
        // Implement virtualization logic
        return availableSize;
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        // Arrange only visible items
        return finalSize;
    }
}
```

## Performance Optimization

### Compiled Bindings

```xml
<!-- Enable compiled bindings for better performance -->
<Window xmlns="https://github.com/avaloniaui"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:vm="using:MyApp.ViewModels"
        x:Class="MyApp.Views.MainWindow"
        x:DataType="vm:MainViewModel">

    <!-- Compiled binding (fast) -->
    <TextBlock Text="{Binding Name}" />

    <!-- Reflection binding (slower) -->
    <TextBlock Text="{ReflectionBinding Name}" />

    <!-- One-time binding (fastest) -->
    <TextBlock Text="{Binding Name, Mode=OneTime}" />
</Window>
```

### Virtualization

```xml
<!-- Enable virtualization for large lists -->
<ListBox ItemsSource="{Binding LargeCollection}"
         VirtualizationMode="Simple">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding}" Height="30" />
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>

<!-- DataGrid virtualization (built-in) -->
<DataGrid ItemsSource="{Binding LargeDataSet}"
          RowHeight="30"
          VirtualizingPanel.ScrollUnit="Item">
</DataGrid>
```

### Lazy Loading

```csharp
public class LazyLoadViewModel : ReactiveObject
{
    private ObservableCollection<Item> _items;
    public ObservableCollection<Item> Items
    {
        get => _items;
        set => this.RaiseAndSetIfChanged(ref _items, value);
    }

    private int _pageNumber = 0;
    private const int PageSize = 50;

    public LazyLoadViewModel()
    {
        Items = new ObservableCollection<Item>();
        LoadNextPage();
    }

    public void LoadNextPage()
    {
        Task.Run(async () =>
        {
            var newItems = await _dataService.GetItemsAsync(_pageNumber * PageSize, PageSize);
            foreach (var item in newItems)
            {
                Items.Add(item);
            }
            _pageNumber++;
        });
    }
}
```

```xml
<!-- Load more on scroll -->
<ScrollViewer>
    <ListBox ItemsSource="{Binding Items}">
        <ListBox.ItemTemplate>
            <DataTemplate>
                <!-- Item template -->
            </DataTemplate>
        </ListBox.ItemTemplate>
    </ListBox>
</ScrollViewer>
```

### Image Optimization

```xml
<!-- Async image loading -->
<Image Source="{Binding ImageUrl}"
       Stretch="Uniform"
       StretchDirection="DownOnly">
    <Image.RenderOptions>
        <RenderOptions BitmapInterpolationMode="HighQuality" />
    </Image.RenderOptions>
</Image>
```

```csharp
// Load image asynchronously
public async Task<Bitmap> LoadImageAsync(string url)
{
    using (var client = new HttpClient())
    {
        var data = await client.GetByteArrayAsync(url);
        using (var stream = new MemoryStream(data))
        {
            return new Bitmap(stream);
        }
    }
}
```

## Render Transforms

### Transform Types

```xml
<!-- Translate - move element -->
<Border RenderTransform="translate(10 20)">
    <TextBlock Text="Translated" />
</Border>

<!-- Scale - resize element -->
<Border RenderTransform="scale(1.5 0.8)">
    <TextBlock Text="Scaled" />
</Border>

<!-- Rotate - rotate element -->
<Border RenderTransform="rotate(45)">
    <TextBlock Text="Rotated" />
</Border>

<!-- Skew - skew element -->
<Border RenderTransform="skew(10 20)">
    <TextBlock Text="Skewed" />
</Border>

<!-- Combined transforms -->
<Border RenderTransform="translate(10 20) rotate(45) scale(1.2)">
    <TextBlock Text="Combined" />
</Border>
```

### Programmatic Transforms

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }

    public void TransformElement()
    {
        var element = this.FindControl<Border>("MyBorder");

        // Translate
        var translateTransform = new TranslateTransform { X = 10, Y = 20 };
        element.RenderTransform = translateTransform;

        // Scale with origin
        var scaleTransform = new ScaleTransform
        {
            ScaleX = 1.5,
            ScaleY = 1.5,
            CenterX = 50,
            CenterY = 50
        };
        element.RenderTransform = scaleTransform;

        // Rotate with origin
        var rotateTransform = new RotateTransform
        {
            Angle = 45,
            CenterX = 50,
            CenterY = 50
        };
        element.RenderTransform = rotateTransform;
    }
}
```

## Drawing and Graphics

### Shapes

```xml
<!-- Rectangle -->
<Rectangle Width="100" Height="50" Fill="Blue" Stroke="Black" StrokeThickness="2" />

<!-- Ellipse -->
<Ellipse Width="100" Height="100" Fill="Red" />

<!-- Line -->
<Line StartPoint="0,0" EndPoint="100,100" Stroke="Black" StrokeThickness="2" />

<!-- Polyline -->
<Polyline Points="0,0 50,50 100,0 150,50" Stroke="Green" StrokeThickness="2" />

<!-- Polygon -->
<Polygon Points="50,0 100,50 75,100 25,100 0,50" Fill="Orange" />
```

### Paths

```xml
<!-- Path with geometry -->
<Path Fill="Purple" Stroke="DarkPurple" StrokeThickness="2">
    <Path.Data>
        <PathGeometry>
            <PathFigure StartPoint="10,50">
                <LineSegment Point="50,10" />
                <ArcSegment Point="90,50" Size="40,40" />
                <LineSegment Point="50,90" />
            </PathFigure>
        </PathGeometry>
    </Path.Data>
</Path>

<!-- SVG-like path data -->
<Path Data="M 10,50 L 50,10 A 40,40 0 0,1 90,50 L 50,90"
      Fill="Purple"
      Stroke="DarkPurple"
      StrokeThickness="2" />
```

### Drawing Context (Code-Behind)

```csharp
public class DrawingControl : Control
{
    public override void Render(DrawingContext context)
    {
        base.Render(context);

        // Draw rectangle
        var rect = new Rect(10, 10, 100, 50);
        context.DrawRectangle(new SolidColorBrush(Colors.Blue), null, rect);

        // Draw ellipse
        var ellipse = new EllipseGeometry(new Rect(120, 10, 100, 100));
        context.DrawGeometry(new SolidColorBrush(Colors.Red), null, ellipse);

        // Draw line
        var pen = new Pen(new SolidColorBrush(Colors.Black), 2);
        context.DrawLine(pen, new Point(0, 0), new Point(100, 100));

        // Draw text
        var formattedText = new FormattedText(
            "Hello",
            CultureInfo.CurrentCulture,
            FlowDirection.LeftToRight,
            new Typeface("Arial"),
            14,
            new SolidColorBrush(Colors.Black));
        context.DrawText(formattedText, new Point(10, 10));
    }
}
```

## Styling Advanced Patterns

### Complex Selectors

```xml
<Styles xmlns="https://github.com/avaloniaui">
    <!-- Template part selector -->
    <Style Selector="Button:pointerover /template/ Border">
        <Setter Property="Background" Value="LightBlue" />
    </Style>

    <!-- Multiple conditions -->
    <Style Selector="Button.Primary:pointerover:not(:disabled)">
        <Setter Property="Background" Value="DarkBlue" />
    </Style>

    <!-- Sibling selector -->
    <Style Selector="TextBlock + Button">
        <Setter Property="Margin" Value="10,0,0,0" />
    </Style>

    <!-- Child combinator -->
    <Style Selector="StackPanel > Button">
        <Setter Property="Margin" Value="5" />
    </Style>
</Styles>
```

### Conditional Styling

```xml
<!-- Style based on attached property -->
<Style Selector="Border[Tag=Important]">
    <Setter Property="BorderBrush" Value="Red" />
    <Setter Property="BorderThickness" Value="2" />
</Style>

<!-- Platform-specific styles -->
<Style Selector="Button">
    <Setter Property="Padding" Value="10,8" />
    <OnPlatform Default="{x:Null}">
        <On Options="macOS">
            <Setter Property="Padding" Value="12,10" />
        </On>
    </OnPlatform>
</Style>
```

## Testing Custom Controls

```csharp
using Avalonia.Headless.XUnit;
using Xunit;

public class RatingControlTests
{
    [AvaloniaFact]
    public void Rating_CanBeSet()
    {
        var control = new RatingControl { Rating = 3 };
        Assert.Equal(3, control.Rating);
    }

    [AvaloniaFact]
    public void Rating_BindsCorrectly()
    {
        var control = new RatingControl();
        var binding = new Binding("Value")
        {
            Mode = BindingMode.TwoWay,
            Source = new { Value = 4 }
        };
        control.Bind(RatingControl.RatingProperty, binding);
        Assert.Equal(4, control.Rating);
    }

    [AvaloniaFact]
    public void Template_AppliesCorrectly()
    {
        var window = new Window
        {
            Content = new RatingControl { Rating = 5 }
        };
        window.Show();
        
        var control = ((RatingControl)window.Content);
        Assert.Equal(5, control.Rating);
    }
}
```

## Best Practices

1. **Follow MVVM** - Keep custom control logic separate from business logic
2. **Use attached properties** - For control customization
3. **Template-based controls** - Use TemplatedControl for complex controls
4. **Virtualize large collections** - For performance
5. **Minimize render overhead** - Cache renders when possible
6. **Use compiled bindings** - For better performance
7. **Profile performance** - Use tools to identify bottlenecks
8. **Test thoroughly** - Use Avalonia.Headless for UI testing
9. **Document properties** - Clearly document custom properties
10. **Follow platform conventions** - Match native look and feel
