# Blazor Forms & Validation

## EditForm Component

EditForm provides a complete form handling solution with data binding and validation.

### Basic EditForm

```csharp
@page "/register"

<EditForm Model="@model" OnValidSubmit="@HandleValidSubmit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="form-group">
        <label>Name:</label>
        <InputText @bind-Value="model.Name" class="form-control" />
        <ValidationMessage For="@(() => model.Name)" />
    </div>

    <div class="form-group">
        <label>Email:</label>
        <InputText @bind-Value="model.Email" class="form-control" />
        <ValidationMessage For="@(() => model.Email)" />
    </div>

    <button type="submit" class="btn">Register</button>
</EditForm>

@code {
    private RegistrationModel model = new();

    private async Task HandleValidSubmit()
    {
        // Form is valid, process data
        await Service.RegisterUserAsync(model);
    }
}

public class RegistrationModel
{
    [Required]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [Required]
    [EmailAddress]
    public string Email { get; set; } = "";

    [Required]
    [MinLength(8)]
    public string Password { get; set; } = "";
}
```

### EditForm Events

```csharp
<EditForm Model="@model" 
          OnValidSubmit="@OnValidSubmit"
          OnInvalidSubmit="@OnInvalidSubmit"
          OnSubmit="@OnSubmit">
    <!-- Form content -->
</EditForm>

@code {
    private async Task OnValidSubmit()
    {
        // Fires when form is valid and submitted
    }

    private async Task OnInvalidSubmit()
    {
        // Fires when form is invalid and submitted
    }

    private async Task OnSubmit()
    {
        // Fires for any submit (valid or invalid)
        // Useful for custom validation logic
    }
}
```

### Form State Control

```csharp
@inject EditFormService FormService

<EditForm Model="@model" @ref="form">
    <!-- Form content -->
</EditForm>

<button @onclick="Submit">Submit</button>
<button @onclick="Reset">Reset</button>
<button @onclick="CheckValid">Is Valid?</button>

@code {
    private EditForm? form;
    private UserModel model = new();

    private async Task Submit()
    {
        // Manually trigger validation and submission
        await form!.RequestValidationAsync();
        
        // Check if valid
        if (form!.EditContext.IsModified() && form!.EditContext.Validate())
        {
            // Process form
        }
    }

    private void Reset()
    {
        // Reset all fields to default
        form!.EditContext.ResetEditingItemAsync();
    }

    private void CheckValid()
    {
        bool isValid = form!.EditContext.Validate();
        Console.WriteLine($"Form valid: {isValid}");
    }
}
```

## Input Components

### Text Input

```csharp
<InputText @bind-Value="model.Name" class="form-control" />
<InputTextArea @bind-Value="model.Description" rows="4" />

@code {
    private UserModel model = new();
}
```

### Numeric Input

```csharp
<InputNumber @bind-Value="model.Age" class="form-control" />
<InputNumber @bind-Value="model.Price" @bind-Value:format="N2" />

@code {
    private int age;
    private decimal price;
}
```

**Format specifiers:**
- `N2` - Number with 2 decimal places
- `C` - Currency
- `P` - Percentage
- `D` - Date
- `X` - Hexadecimal

### Date Input

```csharp
<InputDate @bind-Value="model.BirthDate" />
<InputDate @bind-Value="model.StartTime" Type="InputDateType.DateTimeLocal" />

@code {
    private DateTime birthDate;
    private DateTime startTime;
}
```

**Types:**
- `InputDateType.Date` - Date only (default)
- `InputDateType.DateTimeLocal` - Date and time
- `InputDateType.Month` - Month and year
- `InputDateType.Time` - Time only

### Select/Dropdown

```csharp
<InputSelect @bind-Value="model.Category" class="form-control">
    <option value="">Select a category...</option>
    <option value="electronics">Electronics</option>
    <option value="clothing">Clothing</option>
</InputSelect>

<!-- Dynamic options from data -->
<InputSelect @bind-Value="model.CategoryId">
    <option value="">Select...</option>
    @foreach (var cat in categories)
    {
        <option value="@cat.Id">@cat.Name</option>
    }
</InputSelect>

@code {
    private string selectedCategory = "";
    private List<Category> categories = [];
}
```

### Checkbox

```csharp
<InputCheckbox @bind-Value="model.AgreeToTerms" />
Accept terms of service?

@code {
    private bool agreeToTerms = false;
}
```

### Radio Buttons

```csharp
<InputRadioGroup @bind-Value="model.Preference">
    <div>
        <InputRadio Value="@("option1")" />
        <label>Option 1</label>
    </div>
    <div>
        <InputRadio Value="@("option2")" />
        <label>Option 2</label>
    </div>
</InputRadioGroup>

@code {
    private string preference = "option1";
}
```

### File Upload

```csharp
<InputFile OnChange="@HandleFileSelect" />

@code {
    private async Task HandleFileSelect(InputFileChangeEventArgs e)
    {
        var file = e.File;
        
        using var stream = file.OpenReadStream();
        var buffer = new byte[stream.Length];
        await stream.ReadAsync(buffer);
        
        // Process file
    }
}
```

## Validation

### DataAnnotations Validation

```csharp
public class UserModel
{
    [Required(ErrorMessage = "Name is required")]
    [StringLength(100, MinimumLength = 2)]
    public string Name { get; set; } = "";

    [Required]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = "";

    [Range(18, 120, ErrorMessage = "Age must be 18-120")]
    public int Age { get; set; }

    [Url]
    public string? Website { get; set; }

    [Phone]
    public string? PhoneNumber { get; set; }

    [CreditCard]
    public string? CardNumber { get; set; }
}
```

**Common Validators:**
- `[Required]` - Field must have value
- `[StringLength(max)]` - Max length
- `[StringLength(max, MinimumLength = min)]` - Min and max
- `[EmailAddress]` - Valid email format
- `[Range(min, max)]` - Numeric range
- `[Url]` - Valid URL format
- `[Phone]` - Valid phone format
- `[CreditCard]` - Valid credit card format
- `[RegularExpression(pattern)]` - Regex match

### ValidationSummary

Shows all validation errors for the form:

```csharp
<EditForm Model="@model" OnValidSubmit="@HandleSubmit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <InputText @bind-Value="model.Name" />
    <InputText @bind-Value="model.Email" />

    <button type="submit">Submit</button>
</EditForm>
```

Displays as:
```
- Name is required
- Email is required
```

### ValidationMessage

Shows validation error for specific field:

```csharp
<InputText @bind-Value="model.Name" />
<ValidationMessage For="@(() => model.Name)" />

<!-- Custom CSS class -->
<ValidationMessage For="@(() => model.Email)" class="text-danger" />
```

### Custom Validation

Implement `IValidatableObject` for complex validation rules:

```csharp
public class UserModel : IValidatableObject
{
    public string Email { get; set; } = "";
    public string ConfirmEmail { get; set; } = "";
    
    [Range(18, 100)]
    public int Age { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        // Compare email fields
        if (Email != ConfirmEmail)
        {
            yield return new ValidationResult(
                "Email addresses must match",
                new[] { nameof(ConfirmEmail) }
            );
        }

        // Custom age validation
        if (Age > 0 && Age < 18 && HasRestrictedContent)
        {
            yield return new ValidationResult(
                "Users under 18 cannot access this content",
                new[] { nameof(Age) }
            );
        }
    }

    public bool HasRestrictedContent { get; set; }
}
```

### Custom Validators

Create reusable custom validators:

```csharp
public class MinimumAgeAttribute : ValidationAttribute
{
    private readonly int _minimumAge;

    public MinimumAgeAttribute(int minimumAge)
    {
        _minimumAge = minimumAge;
    }

    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        if (value is DateTime birthDate)
        {
            var age = DateTime.Today.Year - birthDate.Year;
            if (birthDate.Date > DateTime.Today.AddYears(-age)) age--;

            if (age < _minimumAge)
            {
                return new ValidationResult($"Minimum age is {_minimumAge}");
            }
        }

        return ValidationResult.Success;
    }
}

// Usage
public class UserModel
{
    [MinimumAge(18)]
    public DateTime BirthDate { get; set; }
}
```

### Async Validation

```csharp
public class UniqueEmailAttribute : ValidationAttribute
{
    protected override ValidationResult? IsValid(object? value, ValidationContext validationContext)
    {
        // Can't use async in ValidationAttribute
        // Use EditContext instead (see below)
        return ValidationResult.Success;
    }
}

// Better approach: Manual validation in component
@code {
    private async Task HandleValidSubmit()
    {
        // Check email availability before submit
        bool isUnique = await Service.IsEmailUniqueAsync(model.Email);
        if (!isUnique)
        {
            form!.EditContext.AddValidationMessages(
                FieldIdentifier.Create(() => model.Email),
                new[] { "Email is already registered" }
            );
            return;
        }

        await SaveUserAsync(model);
    }
}
```

## Form Patterns

### Loading State

```csharp
@if (isSubmitting)
{
    <p>Saving...</p>
}
else
{
    <EditForm Model="@model" OnValidSubmit="@SubmitAsync">
        <DataAnnotationsValidator />
        <ValidationSummary />

        <InputText @bind-Value="model.Name" />
        <button type="submit" disabled="@isSubmitting">
            @(isSubmitting ? "Saving..." : "Submit")
        </button>
    </EditForm>
}

@code {
    private bool isSubmitting;

    private async Task SubmitAsync()
    {
        isSubmitting = true;
        try
        {
            await Service.SaveAsync(model);
        }
        finally
        {
            isSubmitting = false;
        }
    }
}
```

### Error Handling

```csharp
<EditForm Model="@model" OnValidSubmit="@SubmitAsync">
    <DataAnnotationsValidator />
    
    @if (!string.IsNullOrEmpty(errorMessage))
    {
        <div class="alert alert-danger">@errorMessage</div>
    }

    <ValidationSummary />

    <InputText @bind-Value="model.Name" />
    <button type="submit">Submit</button>
</EditForm>

@code {
    private string? errorMessage;

    private async Task SubmitAsync()
    {
        try
        {
            errorMessage = null;
            await Service.SaveAsync(model);
        }
        catch (Exception ex)
        {
            errorMessage = $"Error: {ex.Message}";
        }
    }
}
```

### Multi-Step Form

```csharp
@page "/wizard"

@if (currentStep == 1)
{
    <h2>Step 1: Basic Info</h2>
    <InputText @bind-Value="model.Name" />
    <button @onclick="NextStep">Next</button>
}
else if (currentStep == 2)
{
    <h2>Step 2: Contact Info</h2>
    <InputText @bind-Value="model.Email" />
    <button @onclick="PreviousStep">Back</button>
    <button @onclick="NextStep">Next</button>
}
else if (currentStep == 3)
{
    <h2>Step 3: Confirm</h2>
    <p>Name: @model.Name</p>
    <p>Email: @model.Email</p>
    <button @onclick="PreviousStep">Back</button>
    <button @onclick="SubmitAsync">Submit</button>
}

@code {
    private int currentStep = 1;
    private UserModel model = new();

    private void NextStep() => currentStep++;
    private void PreviousStep() => currentStep--;

    private async Task SubmitAsync()
    {
        await Service.RegisterAsync(model);
    }
}
```

### Real-Time Field Validation

```csharp
<input @bind="email" @bind:event="oninput" @onblur="ValidateEmail" />
@if (!string.IsNullOrEmpty(emailError))
{
    <span class="error">@emailError</span>
}

@code {
    private string email = "";
    private string? emailError;

    private void ValidateEmail()
    {
        if (string.IsNullOrEmpty(email))
        {
            emailError = "Email is required";
        }
        else if (!email.Contains("@"))
        {
            emailError = "Invalid email format";
        }
        else
        {
            emailError = null;
        }
    }
}
```

---

**Related Resources:** See [state-management-events.md](state-management-events.md) for data binding patterns. See [authentication-authorization.md](authentication-authorization.md) for role-based form customization.
