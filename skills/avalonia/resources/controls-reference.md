# Avalonia Controls Reference

Comprehensive reference for all major Avalonia UI controls.

## Layout Controls

### Grid
Flexible grid-based layout with rows and columns.

```xml
<Grid ColumnDefinitions="100,*,Auto" RowDefinitions="Auto,*,50">
    <TextBlock Grid.Row="0" Grid.Column="0" Text="Top-Left" />
    <TextBlock Grid.Row="0" Grid.Column="1" Grid.ColumnSpan="2" Text="Top-Right (spans 2 cols)" />
    <ContentControl Grid.Row="1" Grid.Column="0" Grid.ColumnSpan="3" />
</Grid>
```

**Column/Row Definitions:**
- `*` - Star sizing (proportional)
- `Auto` - Size to content
- `100` - Fixed pixel size
- `2*` - Two parts of available space

### StackPanel
Stacks child elements horizontally or vertically.

```xml
<StackPanel Orientation="Vertical" Spacing="10">
    <Button Content="Button 1" />
    <Button Content="Button 2" />
    <Button Content="Button 3" />
</StackPanel>
```

### DockPanel
Docks child elements to edges.

```xml
<DockPanel LastChildFill="True">
    <Menu DockPanel.Dock="Top" />
    <StatusBar DockPanel.Dock="Bottom" />
    <TreeView DockPanel.Dock="Left" Width="200" />
    <ContentControl /> <!-- Fills remaining space -->
</DockPanel>
```

### WrapPanel
Wraps elements to new lines when space runs out.

```xml
<WrapPanel Orientation="Horizontal" ItemWidth="100">
    <Button Content="1" />
    <Button Content="2" />
    <Button Content="3" />
</WrapPanel>
```

### UniformGrid
Grid with uniform cell sizes.

```xml
<UniformGrid Columns="3" Rows="2">
    <Button Content="1" />
    <Button Content="2" />
    <Button Content="3" />
    <Button Content="4" />
    <Button Content="5" />
    <Button Content="6" />
</UniformGrid>
```

### Canvas
Absolute positioning layout.

```xml
<Canvas>
    <Rectangle Canvas.Left="10" Canvas.Top="10" Width="100" Height="100" Fill="Blue" />
    <Ellipse Canvas.Left="50" Canvas.Top="50" Width="80" Height="80" Fill="Red" />
</Canvas>
```

### Panel
Simple container for custom positioning.

```xml
<Panel>
    <Image Source="/Assets/background.png" Stretch="Fill" />
    <TextBlock Text="Overlay" VerticalAlignment="Center" HorizontalAlignment="Center" />
</Panel>
```

### ScrollViewer
Provides scrolling functionality.

```xml
<ScrollViewer HorizontalScrollBarVisibility="Auto" VerticalScrollBarVisibility="Auto">
    <StackPanel>
        <!-- Large content -->
    </StackPanel>
</ScrollViewer>
```

### Border
Container with border and background.

```xml
<Border BorderBrush="Gray" BorderThickness="1" CornerRadius="5" Padding="10" Background="White">
    <TextBlock Text="Content" />
</Border>
```

### Viewbox
Scales content to fit available space.

```xml
<Viewbox Stretch="Uniform">
    <TextBlock Text="Scalable Text" FontSize="48" />
</Viewbox>
```

## Input Controls

### TextBox
Single or multi-line text input.

```xml
<!-- Single line -->
<TextBox Text="{Binding Name}" Watermark="Enter name" />

<!-- Multi-line -->
<TextBox Text="{Binding Description}"
         AcceptsReturn="True"
         TextWrapping="Wrap"
         Height="100" />

<!-- Password -->
<TextBox Text="{Binding Password}" PasswordChar="*" />

<!-- Read-only -->
<TextBox Text="{Binding Info}" IsReadOnly="True" />
```

### Button
Clickable button control.

```xml
<!-- Standard button -->
<Button Content="Click Me" Command="{Binding ClickCommand}" />

<!-- With icon -->
<Button Command="{Binding SaveCommand}">
    <StackPanel Orientation="Horizontal" Spacing="5">
        <PathIcon Data="{StaticResource SaveIcon}" />
        <TextBlock Text="Save" />
    </StackPanel>
</Button>

<!-- Styled button -->
<Button Content="Primary" Classes="Primary" />
```

### CheckBox
Boolean checkbox input.

```xml
<CheckBox IsChecked="{Binding IsEnabled}" Content="Enable feature" />

<!-- Three-state -->
<CheckBox IsChecked="{Binding SelectAllState}" IsThreeState="True" Content="Select All" />
```

### RadioButton
Mutually exclusive option selection.

```xml
<StackPanel>
    <RadioButton GroupName="Size" IsChecked="{Binding IsSmall}" Content="Small" />
    <RadioButton GroupName="Size" IsChecked="{Binding IsMedium}" Content="Medium" />
    <RadioButton GroupName="Size" IsChecked="{Binding IsLarge}" Content="Large" />
</StackPanel>
```

### ComboBox
Dropdown selection control.

```xml
<!-- Simple items -->
<ComboBox SelectedIndex="0">
    <ComboBoxItem Content="Option 1" />
    <ComboBoxItem Content="Option 2" />
    <ComboBoxItem Content="Option 3" />
</ComboBox>

<!-- Bound items -->
<ComboBox ItemsSource="{Binding Countries}"
          SelectedItem="{Binding SelectedCountry}"
          PlaceholderText="Select country">
    <ComboBox.ItemTemplate>
        <DataTemplate>
            <TextBlock Text="{Binding Name}" />
        </DataTemplate>
    </ComboBox.ItemTemplate>
</ComboBox>
```

### Slider
Numeric value selection via slider.

```xml
<Slider Value="{Binding Volume}"
        Minimum="0"
        Maximum="100"
        TickFrequency="10"
        IsSnapToTickEnabled="True" />
```

### NumericUpDown
Numeric value input with up/down buttons.

```xml
<NumericUpDown Value="{Binding Age}"
               Minimum="0"
               Maximum="120"
               Increment="1"
               FormatString="N0" />
```

### DatePicker
Date selection control.

```xml
<DatePicker SelectedDate="{Binding BirthDate}"
            Watermark="Select date"
            DayFormat="{}{0:dd}"
            MonthFormat="{}{0:MMMM}"
            YearFormat="{}{0:yyyy}" />
```

### TimePicker
Time selection control.

```xml
<TimePicker SelectedTime="{Binding AppointmentTime}"
            MinuteIncrement="15"
            ClockIdentifier="12HourClock" />
```

### CalendarDatePicker
Calendar-based date picker.

```xml
<CalendarDatePicker SelectedDate="{Binding EventDate}"
                    FirstDayOfWeek="Monday"
                    IsTodayHighlighted="True" />
```

### ToggleSwitch
On/off toggle switch.

```xml
<ToggleSwitch IsChecked="{Binding IsEnabled}"
              OnContent="On"
              OffContent="Off" />
```

## Display Controls

### TextBlock
Read-only text display.

```xml
<TextBlock Text="{Binding Title}"
           FontSize="24"
           FontWeight="Bold"
           Foreground="DarkBlue"
           TextWrapping="Wrap"
           TextAlignment="Center" />
```

### Label
Text with target association.

```xml
<StackPanel>
    <Label Content="Name:" Target="{Binding #nameTextBox}" />
    <TextBox x:Name="nameTextBox" />
</StackPanel>
```

### Image
Image display control.

```xml
<!-- From resource -->
<Image Source="/Assets/logo.png" Width="200" Height="100" Stretch="Uniform" />

<!-- From binding -->
<Image Source="{Binding ImageUrl}" />

<!-- With fallback -->
<Image>
    <Image.Source>
        <Bitmap UriSource="{Binding ImageUrl}" />
    </Image.Source>
</Image>
```

### ProgressBar
Progress indicator.

```xml
<!-- Determinate -->
<ProgressBar Value="{Binding Progress}" Minimum="0" Maximum="100" />

<!-- Indeterminate -->
<ProgressBar IsIndeterminate="True" />
```

### Separator
Visual separator line.

```xml
<StackPanel>
    <TextBlock Text="Section 1" />
    <Separator Margin="0,10" />
    <TextBlock Text="Section 2" />
</StackPanel>
```

## Collection Controls

### ListBox
Selectable list of items.

```xml
<ListBox ItemsSource="{Binding Items}"
         SelectedItem="{Binding SelectedItem}"
         SelectionMode="Multiple">
    <ListBox.ItemTemplate>
        <DataTemplate>
            <StackPanel Orientation="Horizontal" Spacing="10">
                <Image Source="{Binding Icon}" Width="24" Height="24" />
                <TextBlock Text="{Binding Name}" VerticalAlignment="Center" />
            </StackPanel>
        </DataTemplate>
    </ListBox.ItemTemplate>
</ListBox>
```

### ComboBox
See Input Controls section above.

### TreeView
Hierarchical tree display.

```xml
<TreeView ItemsSource="{Binding RootNodes}">
    <TreeView.ItemTemplate>
        <TreeDataTemplate ItemsSource="{Binding Children}">
            <StackPanel Orientation="Horizontal" Spacing="5">
                <PathIcon Data="{Binding Icon}" Width="16" Height="16" />
                <TextBlock Text="{Binding Name}" />
            </StackPanel>
        </TreeDataTemplate>
    </TreeView.ItemTemplate>
</TreeView>
```

### DataGrid
Tabular data display and editing.

```xml
<DataGrid ItemsSource="{Binding Users}"
          AutoGenerateColumns="False"
          CanUserReorderColumns="True"
          CanUserResizeColumns="True"
          GridLinesVisibility="All">
    <DataGrid.Columns>
        <DataGridTextColumn Header="Name" Binding="{Binding Name}" Width="*" />
        <DataGridTextColumn Header="Email" Binding="{Binding Email}" Width="*" />
        <DataGridCheckBoxColumn Header="Active" Binding="{Binding IsActive}" Width="Auto" />
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

### ItemsControl
Basic items display without selection.

```xml
<ItemsControl ItemsSource="{Binding Tags}">
    <ItemsControl.ItemsPanel>
        <ItemsPanelTemplate>
            <WrapPanel />
        </ItemsPanelTemplate>
    </ItemsControl.ItemsPanel>
    <ItemsControl.ItemTemplate>
        <DataTemplate>
            <Border Background="LightBlue" CornerRadius="3" Padding="5,2" Margin="2">
                <TextBlock Text="{Binding}" />
            </Border>
        </DataTemplate>
    </ItemsControl.ItemTemplate>
</ItemsControl>
```

### Carousel
Rotatable items display.

```xml
<Carousel ItemsSource="{Binding Images}" SelectedIndex="{Binding CurrentIndex}">
    <Carousel.ItemTemplate>
        <DataTemplate>
            <Image Source="{Binding}" Stretch="Uniform" />
        </DataTemplate>
    </Carousel.ItemTemplate>
</Carousel>
```

## Menu and Navigation

### Menu
Application menu bar.

```xml
<Menu>
    <MenuItem Header="File">
        <MenuItem Header="New" Command="{Binding NewCommand}" InputGesture="Ctrl+N" />
        <MenuItem Header="Open" Command="{Binding OpenCommand}" InputGesture="Ctrl+O" />
        <Separator />
        <MenuItem Header="Exit" Command="{Binding ExitCommand}" />
    </MenuItem>
    <MenuItem Header="Edit">
        <MenuItem Header="Cut" Command="{Binding CutCommand}" InputGesture="Ctrl+X" />
        <MenuItem Header="Copy" Command="{Binding CopyCommand}" InputGesture="Ctrl+C" />
        <MenuItem Header="Paste" Command="{Binding PasteCommand}" InputGesture="Ctrl+V" />
    </MenuItem>
</Menu>
```

### ContextMenu
Right-click context menu.

```xml
<TextBox>
    <TextBox.ContextMenu>
        <ContextMenu>
            <MenuItem Header="Cut" Command="{Binding CutCommand}" />
            <MenuItem Header="Copy" Command="{Binding CopyCommand}" />
            <MenuItem Header="Paste" Command="{Binding PasteCommand}" />
        </ContextMenu>
    </TextBox.ContextMenu>
</TextBox>
```

### TabControl
Tabbed navigation.

```xml
<TabControl>
    <TabItem Header="Home">
        <views:HomeView />
    </TabItem>
    <TabItem Header="Settings">
        <views:SettingsView />
    </TabItem>
    <TabItem Header="About">
        <views:AboutView />
    </TabItem>
</TabControl>
```

### Expander
Expandable/collapsible section.

```xml
<Expander Header="Advanced Options" IsExpanded="False">
    <StackPanel Margin="10">
        <CheckBox Content="Option 1" />
        <CheckBox Content="Option 2" />
        <CheckBox Content="Option 3" />
    </StackPanel>
</Expander>
```

### SplitView
Pane and content layout.

```xml
<SplitView IsPaneOpen="{Binding IsPaneOpen}"
           DisplayMode="CompactInline"
           OpenPaneLength="250">
    <SplitView.Pane>
        <ListBox ItemsSource="{Binding NavigationItems}" />
    </SplitView.Pane>
    <SplitView.Content>
        <ContentControl Content="{Binding CurrentView}" />
    </SplitView.Content>
</SplitView>
```

## Dialogs and Popups

### Window
Top-level window.

```xml
<Window xmlns="https://github.com/avaloniaui"
        Title="My Window"
        Width="800"
        Height="600"
        Icon="/Assets/icon.ico"
        WindowStartupLocation="CenterScreen">
    <!-- Content -->
</Window>
```

### Dialog (Code)
```csharp
// Message dialog
var dialog = new Window
{
    Title = "Confirm",
    Width = 300,
    Height = 150,
    Content = new StackPanel
    {
        Children =
        {
            new TextBlock { Text = "Are you sure?", Margin = new Thickness(10) },
            new StackPanel
            {
                Orientation = Orientation.Horizontal,
                HorizontalAlignment = HorizontalAlignment.Right,
                Margin = new Thickness(10),
                Children =
                {
                    new Button { Content = "Yes", Command = yesCommand },
                    new Button { Content = "No", Command = noCommand, Margin = new Thickness(5, 0, 0, 0) }
                }
            }
        }
    }
};

await dialog.ShowDialog(parentWindow);
```

### ToolTip
Hover tooltip.

```xml
<Button Content="Hover me">
    <ToolTip.Tip>
        <StackPanel>
            <TextBlock Text="Button Tooltip" FontWeight="Bold" />
            <TextBlock Text="Additional information" />
        </StackPanel>
    </ToolTip.Tip>
</Button>
```

### Flyout
Popup attached to control.

```xml
<Button Content="Show Flyout">
    <Button.Flyout>
        <Flyout>
            <StackPanel Spacing="10">
                <TextBlock Text="Flyout Content" />
                <Button Content="Action" />
            </StackPanel>
        </Flyout>
    </Button.Flyout>
</Button>
```

## Drawing and Shapes

### Rectangle
```xml
<Rectangle Width="100" Height="50" Fill="Blue" Stroke="Black" StrokeThickness="2" />
```

### Ellipse
```xml
<Ellipse Width="100" Height="100" Fill="Red" />
```

### Line
```xml
<Line StartPoint="0,0" EndPoint="100,100" Stroke="Black" StrokeThickness="2" />
```

### Polyline
```xml
<Polyline Points="0,0 50,50 100,0 150,50" Stroke="Green" StrokeThickness="2" Fill="LightGreen" />
```

### Polygon
```xml
<Polygon Points="50,0 100,50 75,100 25,100 0,50" Fill="Orange" Stroke="DarkOrange" StrokeThickness="2" />
```

### Path
```xml
<Path Fill="Purple" Stroke="DarkPurple" StrokeThickness="2">
    <Path.Data>
        <PathGeometry>
            <PathFigure StartPoint="10,50">
                <LineSegment Point="50,10" />
                <ArcSegment Point="90,50" Size="40,40" />
                <LineSegment Point="50,90" />
                <ArcSegment Point="10,50" Size="40,40" />
            </PathFigure>
        </PathGeometry>
    </Path.Data>
</Path>
```

## Advanced Controls

### AutoCompleteBox
Text input with auto-completion.

```xml
<AutoCompleteBox ItemsSource="{Binding Suggestions}"
                 Text="{Binding SearchText}"
                 Watermark="Type to search..."
                 FilterMode="Contains" />
```

### Calendar
Calendar control.

```xml
<Calendar SelectedDate="{Binding SelectedDate}"
          DisplayMode="Month"
          FirstDayOfWeek="Monday"
          IsTodayHighlighted="True" />
```

### MaskedTextBox
Text input with format mask.

```xml
<MaskedTextBox Mask="(000) 000-0000" />
```

### ColorPicker
Color selection control.

```xml
<ColorPicker Color="{Binding SelectedColor}" />
```

### PathIcon
Icon from path data.

```xml
<PathIcon Data="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
          Width="24"
          Height="24"
          Foreground="Blue" />
```

This reference covers the most commonly used Avalonia controls. For complete API documentation, refer to the official Avalonia documentation.
