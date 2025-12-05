# FreeAgent API: Contacts & Organizations

## Overview

The Contacts API manages all your business relationships: clients, suppliers, partners, and team members. Contacts are central to invoicing, projects, and financial tracking.

## Contact Types

FreeAgent contacts can represent:
- **Clients** - Customers you invoice
- **Suppliers** - Vendors you purchase from
- **Partners** - Collaborators and partners
- **Team Members** - Via Users endpoint
- **Business Contacts** - General business relationships

## List Contacts

```
GET /v2/contacts
```

**Query Parameters:**
- `view` - Filter contacts:
  - `active` - Currently active contacts
  - `active_projects` - Contacts with active projects
  - `active_suppliers` - Active supplier relationships
  - `hidden` - Archived/hidden contacts
  - (omit for all contacts)
- `updated_since` - ISO 8601 timestamp to get changes since date
- `page` - Page number (for pagination)
- `per_page` - Items per page (default 100, max ~200)

**Examples:**
```bash
# Get all active clients
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/contacts?view=active"

# Get contacts updated in last 7 days
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/contacts?updated_since=2025-01-08T00:00:00Z"

# Get paginated results
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/contacts?page=2&per_page=50"
```

**Response:**
```json
{
  "contacts": [
    {
      "url": "https://api.freeagent.com/v2/contacts/123",
      "organisation_name": "Acme Corporation",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@acme.com",
      "phone_number": "+44 20 1234 5678",
      "is_active": true,
      "address1": "123 High Street",
      "address2": "Suite 100",
      "address3": "",
      "town": "London",
      "region": "",
      "postcode": "SW1A 1AA",
      "country": "United Kingdom",
      "contact_name_on_invoices": "Accounts Team",
      "sales_tax_registration_number": "GB123456789",
      "default_payment_terms_in_days": 30,
      "created_at": "2024-06-15T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    }
  ]
}
```

## Get Single Contact

```
GET /v2/contacts/:id
```

Extract the ID from the contact URL (e.g., 123 from `https://api.freeagent.com/v2/contacts/123`).

**Example:**
```bash
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/contacts/123"
```

## Create Contact

```
POST /v2/contacts
```

**Required Fields (at least one of):**
- `organisation_name` - Company name (for businesses)
- OR both `first_name` and `last_name` (for individuals)

**Optional Fields:**

**Contact Information:**
- `email` - Email address
- `phone_number` - Phone number with country code (e.g., "+44 20 1234 5678")

**Address Fields:**
- `address1` - First address line (required for invoices)
- `address2` - Second address line
- `address3` - Third address line
- `town` - City/town
- `region` - State/region
- `postcode` - Postal code
- `country` - Country name

**Billing & Financial:**
- `contact_name_on_invoices` - Name to display on invoices (if different from main name)
- `sales_tax_registration_number` - VAT/GST number
- `default_payment_terms_in_days` - Default payment terms (e.g., 30)

**Example - Create Business Contact:**
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
         "address2": "Suite 100",
         "town": "London",
         "postcode": "SW1A 1AA",
         "country": "United Kingdom",
         "sales_tax_registration_number": "GB123456789",
         "default_payment_terms_in_days": 30
       }
     }' \
     "https://api.freeagent.com/v2/contacts"
```

**Example - Create Individual Contact:**
```bash
curl -X POST \
     -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contact": {
         "first_name": "Jane",
         "last_name": "Smith",
         "email": "jane@example.com",
         "phone_number": "+44 7700 123456",
         "address1": "45 Oak Lane",
         "town": "Edinburgh",
         "postcode": "EH8 8DX",
         "country": "United Kingdom"
       }
     }' \
     "https://api.freeagent.com/v2/contacts"
```

**Response:**
```json
{
  "contact": {
    "url": "https://api.freeagent.com/v2/contacts/123",
    "organisation_name": "Acme Corporation",
    "email": "billing@acme.com",
    ...
  }
}
```

## Update Contact

```
PUT /v2/contacts/:id
```

Send only the fields you want to update. All fields are optional.

**Example - Update email and payment terms:**
```bash
curl -X PUT \
     -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "contact": {
         "email": "new-email@acme.com",
         "default_payment_terms_in_days": 60
       }
     }' \
     "https://api.freeagent.com/v2/contacts/123"
```

## Delete Contact

```
DELETE /v2/contacts/:id
```

Only contacts with no invoices, timeslips, or projects can be deleted. Hidden contacts can typically be re-activated instead.

## Searching and Filtering

### Find Contacts by Email

```python
def find_contact_by_email(client, email):
    """Find a contact by email address"""
    contacts = client.get('contacts', params={'view': 'active'})
    
    for contact in contacts['contacts']:
        if contact.get('email', '').lower() == email.lower():
            return contact
    
    return None
```

### Get Contacts Updated Recently

```bash
# Get contacts changed in last 30 days
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/contacts?updated_since=2024-12-05T00:00:00Z"
```

## Bulk Operations

### Bulk Import Contacts from CSV

```python
import csv

def import_contacts_from_csv(client, csv_file_path):
    """Import contacts from CSV file"""
    
    with open(csv_file_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        
        for row in reader:
            contact_data = {
                'contact': {
                    'organisation_name': row['company'],
                    'email': row.get('email', ''),
                    'phone_number': row.get('phone', ''),
                    'address1': row.get('address', ''),
                    'town': row.get('city', ''),
                    'postcode': row.get('postcode', ''),
                    'country': row.get('country', 'United Kingdom'),
                    'default_payment_terms_in_days': int(row.get('payment_terms', 30))
                }
            }
            
            try:
                result = client.post('contacts', contact_data)
                print(f"✓ Created: {contact_data['contact']['organisation_name']}")
            except Exception as e:
                print(f"✗ Failed: {contact_data['contact']['organisation_name']} - {e}")

# CSV format expected:
# company,email,phone,address,city,postcode,country,payment_terms
```

### Bulk Export Contacts

```python
def export_contacts_to_csv(client, output_file):
    """Export all active contacts to CSV"""
    
    import csv
    
    contacts = client.get('contacts', params={'view': 'active'})
    
    with open(output_file, 'w', newline='') as csvfile:
        fieldnames = [
            'id', 'organisation_name', 'first_name', 'last_name',
            'email', 'phone_number', 'address1', 'town', 'postcode',
            'country', 'default_payment_terms_in_days'
        ]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
        writer.writeheader()
        
        for contact in contacts['contacts']:
            contact_id = contact['url'].split('/')[-1]
            writer.writerow({
                'id': contact_id,
                'organisation_name': contact.get('organisation_name', ''),
                'first_name': contact.get('first_name', ''),
                'last_name': contact.get('last_name', ''),
                'email': contact.get('email', ''),
                'phone_number': contact.get('phone_number', ''),
                'address1': contact.get('address1', ''),
                'town': contact.get('town', ''),
                'postcode': contact.get('postcode', ''),
                'country': contact.get('country', ''),
                'default_payment_terms_in_days': contact.get('default_payment_terms_in_days', 30)
            })
```

## Company Information

### Get Company

```
GET /v2/company
```

Returns information about the FreeAgent company/account.

**Response:**
```json
{
  "company": {
    "url": "https://api.freeagent.com/v2/company",
    "name": "My Business Ltd",
    "subdomain": "mybusiness",
    "type": "UkLimitedCompany",
    "currency": "GBP",
    "sales_tax_registration_status": "Registered"
  }
}
```

## Users (Team Members)

### List Users

```
GET /v2/users
```

Returns all team members in the account.

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

**Permission Levels:**
- `8` - Owner (full access)
- `5` - Admin (most features)
- `3` - User (limited access)
- `1` - Viewer (read-only)

## Related Resources

See also:
- [Authentication & Setup](authentication-setup.md) for OAuth setup
- [Accounting Objects](accounting-objects.md) for invoices, projects, timeslips
- [Code Examples](../resources/examples.md) for working examples
- [API Request Template](../templates/api-request-template.sh) for curl examples
