# FreeAgent API Endpoints Reference

Comprehensive reference for FreeAgent API v2 endpoints.

Base URL: `https://api.freeagent.com/v2/`

## Authentication

### Token Endpoint
```
POST /v2/token_endpoint
```

Request access or refresh tokens.

**Parameters:**
- `grant_type` - "authorization_code" or "refresh_token"
- `code` - Authorization code (for authorization_code grant)
- `refresh_token` - Refresh token (for refresh_token grant)
- `client_id` - Your OAuth client ID
- `client_secret` - Your OAuth client secret
- `redirect_uri` - Your registered redirect URI

**Response:**
```json
{
  "access_token": "...",
  "refresh_token": "...",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

## Company

### Get Company Information
```
GET /v2/company
```

Returns information about the FreeAgent company.

**Response Fields:**
- `name` - Company name
- `subdomain` - FreeAgent subdomain
- `type` - Account type (e.g., "UkLimitedCompany")
- `currency` - Currency code (e.g., "GBP")
- `sales_tax_registration_status` - VAT registration status

## Contacts

### List Contacts
```
GET /v2/contacts
```

**Query Parameters:**
- `view` - Filter: "active", "active_projects", "active_suppliers", "hidden"
- `updated_since` - ISO 8601 timestamp

**Response:**
```json
{
  "contacts": [
    {
      "url": "https://api.freeagent.com/v2/contacts/123",
      "organisation_name": "Acme Corp",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acme.com",
      "phone_number": "+44 20 1234 5678",
      "is_active": true,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

### Get Single Contact
```
GET /v2/contacts/:id
```

### Create Contact
```
POST /v2/contacts
```

**Required Fields:**
- `organisation_name` or `first_name` + `last_name`

**Optional Fields:**
- `email`
- `phone_number`
- `address1`, `address2`, `address3`
- `town`, `region`, `postcode`, `country`
- `contact_name_on_invoices`
- `default_payment_terms_in_days`
- `sales_tax_registration_number`

**Example:**
```json
{
  "contact": {
    "organisation_name": "Acme Corp",
    "email": "billing@acme.com",
    "phone_number": "+44 20 1234 5678",
    "address1": "123 Main Street",
    "town": "London",
    "postcode": "SW1A 1AA",
    "country": "United Kingdom",
    "default_payment_terms_in_days": 30
  }
}
```

### Update Contact
```
PUT /v2/contacts/:id
```

Send only the fields you want to update.

### Delete Contact
```
DELETE /v2/contacts/:id
```

## Invoices

### List Invoices
```
GET /v2/invoices
```

**Query Parameters:**
- `view` - "recent_open_or_overdue", "recent", "open_or_overdue", "draft", "scheduled_to_email", "all"
- `contact` - Filter by contact URL
- `project` - Filter by project URL
- `updated_since` - ISO 8601 timestamp
- `page` - Page number
- `per_page` - Items per page

**Response:**
```json
{
  "invoices": [
    {
      "url": "https://api.freeagent.com/v2/invoices/456",
      "contact": "https://api.freeagent.com/v2/contacts/123",
      "project": "https://api.freeagent.com/v2/projects/789",
      "reference": "INV-001",
      "dated_on": "2025-01-15",
      "due_on": "2025-02-14",
      "net_value": 1500.00,
      "sales_tax_value": 300.00,
      "total_value": 1800.00,
      "status": "Sent",
      "currency": "GBP"
    }
  ]
}
```

### Get Single Invoice
```
GET /v2/invoices/:id
```

### Create Invoice
```
POST /v2/invoices
```

**Required Fields:**
- `contact` - Contact URL
- `dated_on` - Invoice date (YYYY-MM-DD)
- `invoice_items` - Array of line items

**Optional Fields:**
- `reference` - Invoice number
- `payment_terms_in_days` - Days until due
- `project` - Project URL
- `currency` - Currency code
- `comments` - Invoice notes
- `po_reference` - Purchase order reference
- `discount_percent` - Discount percentage
- `omit_header` - Hide company header (true/false)

**Example:**
```json
{
  "invoice": {
    "contact": "https://api.freeagent.com/v2/contacts/123",
    "dated_on": "2025-01-15",
    "payment_terms_in_days": 30,
    "project": "https://api.freeagent.com/v2/projects/789",
    "reference": "INV-001",
    "comments": "Thank you for your business!",
    "invoice_items": [
      {
        "item_type": "Hours",
        "description": "Consulting services - January 2025",
        "quantity": 40,
        "price": 150.00,
        "sales_tax_rate": 20.0
      },
      {
        "item_type": "Products",
        "description": "Software license",
        "quantity": 1,
        "price": 500.00,
        "sales_tax_rate": 20.0
      }
    ]
  }
}
```

### Update Invoice
```
PUT /v2/invoices/:id
```

Note: Only draft invoices can be fully modified. Sent invoices have limited fields that can be updated.

### Delete Invoice
```
DELETE /v2/invoices/:id
```

Only draft invoices can be deleted.

### Mark Invoice as Sent
```
PUT /v2/invoices/:id
```

```json
{
  "invoice": {
    "status": "Sent"
  }
}
```

### Mark Invoice as Cancelled
```
PUT /v2/invoices/:id
```

```json
{
  "invoice": {
    "status": "Cancelled"
  }
}
```

## Projects

### List Projects
```
GET /v2/projects
```

**Query Parameters:**
- `view` - "active", "completed", "cancelled", "hidden", "all"
- `contact` - Filter by contact URL
- `updated_since` - ISO 8601 timestamp

**Response:**
```json
{
  "projects": [
    {
      "url": "https://api.freeagent.com/v2/projects/789",
      "contact": "https://api.freeagent.com/v2/contacts/123",
      "name": "Website Redesign",
      "budget": 10000.00,
      "is_ir35": false,
      "status": "Active",
      "budget_units": "Hours",
      "normal_billing_rate": 150.00,
      "hours_per_day": 8.0,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

### Get Single Project
```
GET /v2/projects/:id
```

### Create Project
```
POST /v2/projects
```

**Required Fields:**
- `contact` - Contact URL
- `name` - Project name

**Optional Fields:**
- `budget` - Budget amount
- `budget_units` - "Hours", "Days", or "Monetary"
- `normal_billing_rate` - Hourly/daily rate
- `hours_per_day` - Hours per day (for "Days" budget)
- `is_ir35` - IR35 status (UK tax)
- `status` - "Active", "Completed", "Cancelled"

**Example:**
```json
{
  "project": {
    "contact": "https://api.freeagent.com/v2/contacts/123",
    "name": "Website Redesign",
    "budget": 80,
    "budget_units": "Hours",
    "normal_billing_rate": 150.00,
    "status": "Active"
  }
}
```

### Update Project
```
PUT /v2/projects/:id
```

### Delete Project
```
DELETE /v2/projects/:id
```

## Timeslips

### List Timeslips
```
GET /v2/timeslips
```

**Query Parameters:**
- `user` - Filter by user URL
- `project` - Filter by project URL
- `task` - Filter by task URL
- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)
- `view` - "unsubmitted_unbilled", "submitted", "billed"

**Response:**
```json
{
  "timeslips": [
    {
      "url": "https://api.freeagent.com/v2/timeslips/999",
      "user": "https://api.freeagent.com/v2/users/111",
      "project": "https://api.freeagent.com/v2/projects/789",
      "task": "https://api.freeagent.com/v2/tasks/222",
      "dated_on": "2025-01-15",
      "hours": 4.5,
      "comment": "Client meeting and documentation",
      "created_at": "2025-01-15T17:00:00Z",
      "updated_at": "2025-01-15T17:00:00Z"
    }
  ]
}
```

### Create Timeslip
```
POST /v2/timeslips
```

**Required Fields:**
- `user` - User URL
- `project` - Project URL
- `dated_on` - Date (YYYY-MM-DD)
- `hours` - Hours worked

**Optional Fields:**
- `task` - Task URL
- `comment` - Description

**Example:**
```json
{
  "timeslip": {
    "user": "https://api.freeagent.com/v2/users/111",
    "project": "https://api.freeagent.com/v2/projects/789",
    "dated_on": "2025-01-15",
    "hours": 4.5,
    "comment": "Client meeting and documentation"
  }
}
```

### Update Timeslip
```
PUT /v2/timeslips/:id
```

### Delete Timeslip
```
DELETE /v2/timeslips/:id
```

## Expenses

### List Expenses
```
GET /v2/expenses
```

**Query Parameters:**
- `view` - "recent", "open", "all"
- `user` - Filter by user URL
- `project` - Filter by project URL
- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)

### Create Expense
```
POST /v2/expenses
```

**Required Fields:**
- `user` - User URL
- `dated_on` - Expense date (YYYY-MM-DD)
- `description` - What was purchased
- `gross_value` - Total amount including tax
- `category` - Expense category URL

**Optional Fields:**
- `project` - Project URL (for billable expenses)
- `sales_tax_rate` - Tax rate percentage
- `manual_sales_tax_amount` - Override calculated tax
- `attachment` - Receipt image (base64 encoded)

**Example:**
```json
{
  "expense": {
    "user": "https://api.freeagent.com/v2/users/111",
    "dated_on": "2025-01-15",
    "description": "Office supplies",
    "gross_value": 50.00,
    "sales_tax_rate": 20.0,
    "category": "https://api.freeagent.com/v2/categories/123"
  }
}
```

### Update Expense
```
PUT /v2/expenses/:id
```

### Delete Expense
```
DELETE /v2/expenses/:id
```

## Bank Accounts

### List Bank Accounts
```
GET /v2/bank_accounts
```

**Response:**
```json
{
  "bank_accounts": [
    {
      "url": "https://api.freeagent.com/v2/bank_accounts/555",
      "name": "Business Current Account",
      "bank_name": "HSBC",
      "type": "StandardBankAccount",
      "currency": "GBP",
      "opening_balance": 5000.00,
      "current_balance": 8500.00,
      "is_personal": false
    }
  ]
}
```

### Get Single Bank Account
```
GET /v2/bank_accounts/:id
```

## Bank Transactions

### List Bank Transactions
```
GET /v2/bank_transactions
```

**Query Parameters:**
- `bank_account` - Filter by bank account URL
- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)
- `view` - "unexplained", "all"

### Create Bank Transaction
```
POST /v2/bank_transactions
```

**Required Fields:**
- `bank_account` - Bank account URL
- `dated_on` - Transaction date (YYYY-MM-DD)
- `amount` - Transaction amount (negative for outgoing)
- `description` - Transaction description

## Users

### List Users
```
GET /v2/users
```

Returns all users in the FreeAgent account.

**Response:**
```json
{
  "users": [
    {
      "url": "https://api.freeagent.com/v2/users/111",
      "email": "user@example.com",
      "first_name": "Jane",
      "last_name": "Smith",
      "role": "Owner",
      "permission_level": 8
    }
  ]
}
```

## Categories

### List Categories
```
GET /v2/categories
```

Returns all expense and income categories.

## Tasks

### List Tasks
```
GET /v2/tasks
```

Returns available task types for timeslip tracking.

## Estimates (Quotes)

### List Estimates
```
GET /v2/estimates
```

### Create Estimate
```
POST /v2/estimates
```

Similar structure to invoices.

## Credit Notes

### List Credit Notes
```
GET /v2/credit_notes
```

### Create Credit Note
```
POST /v2/credit_notes
```

## Recurring Invoices

### List Recurring Invoices
```
GET /v2/recurring_invoices
```

### Create Recurring Invoice
```
POST /v2/recurring_invoices
```

Additional fields:
- `recurring_frequency` - "Weekly", "Monthly", "Quarterly", "Yearly"
- `recurring_end_date` - When to stop creating invoices

## Pagination

Most list endpoints support pagination:

```
GET /v2/invoices?page=2&per_page=50
```

Default `per_page` is typically 100.

## Common HTTP Headers

**Request:**
```
Authorization: Bearer YOUR_ACCESS_TOKEN
Accept: application/json
Content-Type: application/json
User-Agent: YourApp/1.0
```

**Response:**
```
X-RateLimit-Limit: 120
X-RateLimit-Remaining: 115
X-RateLimit-Reset: 1737123600
```

## Date and Time Formats

- Dates: ISO 8601 format `YYYY-MM-DD`
- Timestamps: ISO 8601 with timezone `YYYY-MM-DDTHH:MM:SSZ`
- Currency: Decimal numbers (e.g., 1234.56)

## Additional Documentation

For the most up-to-date information, always refer to the official API documentation at https://dev.freeagent.com/docs
