# Avalonia Styling Guide

Advanced styling techniques and best practices for Avalonia applications.

## Style Basics

### Style Syntax
Avalonia uses CSS-like selectors for styling:

```xml
<Styles xmlns="https://github.com/avaloniaui">
    <!-- Type selector -->
    <Style Selector="Button">
        <Setter Property="Background" Value="Blue" />
    </Style>

    <!-- Class selector -->
    <Style Selector="Button.Primary">
        <Setter Property="Background" Value="Green" />
    </Style>

    <!-- Name selector -->
    <Style Selector="Button#SaveButton">
        <Setter Property="Background" Value="Red" />
    </Style>

    <!-- Descendant selector -->
    <Style Selector="StackPanel Button">
        <Setter Property="Margin" Value="5" />
    </Style>

    <!-- Child selector -->
    <Style Selector="StackPanel > Button">
        <Setter Property="Margin" Value="10" />
    </Style>
</Styles>
```

### Pseudo-Classes
```xml
<Styles>
    <!-- Hover state -->
    <Style Selector="Button:pointerover">
        <Setter Property="Background" Value="LightBlue" />
    </Style>

    <!-- Pressed state -->
    <Style Selector="Button:pressed">
        <Setter Property="Background" Value="DarkBlue" />
    </Style>

    <!-- Disabled state -->
    <Style Selector="Button:disabled">
        <Setter Property="Opacity" Value="0.5" />
    </Style>

    <!-- Focused state -->
    <Style Selector="TextBox:focus">
        <Setter Property="BorderBrush" Value="Blue" />
    </Style>

    <!-- Selected state (ListBoxItem) -->
    <Style Selector="ListBoxItem:selected">
        <Setter Property="Background" Value="LightBlue" />
    </Style>

    <!-- Checked state (CheckBox) -->
    <Style Selector="CheckBox:checked /template/ ContentPresenter">
        <Setter Property="Foreground" Value="Green" />
    </Style>
</Styles>
```

### Combining Selectors
```xml
<Styles>
    <!-- AND combination - Button with Primary class -->
    <Style Selector="Button.Primary">
        <Setter Property="Background" Value="Blue" />
    </Style>

    <!-- OR combination - Button OR TextBox -->
    <Style Selector="Button, TextBox">
        <Setter Property="Margin" Value="5" />
    </Style>

    <!-- Multiple classes - Button with both Primary and Large classes -->
    <Style Selector="Button.Primary.Large">
        <Setter Property="FontSize" Value="18" />
        <Setter Property="Padding" Value="15,10" />
    </Style>

    <!-- Chained pseudo-classes -->
    <Style Selector="Button:pointerover:not(:disabled)">
        <Setter Property="Background" Value="LightBlue" />
    </Style>
</Styles>
```

## Resource Dictionaries

### Defining Resources
```xml
<Window.Resources>
    <!-- Colors -->
    <SolidColorBrush x:Key="PrimaryBrush" Color="#007ACC" />
    <SolidColorBrush x:Key="SecondaryBrush" Color="#68217A" />
    <Color x:Key="AccentColor">#FF4500</Color>

    <!-- Dimensions -->
    <x:Double x:Key="StandardFontSize">14</x:Double>
    <Thickness x:Key="StandardMargin">10</Thickness>
    <CornerRadius x:Key="StandardCornerRadius">4</CornerRadius>

    <!-- Styles -->
    <Style x:Key="PrimaryButton" Selector="Button">
        <Setter Property="Background" Value="{StaticResource PrimaryBrush}" />
        <Setter Property="Foreground" Value="White" />
        <Setter Property="Padding" Value="15,8" />
    </Style>
</Window.Resources>

<!-- Using resources -->
<Button Content="Click Me"
        Background="{StaticResource PrimaryBrush}"
        Style="{StaticResource PrimaryButton}" />
```

### Merged Resource Dictionaries
```xml
<!-- App.axaml -->
<Application.Resources>
    <ResourceDictionary>
        <ResourceDictionary.MergedDictionaries>
            <ResourceInclude Source="/Styles/Colors.axaml" />
            <ResourceInclude Source="/Styles/Buttons.axaml" />
            <ResourceInclude Source="/Styles/TextBoxes.axaml" />
        </ResourceDictionary.MergedDictionaries>
    </ResourceDictionary>
</Application.Resources>
```

### Theme Resources
```xml
<!-- Colors.axaml -->
<ResourceDictionary xmlns="https://github.com/avaloniaui">
    <!-- Light theme -->
    <Color x:Key="BackgroundColor">#FFFFFF</Color>
    <Color x:Key="ForegroundColor">#000000</Color>

    <!-- Dark theme override -->
    <ResourceDictionary.ThemeDictionaries>
        <ResourceDictionary x:Key="Dark">
            <Color x:Key="BackgroundColor">#1E1E1E</Color>
            <Color x:Key="ForegroundColor">#FFFFFF</Color>
        </ResourceDictionary>
    </ResourceDictionary.ThemeDictionaries>
</ResourceDictionary>
```

## Control Templates

### Basic Template
```xml
<Style Selector="Button.CustomButton">
    <Setter Property="Template">
        <ControlTemplate>
            <Border Background="{TemplateBinding Background}"
                    BorderBrush="{TemplateBinding BorderBrush}"
                    BorderThickness="{TemplateBinding BorderThickness}"
                    CornerRadius="5"
                    Padding="{TemplateBinding Padding}">
                <ContentPresenter Content="{TemplateBinding Content}"
                                  ContentTemplate="{TemplateBinding ContentTemplate}"
                                  HorizontalAlignment="Center"
                                  VerticalAlignment="Center" />
            </Border>
        </ControlTemplate>
    </Setter>
</Style>
```

### Template Parts
```xml
<Style Selector="ToggleButton.CustomToggle">
    <Setter Property="Template">
        <ControlTemplate>
            <Grid>
                <Border x:Name="PART_Border"
                        Background="Gray"
                        CornerRadius="10"
                        Height="20"
                        Width="40" />
                <Ellipse x:Name="PART_Thumb"
                         Fill="White"
                         Width="16"
                         Height="16"
                         HorizontalAlignment="Left"
                         Margin="2,0,0,0" />
            </Grid>
        </ControlTemplate>
    </Setter>

    <Style Selector="^:checked /template/ Ellipse#PART_Thumb">
        <Setter Property="HorizontalAlignment" Value="Right" />
        <Setter Property="Margin" Value="0,0,2,0" />
    </Style>

    <Style Selector="^:checked /template/ Border#PART_Border">
        <Setter Property="Background" Value="Green" />
    </Style>
</Style>
```

### Data Templates
```xml
<!-- Simple data template -->
<DataTemplate x:Key="PersonTemplate" x:DataType="models:Person">
    <StackPanel Orientation="Horizontal" Spacing="10">
        <Image Source="{Binding Avatar}" Width="32" Height="32" />
        <StackPanel>
            <TextBlock Text="{Binding Name}" FontWeight="Bold" />
            <TextBlock Text="{Binding Email}" FontSize="12" Foreground="Gray" />
        </StackPanel>
    </StackPanel>
</DataTemplate>

<!-- Using data template -->
<ListBox ItemsSource="{Binding People}"
         ItemTemplate="{StaticResource PersonTemplate}" />
```

### Hierarchical Data Templates
```xml
<TreeView ItemsSource="{Binding RootItems}">
    <TreeView.ItemTemplate>
        <TreeDataTemplate ItemsSource="{Binding Children}" x:DataType="models:TreeNode">
            <StackPanel Orientation="Horizontal" Spacing="5">
                <PathIcon Data="{Binding Icon}" Width="16" Height="16" />
                <TextBlock Text="{Binding Name}" />
                <TextBlock Text="{Binding Count}" Foreground="Gray" />
            </StackPanel>
        </TreeDataTemplate>
    </TreeView.ItemTemplate>
</TreeView>
```

## Animations

### Basic Animations
```xml
<Styles>
    <Style Selector="Button:pointerover">
        <Style.Animations>
            <Animation Duration="0:0:0.2" FillMode="Forward">
                <KeyFrame Cue="0%">
                    <Setter Property="Background" Value="Blue" />
                </KeyFrame>
                <KeyFrame Cue="100%">
                    <Setter Property="Background" Value="LightBlue" />
                </KeyFrame>
            </Animation>
        </Style.Animations>
    </Style>
</Styles>
```

### Transitions
```xml
<Button>
    <Button.Transitions>
        <Transitions>
            <DoubleTransition Property="Opacity" Duration="0:0:0.3" />
            <TransformOperationsTransition Property="RenderTransform" Duration="0:0:0.3" />
        </Transitions>
    </Button.Transitions>
</Button>
```

### Complex Animations
```xml
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
```

### Easing Functions
```xml
<Animation Duration="0:0:0.5" Easing="CubicEaseInOut">
    <KeyFrame Cue="100%">
        <Setter Property="TranslateTransform.X" Value="100" />
    </KeyFrame>
</Animation>
```

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

## Theme Variants

### Supporting Light/Dark Themes
```xml
<!-- App.axaml -->
<Application.Styles>
    <FluentTheme />

    <!-- Light theme styles -->
    <Style Selector="Window">
        <Setter Property="Background" Value="White" />
        <Setter Property="Foreground" Value="Black" />
    </Style>

    <!-- Dark theme overrides -->
    <Style Selector="Window[RequestedThemeVariant=Dark]">
        <Setter Property="Background" Value="#1E1E1E" />
        <Setter Property="Foreground" Value="White" />
    </Style>
</Application.Styles>
```

### Theme-Aware Resources
```xml
<ResourceDictionary>
    <!-- Default (Light) -->
    <SolidColorBrush x:Key="BackgroundBrush" Color="White" />
    <SolidColorBrush x:Key="ForegroundBrush" Color="Black" />

    <!-- Dark theme -->
    <ResourceDictionary.ThemeDictionaries>
        <ResourceDictionary x:Key="Dark">
            <SolidColorBrush x:Key="BackgroundBrush" Color="#1E1E1E" />
            <SolidColorBrush x:Key="ForegroundBrush" Color="White" />
        </ResourceDictionary>
    </ResourceDictionary.ThemeDictionaries>
</ResourceDictionary>
```

### Runtime Theme Switching
```csharp
// Switch to dark theme
Application.Current.RequestedThemeVariant = ThemeVariant.Dark;

// Switch to light theme
Application.Current.RequestedThemeVariant = ThemeVariant.Light;

// Use system theme
Application.Current.RequestedThemeVariant = ThemeVariant.Default;
```

## Advanced Styling Patterns

### Button Styles
```xml
<Styles xmlns="https://github.com/avaloniaui">
    <!-- Base button style -->
    <Style Selector="Button">
        <Setter Property="Background" Value="Transparent" />
        <Setter Property="BorderBrush" Value="#CCCCCC" />
        <Setter Property="BorderThickness" Value="1" />
        <Setter Property="Padding" Value="12,6" />
        <Setter Property="CornerRadius" Value="4" />
        <Setter Property="Cursor" Value="Hand" />
    </Style>

    <!-- Primary button -->
    <Style Selector="Button.Primary">
        <Setter Property="Background" Value="#007ACC" />
        <Setter Property="Foreground" Value="White" />
        <Setter Property="BorderBrush" Value="#007ACC" />
    </Style>

    <Style Selector="Button.Primary:pointerover">
        <Setter Property="Background" Value="#005A9E" />
    </Style>

    <Style Selector="Button.Primary:pressed">
        <Setter Property="Background" Value="#004578" />
    </Style>

    <!-- Danger button -->
    <Style Selector="Button.Danger">
        <Setter Property="Background" Value="#DC3545" />
        <Setter Property="Foreground" Value="White" />
        <Setter Property="BorderBrush" Value="#DC3545" />
    </Style>

    <!-- Icon button -->
    <Style Selector="Button.Icon">
        <Setter Property="Background" Value="Transparent" />
        <Setter Property="BorderThickness" Value="0" />
        <Setter Property="Padding" Value="8" />
        <Setter Property="CornerRadius" Value="4" />
    </Style>

    <Style Selector="Button.Icon:pointerover">
        <Setter Property="Background" Value="#F0F0F0" />
    </Style>
</Styles>
```

### Card Style
```xml
<Style Selector="Border.Card">
    <Setter Property="Background" Value="White" />
    <Setter Property="BorderBrush" Value="#E0E0E0" />
    <Setter Property="BorderThickness" Value="1" />
    <Setter Property="CornerRadius" Value="8" />
    <Setter Property="Padding" Value="16" />
    <Setter Property="BoxShadow" Value="0 2 8 0 #10000000" />
</Style>

<Style Selector="Border.Card:pointerover">
    <Setter Property="BoxShadow" Value="0 4 12 0 #20000000" />
</Style>
```

### Input Field Styles
```xml
<Style Selector="TextBox">
    <Setter Property="Background" Value="White" />
    <Setter Property="BorderBrush" Value="#CCCCCC" />
    <Setter Property="BorderThickness" Value="1" />
    <Setter Property="Padding" Value="8,6" />
    <Setter Property="CornerRadius" Value="4" />
</Style>

<Style Selector="TextBox:focus">
    <Setter Property="BorderBrush" Value="#007ACC" />
    <Setter Property="BorderThickness" Value="2" />
</Style>

<Style Selector="TextBox:error">
    <Setter Property="BorderBrush" Value="#DC3545" />
</Style>
```

### List Item Styles
```xml
<Style Selector="ListBoxItem">
    <Setter Property="Padding" Value="12,8" />
    <Setter Property="Margin" Value="2" />
</Style>

<Style Selector="ListBoxItem:pointerover /template/ ContentPresenter">
    <Setter Property="Background" Value="#F5F5F5" />
</Style>

<Style Selector="ListBoxItem:selected /template/ ContentPresenter">
    <Setter Property="Background" Value="#E3F2FD" />
    <Setter Property="Foreground" Value="#1976D2" />
</Style>

<Style Selector="ListBoxItem:selected:focus /template/ ContentPresenter">
    <Setter Property="Background" Value="#2196F3" />
    <Setter Property="Foreground" Value="White" />
</Style>
```

## Custom Theme Example

```xml
<!-- Themes/CustomTheme.axaml -->
<Styles xmlns="https://github.com/avaloniaui">
    <!-- Color palette -->
    <Styles.Resources>
        <Color x:Key="Primary">#6200EE</Color>
        <Color x:Key="PrimaryDark">#3700B3</Color>
        <Color x:Key="Secondary">#03DAC6</Color>
        <Color x:Key="Background">#FFFFFF</Color>
        <Color x:Key="Surface">#FFFFFF</Color>
        <Color x:Key="Error">#B00020</Color>
        <Color x:Key="OnPrimary">#FFFFFF</Color>
        <Color x:Key="OnSecondary">#000000</Color>
        <Color x:Key="OnBackground">#000000</Color>
        <Color x:Key="OnSurface">#000000</Color>
        <Color x:Key="OnError">#FFFFFF</Color>

        <SolidColorBrush x:Key="PrimaryBrush" Color="{StaticResource Primary}" />
        <SolidColorBrush x:Key="SecondaryBrush" Color="{StaticResource Secondary}" />
        <SolidColorBrush x:Key="BackgroundBrush" Color="{StaticResource Background}" />
        <SolidColorBrush x:Key="SurfaceBrush" Color="{StaticResource Surface}" />
        <SolidColorBrush x:Key="ErrorBrush" Color="{StaticResource Error}" />
    </Styles.Resources>

    <!-- Apply to controls -->
    <Style Selector="Window">
        <Setter Property="Background" Value="{StaticResource BackgroundBrush}" />
        <Setter Property="Foreground" Value="{StaticResource OnBackground}" />
    </Style>

    <Style Selector="Button">
        <Setter Property="Background" Value="{StaticResource PrimaryBrush}" />
        <Setter Property="Foreground" Value="{StaticResource OnPrimary}" />
        <Setter Property="CornerRadius" Value="4" />
        <Setter Property="Padding" Value="16,8" />
    </Style>

    <Style Selector="TextBox">
        <Setter Property="Background" Value="{StaticResource SurfaceBrush}" />
        <Setter Property="Foreground" Value="{StaticResource OnSurface}" />
        <Setter Property="BorderBrush" Value="{StaticResource PrimaryBrush}" />
    </Style>
</Styles>
```

## Performance Tips

1. **Use Static Resources**: Prefer `StaticResource` over `DynamicResource` when values won't change
2. **Minimize Template Complexity**: Keep control templates simple to reduce render time
3. **Use Transitions Sparingly**: Too many animations can impact performance
4. **Cache Brushes**: Define brushes as resources instead of inline
5. **Avoid Deep Nesting**: Flatten selector hierarchies when possible

## Best Practices

1. **Organize Styles**: Separate styles into logical files (Colors, Buttons, etc.)
2. **Use Naming Conventions**: Consistent naming for resources and classes
3. **Document Custom Styles**: Comment complex selectors and templates
4. **Test Theme Variants**: Ensure styles work in both light and dark themes
5. **Follow Platform Guidelines**: Match native look and feel when appropriate
6. **Use Class Modifiers**: Prefer classes over direct styling for reusability
7. **Leverage Inheritance**: Use base styles and extend them
8. **Keep It DRY**: Extract common patterns into reusable styles

This guide provides a foundation for advanced styling in Avalonia. Experiment with these patterns and adapt them to your application's design requirements.
