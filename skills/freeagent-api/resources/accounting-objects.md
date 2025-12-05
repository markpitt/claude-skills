# FreeAgent API: Accounting Objects & Financial Data

## Overview

This resource covers the core financial objects in FreeAgent: invoices, estimates, credit notes, expenses, projects, and timeslips. These endpoints allow you to manage the complete accounting cycle.

## Invoices (Sales)

### List Invoices

```
GET /v2/invoices
```

**Query Parameters:**
- `view` - Filter: "recent_open_or_overdue", "recent", "open_or_overdue", "draft", "scheduled_to_email", "all"
- `contact` - Filter by contact URL
- `project` - Filter by project URL
- `updated_since` - ISO 8601 timestamp (e.g., "2025-01-01T00:00:00Z")
- `page` - Page number (for pagination)
- `per_page` - Items per page (default 100)

**Example:**
```bash
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/invoices?view=open_or_overdue&per_page=50"
```

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
      "currency": "GBP",
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
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
- `contact` - Contact URL (e.g., "https://api.freeagent.com/v2/contacts/123")
- `dated_on` - Invoice date in YYYY-MM-DD format
- `invoice_items` - Array of line items (see below)

**Optional Fields:**
- `reference` - Invoice number (defaults to auto-generated)
- `payment_terms_in_days` - Days until due (default 30)
- `project` - Project URL for categorization
- `currency` - Currency code (default uses company currency)
- `comments` - Invoice notes/terms
- `po_reference` - Purchase order number
- `discount_percent` - Discount as percentage
- `omit_header` - Hide company header (true/false)

**Invoice Item Format:**
```json
{
  "item_type": "Hours|Products|Expenses",
  "description": "What was delivered",
  "quantity": 40,
  "price": 150.00,
  "sales_tax_rate": 20.0,
  "tax_amount": 1200.00  // optional, auto-calculated
}
```

**Full Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "invoice": {
         "contact": "https://api.freeagent.com/v2/contacts/123",
         "dated_on": "2025-01-15",
         "payment_terms_in_days": 30,
         "reference": "INV-2025-001",
         "project": "https://api.freeagent.com/v2/projects/789",
         "comments": "Thank you for your business!",
         "invoice_items": [
           {
             "item_type": "Hours",
             "description": "Web development - January 2025",
             "quantity": 40,
             "price": 150.00,
             "sales_tax_rate": 20.0
           },
           {
             "item_type": "Products",
             "description": "Domain registration",
             "quantity": 1,
             "price": 20.00,
             "sales_tax_rate": 20.0
           }
         ]
       }
     }' \
     https://api.freeagent.com/v2/invoices
```

### Update Invoice

```
PUT /v2/invoices/:id
```

**Note:** Only draft invoices can be fully modified. Sent invoices have limited fields that can be updated (primarily status and comments).

**Example - Mark as Sent:**
```json
{
  "invoice": {
    "status": "Sent"
  }
}
```

### Delete Invoice

```
DELETE /v2/invoices/:id
```

Only draft invoices can be deleted.

### Invoice Status Transitions

- **Draft** → **Sent** (manually sent to client)
- **Sent** → **Viewed** (automatically when client views)
- **Viewed**/**Sent** → **Paid** (mark as received payment)
- **Any** → **Cancelled** (if unpaid)

## Estimates (Quotes)

### List Estimates

```
GET /v2/estimates
```

Similar parameters to invoices (view, contact, project, updated_since, pagination).

### Create Estimate

```
POST /v2/estimates
```

Structure identical to invoices, but:
- Status is typically "Draft" or "Sent"
- Can have expiration date
- Can be converted to invoice

**Additional Fields:**
```json
{
  "estimate": {
    "contact": "...",
    "dated_on": "2025-01-15",
    "expires_on": "2025-02-15",  // When quote expires
    "estimate_items": [...]  // Same format as invoice_items
  }
}
```

## Credit Notes

### List Credit Notes

```
GET /v2/credit_notes
```

### Create Credit Note

```
POST /v2/credit_notes
```

Used to reverse or adjust invoices (refunds, corrections).

**Structure:**
```json
{
  "credit_note": {
    "contact": "https://api.freeagent.com/v2/contacts/123",
    "dated_on": "2025-01-20",
    "reference": "CN-2025-001",
    "comments": "Adjustment for over-billing",
    "credit_note_items": [
      {
        "item_type": "Hours",
        "description": "Correction - duplicate charge",
        "quantity": 5,
        "price": 150.00,
        "sales_tax_rate": 20.0
      }
    ]
  }
}
```

## Recurring Invoices

### Create Recurring Invoice

```
POST /v2/recurring_invoices
```

Automatically generates invoices on a schedule.

**Fields:**
```json
{
  "recurring_invoice": {
    "contact": "https://api.freeagent.com/v2/contacts/123",
    "dated_on": "2025-01-15",
    "payment_terms_in_days": 30,
    "recurring_frequency": "Monthly",  // Weekly, Monthly, Quarterly, Yearly
    "recurring_end_date": "2025-12-31",
    "invoice_items": [...]
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
- `contact` - Filter by contact
- `updated_since` - Timestamp filter

**Response:**
```json
{
  "projects": [
    {
      "url": "https://api.freeagent.com/v2/projects/789",
      "contact": "https://api.freeagent.com/v2/contacts/123",
      "name": "Website Redesign",
      "budget": 80,
      "budget_units": "Hours",
      "normal_billing_rate": 150.00,
      "hours_per_day": 8.0,
      "is_ir35": false,
      "status": "Active",
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ]
}
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
- `hours_per_day` - Hours per day (for Days budget)
- `is_ir35` - IR35 status (UK self-employed tax rule)
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

## Timeslips (Time Tracking)

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
- `comment` - Work description

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
- `user` - Filter by user
- `project` - Filter by project
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
- `gross_value` - Total amount (including tax)
- `category` - Expense category URL

**Optional Fields:**
- `project` - Project URL (makes it billable)
- `sales_tax_rate` - Tax rate percentage (e.g., 20.0)
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

## Pagination

Most list endpoints support pagination:

```
GET /v2/invoices?page=2&per_page=50
```

- Default `per_page`: 100
- Maximum `per_page`: Usually 200
- Use `page` parameter to navigate results

**Example - Get all invoices:**
```python
def get_all_invoices(client, params=None):
    all_invoices = []
    page = 1
    
    while True:
        if params is None:
            params = {}
        params['page'] = page
        params['per_page'] = 100
        
        response = client.get('invoices', params=params)
        invoices = response.get('invoices', [])
        
        if not invoices:
            break
        
        all_invoices.extend(invoices)
        page += 1
    
    return all_invoices
```

See also:
- [Contacts & Organizations](contacts-organizations.md) for client/supplier management
- [Code Examples](../resources/examples.md) for practical implementations
- [API Request Template](../templates/api-request-template.sh) for curl examples
