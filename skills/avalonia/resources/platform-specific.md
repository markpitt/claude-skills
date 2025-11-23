# Platform-Specific Implementation Guide

Detailed guide for handling platform-specific features and implementations in Avalonia applications.

## Platform Detection

### Runtime Detection
```csharp
using System.Runtime.InteropServices;

public static class PlatformInfo
{
    public static bool IsWindows => RuntimeInformation.IsOSPlatform(OSPlatform.Windows);
    public static bool IsMacOS => RuntimeInformation.IsOSPlatform(OSPlatform.OSX);
    public static bool IsLinux => RuntimeInformation.IsOSPlatform(OSPlatform.Linux);
    public static bool IsAndroid => OperatingSystem.IsAndroid();
    public static bool IsIOS => OperatingSystem.IsIOS();
    public static bool IsBrowser => OperatingSystem.IsBrowser();

    public static string PlatformName
    {
        get
        {
            if (IsWindows) return "Windows";
            if (IsMacOS) return "macOS";
            if (IsLinux) return "Linux";
            if (IsAndroid) return "Android";
            if (IsIOS) return "iOS";
            if (IsBrowser) return "Browser";
            return "Unknown";
        }
    }

    public static bool IsDesktop => IsWindows || IsMacOS || IsLinux;
    public static bool IsMobile => IsAndroid || IsIOS;
}
```

### Design-Time Detection
```csharp
using Avalonia.Controls;

public static bool IsDesignMode => Design.IsDesignMode;
```

## Project Structure

### Multi-Platform Projects
```
MyAvaloniaApp/
├── MyAvaloniaApp/                    # Shared code
│   ├── App.axaml
│   ├── ViewModels/
│   ├── Views/
│   ├── Models/
│   └── Services/
│       ├── IFileService.cs          # Interface
│       └── ...
├── MyAvaloniaApp.Desktop/            # Desktop (Win/Mac/Linux)
│   ├── Program.cs
│   ├── Services/
│   │   └── DesktopFileService.cs    # Desktop implementation
│   └── MyAvaloniaApp.Desktop.csproj
├── MyAvaloniaApp.Android/            # Android
│   ├── MainActivity.cs
│   ├── Services/
│   │   └── AndroidFileService.cs    # Android implementation
│   └── MyAvaloniaApp.Android.csproj
├── MyAvaloniaApp.iOS/                # iOS
│   ├── AppDelegate.cs
│   ├── Services/
│   │   └── IOSFileService.cs        # iOS implementation
│   └── MyAvaloniaApp.iOS.csproj
└── MyAvaloniaApp.Browser/            # WebAssembly
    ├── Program.cs
    ├── Services/
    │   └── BrowserFileService.cs    # Browser implementation
    └── MyAvaloniaApp.Browser.csproj
```

## Platform-Specific Services

### Service Interface (Shared)
```csharp
// MyAvaloniaApp/Services/IFileService.cs
public interface IFileService
{
    Task<string> ReadFileAsync(string path);
    Task WriteFileAsync(string path, string content);
    Task<string> PickFileAsync();
}
```

### Desktop Implementation
```csharp
// MyAvaloniaApp.Desktop/Services/DesktopFileService.cs
using Avalonia.Controls;

public class DesktopFileService : IFileService
{
    public async Task<string> ReadFileAsync(string path)
    {
        return await File.ReadAllTextAsync(path);
    }

    public async Task WriteFileAsync(string path, string content)
    {
        await File.WriteAllTextAsync(path, content);
    }

    public async Task<string> PickFileAsync()
    {
        var dialog = new OpenFileDialog
        {
            Title = "Select File",
            AllowMultiple = false
        };

        var mainWindow = Application.Current?.ApplicationLifetime
            is IClassicDesktopStyleApplicationLifetime desktop
            ? desktop.MainWindow
            : null;

        var result = await dialog.ShowAsync(mainWindow);
        return result?.FirstOrDefault();
    }
}
```

### Android Implementation
```csharp
// MyAvaloniaApp.Android/Services/AndroidFileService.cs
using Android.Content;

public class AndroidFileService : IFileService
{
    private readonly Context _context;

    public AndroidFileService(Context context)
    {
        _context = context;
    }

    public async Task<string> ReadFileAsync(string path)
    {
        using var stream = _context.Assets.Open(path);
        using var reader = new StreamReader(stream);
        return await reader.ReadToEndAsync();
    }

    public async Task WriteFileAsync(string path, string content)
    {
        var file = new Java.IO.File(_context.FilesDir, path);
        await File.WriteAllTextAsync(file.AbsolutePath, content);
    }

    public async Task<string> PickFileAsync()
    {
        // Use Android file picker
        var intent = new Intent(Intent.ActionGetContent);
        intent.SetType("*/*");
        // Handle result through Activity
        return null; // Simplified
    }
}
```

### iOS Implementation
```csharp
// MyAvaloniaApp.iOS/Services/IOSFileService.cs
using Foundation;
using UIKit;

public class IOSFileService : IFileService
{
    public async Task<string> ReadFileAsync(string path)
    {
        var documentsPath = NSFileManager.DefaultManager.GetUrls(
            NSSearchPathDirectory.DocumentDirectory,
            NSSearchPathDomain.User)[0].Path;
        var filePath = Path.Combine(documentsPath, path);
        return await File.ReadAllTextAsync(filePath);
    }

    public async Task WriteFileAsync(string path, string content)
    {
        var documentsPath = NSFileManager.DefaultManager.GetUrls(
            NSSearchPathDirectory.DocumentDirectory,
            NSSearchPathDomain.User)[0].Path;
        var filePath = Path.Combine(documentsPath, path);
        await File.WriteAllTextAsync(filePath, content);
    }

    public async Task<string> PickFileAsync()
    {
        // Use iOS document picker
        return null; // Simplified
    }
}
```

### Service Registration
```csharp
// Program.cs (Desktop)
public static AppBuilder BuildAvaloniaApp()
{
    var services = new ServiceCollection();
    services.AddSingleton<IFileService, DesktopFileService>();

    return AppBuilder.Configure<App>()
        .UsePlatformDetect()
        .LogToTrace();
}

// MainActivity.cs (Android)
protected override void OnCreate(Bundle savedInstanceState)
{
    base.OnCreate(savedInstanceState);

    var services = new ServiceCollection();
    services.AddSingleton<IFileService>(new AndroidFileService(this));
}
```

## Platform-Specific UI

### Conditional XAML
```xml
<Window xmlns="https://github.com/avaloniaui">
    <!-- Desktop-specific menu -->
    <OnPlatform Default="{x:Null}">
        <On Options="Windows, macOS, Linux">
            <Menu DockPanel.Dock="Top">
                <MenuItem Header="File">
                    <MenuItem Header="Open" Command="{Binding OpenCommand}" />
                    <MenuItem Header="Save" Command="{Binding SaveCommand}" />
                </MenuItem>
            </Menu>
        </On>
    </OnPlatform>

    <!-- Mobile-specific toolbar -->
    <OnPlatform Default="{x:Null}">
        <On Options="Android, iOS">
            <StackPanel Orientation="Horizontal" DockPanel.Dock="Bottom">
                <Button Content="Open" Command="{Binding OpenCommand}" />
                <Button Content="Save" Command="{Binding SaveCommand}" />
            </StackPanel>
        </On>
    </OnPlatform>

    <!-- Shared content -->
    <ContentControl Content="{Binding MainContent}" />
</Window>
```

### Platform-Specific Resources
```xml
<Window.Resources>
    <!-- Platform-specific font sizes -->
    <OnPlatform x:Key="TitleFontSize" Default="18">
        <On Options="Windows" Content="16" />
        <On Options="macOS" Content="17" />
        <On Options="Linux" Content="18" />
        <On Options="Android, iOS" Content="20" />
    </OnPlatform>

    <!-- Platform-specific spacing -->
    <OnPlatform x:Key="StandardMargin" Default="10">
        <On Options="Windows, Linux" Content="10" />
        <On Options="macOS" Content="12" />
        <On Options="Android, iOS" Content="16" />
    </OnPlatform>
</Window.Resources>
```

### Platform-Specific Views
```csharp
// ViewModelLocator.cs
public static class ViewLocator
{
    public static IControl Build(object viewModel)
    {
        var viewModelType = viewModel.GetType();
        var viewTypeName = viewModelType.FullName.Replace("ViewModel", "View");

        // Try platform-specific view first
        var platformViewTypeName = $"{viewTypeName}_{PlatformInfo.PlatformName}";
        var platformViewType = Type.GetType(platformViewTypeName);

        if (platformViewType != null)
        {
            return (IControl)Activator.CreateInstance(platformViewType);
        }

        // Fall back to default view
        var viewType = Type.GetType(viewTypeName);
        if (viewType != null)
        {
            return (IControl)Activator.CreateInstance(viewType);
        }

        return new TextBlock { Text = $"View not found: {viewTypeName}" };
    }
}
```

## Window Management

### Desktop Window Setup
```csharp
// Program.cs (Desktop)
public static void Main(string[] args)
{
    BuildAvaloniaApp()
        .StartWithClassicDesktopLifetime(args);
}

public static AppBuilder BuildAvaloniaApp()
{
    return AppBuilder.Configure<App>()
        .UsePlatformDetect()
        .LogToTrace()
        .With(new Win32PlatformOptions
        {
            UseWindowsUIComposition = true,
            EnableMultitouch = true
        })
        .With(new X11PlatformOptions
        {
            EnableMultiTouch = true,
            UseDBusMenu = true
        })
        .With(new MacOSPlatformOptions
        {
            ShowInDock = true,
            DisableDefaultApplicationMenuItems = false
        });
}
```

### Mobile Activity Setup (Android)
```csharp
// MainActivity.cs
[Activity(
    Label = "MyApp",
    Theme = "@style/MyTheme.NoActionBar",
    Icon = "@drawable/icon",
    MainLauncher = true,
    ConfigurationChanges = ConfigChanges.Orientation | ConfigChanges.ScreenSize)]
public class MainActivity : AvaloniaMainActivity<App>
{
    protected override AppBuilder CustomizeAppBuilder(AppBuilder builder)
    {
        return base.CustomizeAppBuilder(builder)
            .WithInterFont()
            .LogToTrace();
    }
}
```

### iOS AppDelegate
```csharp
// AppDelegate.cs
[Register("AppDelegate")]
public class AppDelegate : AvaloniaAppDelegate<App>
{
    protected override AppBuilder CustomizeAppBuilder(AppBuilder builder)
    {
        return base.CustomizeAppBuilder(builder)
            .WithInterFont()
            .LogToTrace();
    }
}
```

## File System Access

### Cross-Platform Paths
```csharp
public static class PathHelper
{
    public static string GetAppDataPath()
    {
        if (PlatformInfo.IsDesktop)
        {
            return Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData);
        }
        else if (PlatformInfo.IsAndroid)
        {
            return Android.App.Application.Context.FilesDir.AbsolutePath;
        }
        else if (PlatformInfo.IsIOS)
        {
            return NSFileManager.DefaultManager.GetUrls(
                NSSearchPathDirectory.DocumentDirectory,
                NSSearchPathDomain.User)[0].Path;
        }

        return string.Empty;
    }

    public static string GetCachePath()
    {
        if (PlatformInfo.IsDesktop)
        {
            return Path.GetTempPath();
        }
        else if (PlatformInfo.IsAndroid)
        {
            return Android.App.Application.Context.CacheDir.AbsolutePath;
        }
        else if (PlatformInfo.IsIOS)
        {
            return NSFileManager.DefaultManager.GetUrls(
                NSSearchPathDirectory.CachesDirectory,
                NSSearchPathDomain.User)[0].Path;
        }

        return string.Empty;
    }

    public static string CombinePath(params string[] paths)
    {
        return Path.Combine(paths);
    }
}
```

## Native Dialogs

### Desktop File Dialogs
```csharp
public async Task<string> OpenFileDialogAsync()
{
    var dialog = new OpenFileDialog
    {
        Title = "Select File",
        Filters = new List<FileDialogFilter>
        {
            new FileDialogFilter
            {
                Name = "Text Files",
                Extensions = { "txt", "md" }
            },
            new FileDialogFilter
            {
                Name = "All Files",
                Extensions = { "*" }
            }
        }
    };

    var result = await dialog.ShowAsync(mainWindow);
    return result?.FirstOrDefault();
}

public async Task<string> SaveFileDialogAsync()
{
    var dialog = new SaveFileDialog
    {
        Title = "Save File",
        DefaultExtension = "txt",
        Filters = new List<FileDialogFilter>
        {
            new FileDialogFilter
            {
                Name = "Text Files",
                Extensions = { "txt" }
            }
        }
    };

    return await dialog.ShowAsync(mainWindow);
}
```

## Platform-Specific Features

### Windows-Specific
```csharp
#if WINDOWS
using Windows.Storage;
using Windows.ApplicationModel.DataTransfer;

public class WindowsSpecificFeatures
{
    public async Task ShareAsync(string text)
    {
        var dataPackage = new DataPackage();
        dataPackage.SetText(text);
        Clipboard.SetContent(dataPackage);
    }

    public async Task<StorageFile> PickFileAsync()
    {
        var picker = new Windows.Storage.Pickers.FileOpenPicker();
        picker.FileTypeFilter.Add("*");
        return await picker.PickSingleFileAsync();
    }
}
#endif
```

### macOS-Specific
```csharp
#if MACOS
using AppKit;
using Foundation;

public class MacOSSpecificFeatures
{
    public void SetupDockMenu()
    {
        var dockMenu = new NSMenu();
        dockMenu.AddItem("New Window", null, (sender, e) =>
        {
            // Open new window
        });
        NSApplication.SharedApplication.DockMenu = dockMenu;
    }

    public void SetupTouchBar()
    {
        // Configure Touch Bar
    }
}
#endif
```

### Linux-Specific
```csharp
#if LINUX
public class LinuxSpecificFeatures
{
    public void RegisterDBusService()
    {
        // Register D-Bus service for Linux integration
    }

    public void SetupSystemTray()
    {
        // Setup system tray icon
    }
}
#endif
```

### Android-Specific
```csharp
#if ANDROID
using Android.Content;
using Android.Widget;

public class AndroidSpecificFeatures
{
    private readonly Context _context;

    public AndroidSpecificFeatures(Context context)
    {
        _context = context;
    }

    public void ShowToast(string message)
    {
        Toast.MakeText(_context, message, ToastLength.Short).Show();
    }

    public void ShareText(string text)
    {
        var intent = new Intent(Intent.ActionSend);
        intent.SetType("text/plain");
        intent.PutExtra(Intent.ExtraText, text);
        _context.StartActivity(Intent.CreateChooser(intent, "Share via"));
    }

    public void RequestPermission(string permission)
    {
        // Request runtime permission
    }
}
#endif
```

### iOS-Specific
```csharp
#if IOS
using UIKit;
using Foundation;

public class IOSSpecificFeatures
{
    public void ShareText(string text, UIViewController viewController)
    {
        var items = new NSObject[] { new NSString(text) };
        var activityViewController = new UIActivityViewController(items, null);
        viewController.PresentViewController(activityViewController, true, null);
    }

    public void ShowAlert(string title, string message, UIViewController viewController)
    {
        var alert = UIAlertController.Create(title, message, UIAlertControllerStyle.Alert);
        alert.AddAction(UIAlertAction.Create("OK", UIAlertActionStyle.Default, null));
        viewController.PresentViewController(alert, true, null);
    }
}
#endif
```

## Input Handling

### Touch vs Mouse
```csharp
public class InputHandler
{
    public void HandlePointerPressed(PointerPressedEventArgs e)
    {
        var point = e.GetCurrentPoint(null);

        if (point.Properties.IsLeftButtonPressed)
        {
            // Mouse left click or primary touch
        }
        else if (point.Properties.IsRightButtonPressed)
        {
            // Mouse right click (desktop only)
        }

        // Check if touch
        if (e.Pointer.Type == PointerType.Touch)
        {
            // Handle touch-specific behavior
        }
        else if (e.Pointer.Type == PointerType.Mouse)
        {
            // Handle mouse-specific behavior
        }
    }

    public void HandleGestures(GestureEventArgs e)
    {
        // Handle pinch, swipe, etc. (mobile)
    }
}
```

### Keyboard Shortcuts
```csharp
// Desktop-specific keyboard shortcuts
public void SetupKeyBindings()
{
    if (PlatformInfo.IsDesktop)
    {
        this.KeyBindings.Add(new KeyBinding
        {
            Command = SaveCommand,
            Gesture = new KeyGesture(Key.S, KeyModifiers.Control)
        });

        // macOS uses Command instead of Control
        if (PlatformInfo.IsMacOS)
        {
            this.KeyBindings.Add(new KeyBinding
            {
                Command = SaveCommand,
                Gesture = new KeyGesture(Key.S, KeyModifiers.Meta)
            });
        }
    }
}
```

## Performance Considerations

### Platform-Specific Optimizations
```csharp
public void OptimizeForPlatform()
{
    if (PlatformInfo.IsMobile)
    {
        // Reduce animations on mobile
        EnableAnimations = false;

        // Use simpler layouts
        UseSimplifiedUI = true;

        // Implement lazy loading
        EnableVirtualization = true;
    }
    else
    {
        // Desktop can handle more complexity
        EnableAnimations = true;
        UseSimplifiedUI = false;
    }
}
```

## Testing Platform-Specific Code

```csharp
public class PlatformTests
{
    [Fact]
    public void FileService_ShouldWork_OnAllPlatforms()
    {
        IFileService fileService;

        if (PlatformInfo.IsWindows)
        {
            fileService = new DesktopFileService();
        }
        else if (PlatformInfo.IsAndroid)
        {
            fileService = new AndroidFileService(mockContext);
        }
        else if (PlatformInfo.IsIOS)
        {
            fileService = new IOSFileService();
        }
        else
        {
            return; // Skip on unsupported platforms
        }

        // Test fileService
        Assert.NotNull(fileService);
    }
}
```

## Best Practices

1. **Abstract Platform Differences**: Use interfaces and dependency injection
2. **Test on All Targets**: Regularly test on all supported platforms
3. **Respect Platform Guidelines**: Follow native UX patterns
4. **Handle Permissions**: Request permissions appropriately on mobile
5. **Optimize for Each Platform**: Adapt UI complexity to device capabilities
6. **Use Conditional Compilation**: When absolutely necessary with `#if` directives
7. **Provide Fallbacks**: Gracefully handle missing features
8. **Consider Screen Sizes**: Design responsive layouts that work on all devices

This guide provides the foundation for building truly cross-platform Avalonia applications that feel native on each platform.
