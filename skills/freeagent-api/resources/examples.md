# FreeAgent API Examples

Practical examples for common FreeAgent API use cases.

## Setup

### Environment Variables

```bash
# ~/.bashrc or ~/.zshrc
export FREEAGENT_CLIENT_ID="your_oauth_client_id"
export FREEAGENT_CLIENT_SECRET="your_oauth_client_secret"
export FREEAGENT_ACCESS_TOKEN="your_access_token"
export FREEAGENT_REFRESH_TOKEN="your_refresh_token"
export FREEAGENT_API_URL="https://api.freeagent.com/v2"
```

### Python Setup

```python
import requests
import os
import json
from datetime import datetime, timedelta

class FreeAgentAPI:
    def __init__(self):
        self.api_url = os.getenv('FREEAGENT_API_URL', 'https://api.freeagent.com/v2')
        self.access_token = os.getenv('FREEAGENT_ACCESS_TOKEN')
        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }

    def get(self, endpoint, params=None):
        url = f'{self.api_url}/{endpoint}'
        response = requests.get(url, headers=self.headers, params=params)
        response.raise_for_status()
        return response.json()

    def post(self, endpoint, data):
        url = f'{self.api_url}/{endpoint}'
        response = requests.post(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def put(self, endpoint, data):
        url = f'{self.api_url}/{endpoint}'
        response = requests.put(url, headers=self.headers, json=data)
        response.raise_for_status()
        return response.json()

    def delete(self, endpoint):
        url = f'{self.api_url}/{endpoint}'
        response = requests.delete(url, headers=self.headers)
        response.raise_for_status()

# Initialize API client
fa = FreeAgentAPI()
```

## Example 1: List All Active Contacts

### Bash (curl)

```bash
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Accept: application/json" \
     "$FREEAGENT_API_URL/contacts?view=active"
```

### Python

```python
# Get all active contacts
contacts = fa.get('contacts', params={'view': 'active'})

# Print contact names and emails
for contact in contacts['contacts']:
    name = contact.get('organisation_name') or f"{contact.get('first_name')} {contact.get('last_name')}"
    email = contact.get('email', 'No email')
    print(f"{name}: {email}")
```

## Example 2: Create a New Contact

### Bash (curl)

```bash
curl -X POST \
     -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contact": {
         "organisation_name": "Acme Corporation",
         "email": "billing@acme.com",
         "phone_number": "+44 20 1234 5678",
         "address1": "123 High Street",
         "town": "London",
         "postcode": "SW1A 1AA",
         "country": "United Kingdom",
         "default_payment_terms_in_days": 30
       }
     }' \
     "$FREEAGENT_API_URL/contacts"
```

### Python

```python
# Create a new contact
new_contact = {
    'contact': {
        'organisation_name': 'Acme Corporation',
        'email': 'billing@acme.com',
        'phone_number': '+44 20 1234 5678',
        'address1': '123 High Street',
        'town': 'London',
        'postcode': 'SW1A 1AA',
        'country': 'United Kingdom',
        'default_payment_terms_in_days': 30
    }
}

result = fa.post('contacts', new_contact)
contact_url = result['contact']['url']
print(f"Contact created: {contact_url}")
```

## Example 3: Create an Invoice

### Bash (curl)

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
         "comments": "Thank you for your business!",
         "invoice_items": [
           {
             "item_type": "Hours",
             "description": "Web development services",
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
     "$FREEAGENT_API_URL/invoices"
```

### Python

```python
from datetime import datetime, timedelta

# Create invoice dated today, due in 30 days
today = datetime.now().strftime('%Y-%m-%d')

invoice_data = {
    'invoice': {
        'contact': 'https://api.freeagent.com/v2/contacts/123',
        'dated_on': today,
        'payment_terms_in_days': 30,
        'reference': 'INV-2025-001',
        'comments': 'Thank you for your business!',
        'invoice_items': [
            {
                'item_type': 'Hours',
                'description': 'Web development services',
                'quantity': 40,
                'price': 150.00,
                'sales_tax_rate': 20.0
            },
            {
                'item_type': 'Products',
                'description': 'Domain registration',
                'quantity': 1,
                'price': 20.00,
                'sales_tax_rate': 20.0
            }
        ]
    }
}

result = fa.post('invoices', invoice_data)
invoice = result['invoice']
print(f"Invoice created: {invoice['reference']}")
print(f"Total: {invoice['currency']} {invoice['total_value']}")
```

## Example 4: Get Recent Invoices

### Python

```python
# Get all invoices updated in the last 30 days
thirty_days_ago = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%dT00:00:00Z')

invoices = fa.get('invoices', params={
    'view': 'recent',
    'updated_since': thirty_days_ago
})

# Print invoice summary
for invoice in invoices['invoices']:
    print(f"{invoice['reference']}: {invoice['status']} - {invoice['currency']} {invoice['total_value']}")
```

## Example 5: Create a Project

### Python

```python
# Create a new project for a client
project_data = {
    'project': {
        'contact': 'https://api.freeagent.com/v2/contacts/123',
        'name': 'Website Redesign Project',
        'budget': 80,
        'budget_units': 'Hours',
        'normal_billing_rate': 150.00,
        'status': 'Active'
    }
}

result = fa.post('projects', project_data)
project_url = result['project']['url']
print(f"Project created: {project_url}")
```

## Example 6: Log Time to a Project

### Python

```python
# Create a timeslip for today
today = datetime.now().strftime('%Y-%m-%d')

timeslip_data = {
    'timeslip': {
        'user': 'https://api.freeagent.com/v2/users/111',
        'project': 'https://api.freeagent.com/v2/projects/789',
        'dated_on': today,
        'hours': 4.5,
        'comment': 'Client meeting and initial wireframes'
    }
}

result = fa.post('timeslips', timeslip_data)
print(f"Timeslip created: {result['timeslip']['hours']} hours")
```

## Example 7: Get Project Timeslips Summary

### Python

```python
# Get all timeslips for a specific project
project_url = 'https://api.freeagent.com/v2/projects/789'
timeslips = fa.get('timeslips', params={'project': project_url})

# Calculate total hours
total_hours = sum(t['hours'] for t in timeslips['timeslips'])
print(f"Total hours logged: {total_hours}")

# Group by user
from collections import defaultdict
hours_by_user = defaultdict(float)

for timeslip in timeslips['timeslips']:
    user_url = timeslip['user']
    hours_by_user[user_url] += timeslip['hours']

print("\nHours by user:")
for user_url, hours in hours_by_user.items():
    print(f"{user_url}: {hours} hours")
```

## Example 8: Record an Expense

### Python

```python
# Record a billable expense for a project
today = datetime.now().strftime('%Y-%m-%d')

expense_data = {
    'expense': {
        'user': 'https://api.freeagent.com/v2/users/111',
        'dated_on': today,
        'description': 'Stock photography licenses',
        'gross_value': 120.00,
        'sales_tax_rate': 20.0,
        'category': 'https://api.freeagent.com/v2/categories/123',
        'project': 'https://api.freeagent.com/v2/projects/789'  # Makes it billable
    }
}

result = fa.post('expenses', expense_data)
print(f"Expense recorded: {result['expense']['description']}")
```

## Example 9: Find Overdue Invoices

### Python

```python
# Get all open or overdue invoices
invoices = fa.get('invoices', params={'view': 'open_or_overdue'})

# Filter to only overdue
from datetime import datetime

today = datetime.now().date()
overdue_invoices = []

for invoice in invoices['invoices']:
    due_date = datetime.strptime(invoice['due_on'], '%Y-%m-%d').date()
    if due_date < today and invoice['status'] in ['Sent', 'Viewed']:
        overdue_invoices.append(invoice)

print(f"Overdue invoices: {len(overdue_invoices)}")
for invoice in overdue_invoices:
    days_overdue = (today - datetime.strptime(invoice['due_on'], '%Y-%m-%d').date()).days
    print(f"{invoice['reference']}: {days_overdue} days overdue - {invoice['currency']} {invoice['total_value']}")
```

## Example 10: Generate Monthly Invoice for Project

### Python

```python
from datetime import datetime, timedelta
from calendar import monthrange

def create_monthly_invoice(contact_url, project_url, year, month):
    """Create an invoice for a month's work on a project"""

    # Get the last day of the month
    last_day = monthrange(year, month)[1]
    start_date = f"{year}-{month:02d}-01"
    end_date = f"{year}-{month:02d}-{last_day}"
    invoice_date = end_date

    # Get timeslips for the month
    timeslips = fa.get('timeslips', params={
        'project': project_url,
        'from_date': start_date,
        'to_date': end_date
    })

    # Get expenses for the month
    expenses = fa.get('expenses', params={
        'project': project_url,
        'from_date': start_date,
        'to_date': end_date
    })

    # Calculate hours by task
    hours_by_task = {}
    for timeslip in timeslips['timeslips']:
        task = timeslip.get('task', 'General')
        hours_by_task[task] = hours_by_task.get(task, 0) + timeslip['hours']

    # Create invoice items for time
    invoice_items = []
    for task, hours in hours_by_task.items():
        invoice_items.append({
            'item_type': 'Hours',
            'description': f'Development work - {task}',
            'quantity': hours,
            'price': 150.00,  # Your hourly rate
            'sales_tax_rate': 20.0
        })

    # Add billable expenses
    for expense in expenses['expenses']:
        if expense.get('is_billable', False):
            invoice_items.append({
                'item_type': 'Products',
                'description': expense['description'],
                'quantity': 1,
                'price': expense['gross_value'],
                'sales_tax_rate': 0.0  # Expense already includes tax
            })

    # Create the invoice
    month_name = datetime(year, month, 1).strftime('%B')
    invoice_data = {
        'invoice': {
            'contact': contact_url,
            'project': project_url,
            'dated_on': invoice_date,
            'payment_terms_in_days': 30,
            'reference': f'INV-{year}-{month:02d}',
            'comments': f'Invoice for {month_name} {year}',
            'invoice_items': invoice_items
        }
    }

    result = fa.post('invoices', invoice_data)
    return result['invoice']

# Usage
invoice = create_monthly_invoice(
    contact_url='https://api.freeagent.com/v2/contacts/123',
    project_url='https://api.freeagent.com/v2/projects/789',
    year=2025,
    month=1
)

print(f"Created invoice {invoice['reference']} for {invoice['currency']} {invoice['total_value']}")
```

## Example 11: Refresh Access Token

### Python

```python
import requests
import os

def refresh_access_token():
    """Refresh the FreeAgent access token using refresh token"""

    token_url = f"{os.getenv('FREEAGENT_API_URL')}/token_endpoint"

    data = {
        'grant_type': 'refresh_token',
        'refresh_token': os.getenv('FREEAGENT_REFRESH_TOKEN'),
        'client_id': os.getenv('FREEAGENT_CLIENT_ID'),
        'client_secret': os.getenv('FREEAGENT_CLIENT_SECRET')
    }

    response = requests.post(token_url, data=data)
    response.raise_for_status()

    tokens = response.json()

    # Update environment variables or save to secure storage
    new_access_token = tokens['access_token']
    new_refresh_token = tokens['refresh_token']

    print("Access token refreshed successfully")
    print(f"New access token: {new_access_token[:20]}...")
    print(f"Expires in: {tokens['expires_in']} seconds")

    return tokens

# Usage
# tokens = refresh_access_token()
```

## Example 12: Bulk Contact Import

### Python

```python
import csv

def import_contacts_from_csv(csv_file_path):
    """Import contacts from a CSV file"""

    with open(csv_file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)

        for row in reader:
            contact_data = {
                'contact': {
                    'organisation_name': row['company'],
                    'email': row['email'],
                    'phone_number': row.get('phone', ''),
                    'address1': row.get('address', ''),
                    'town': row.get('city', ''),
                    'postcode': row.get('postcode', ''),
                    'country': row.get('country', 'United Kingdom'),
                    'default_payment_terms_in_days': int(row.get('payment_terms', 30))
                }
            }

            try:
                result = fa.post('contacts', contact_data)
                print(f"✓ Created: {contact_data['contact']['organisation_name']}")
            except requests.exceptions.HTTPError as e:
                print(f"✗ Failed: {contact_data['contact']['organisation_name']} - {e}")

# CSV format:
# company,email,phone,address,city,postcode,country,payment_terms
# Acme Corp,billing@acme.com,+44 20 1234,123 Street,London,SW1A 1AA,United Kingdom,30

# import_contacts_from_csv('contacts.csv')
```

## Example 13: Generate Report of Unbilled Work

### Python

```python
def unbilled_work_report():
    """Generate a report of all unbilled timeslips and expenses"""

    # Get unbilled timeslips
    timeslips = fa.get('timeslips', params={'view': 'unsubmitted_unbilled'})

    # Get unbilled expenses
    expenses = fa.get('expenses', params={'view': 'open'})

    # Group by project
    from collections import defaultdict

    unbilled_by_project = defaultdict(lambda: {'hours': 0, 'expenses': 0, 'timeslips': [], 'expense_items': []})

    for timeslip in timeslips['timeslips']:
        project = timeslip.get('project', 'No project')
        unbilled_by_project[project]['hours'] += timeslip['hours']
        unbilled_by_project[project]['timeslips'].append(timeslip)

    for expense in expenses['expenses']:
        if expense.get('is_billable', False):
            project = expense.get('project', 'No project')
            unbilled_by_project[project]['expenses'] += expense['gross_value']
            unbilled_by_project[project]['expense_items'].append(expense)

    print("UNBILLED WORK REPORT")
    print("=" * 60)

    for project, data in unbilled_by_project.items():
        print(f"\nProject: {project}")
        print(f"  Unbilled hours: {data['hours']}")
        print(f"  Unbilled expenses: £{data['expenses']:.2f}")
        print(f"  Estimated value: £{data['hours'] * 150 + data['expenses']:.2f}")

# unbilled_work_report()
```

## Error Handling Example

### Python

```python
import requests
from time import sleep

def api_call_with_retry(method, endpoint, data=None, max_retries=3):
    """Make API call with automatic retry on rate limit"""

    for attempt in range(max_retries):
        try:
            if method == 'GET':
                response = fa.get(endpoint, params=data)
            elif method == 'POST':
                response = fa.post(endpoint, data)
            elif method == 'PUT':
                response = fa.put(endpoint, data)

            return response

        except requests.exceptions.HTTPError as e:
            if e.response.status_code == 429:  # Rate limit exceeded
                retry_after = int(e.response.headers.get('Retry-After', 60))
                print(f"Rate limit hit. Waiting {retry_after} seconds...")
                sleep(retry_after)
            elif e.response.status_code == 401:  # Unauthorized
                print("Access token expired. Please refresh token.")
                raise
            elif e.response.status_code == 422:  # Validation error
                errors = e.response.json().get('errors', [])
                print("Validation errors:")
                for error in errors:
                    print(f"  - {error.get('field')}: {error.get('message')}")
                raise
            else:
                raise

    raise Exception(f"Failed after {max_retries} retries")
```

## Best Practices Summary

1. **Always store credentials securely** - use environment variables or a secrets manager
2. **Handle rate limits gracefully** - implement retry logic with exponential backoff
3. **Validate data before sending** - check required fields and formats
4. **Use sandbox for testing** - never test on production data
5. **Log API calls** - maintain audit trail of operations
6. **Cache responses when appropriate** - reduce unnecessary API calls
7. **Handle errors explicitly** - don't assume requests will succeed
8. **Keep tokens fresh** - implement automatic token refresh
9. **Use pagination for large datasets** - don't try to load everything at once
10. **Document your integration** - maintain clear records of API usage
