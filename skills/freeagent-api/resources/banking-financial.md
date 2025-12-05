# FreeAgent API: Banking & Financial Data

## Overview

Banking endpoints provide access to bank account information, transactions, and reconciliation data. This is essential for bookkeeping, cash flow management, and financial reporting.

## Bank Accounts

### List Bank Accounts

```
GET /v2/bank_accounts
```

Returns all bank accounts configured in FreeAgent.

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
      "is_personal": false,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2025-01-15T14:30:00Z"
    },
    {
      "url": "https://api.freeagent.com/v2/bank_accounts/556",
      "name": "Savings Account",
      "bank_name": "Barclays",
      "type": "SavingsAccount",
      "currency": "GBP",
      "current_balance": 15000.00,
      "is_personal": false
    }
  ]
}
```

### Get Single Bank Account

```
GET /v2/bank_accounts/:id
```

Retrieve details of a specific bank account.

## Bank Transactions

### List Bank Transactions

```
GET /v2/bank_transactions
```

**Query Parameters:**
- `bank_account` - Filter by bank account URL (required or implied)
- `from_date` - Start date (YYYY-MM-DD)
- `to_date` - End date (YYYY-MM-DD)
- `view` - Filter:
  - `unexplained` - Unreconciled transactions
  - `all` - All transactions
- `page` - Page number
- `per_page` - Items per page

**Examples:**

```bash
# Get unreconciled transactions for a bank account
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/bank_transactions?bank_account=https://api.freeagent.com/v2/bank_accounts/555&view=unexplained"

# Get transactions for a date range
curl -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     "https://api.freeagent.com/v2/bank_transactions?from_date=2025-01-01&to_date=2025-01-31"
```

**Response:**
```json
{
  "bank_transactions": [
    {
      "url": "https://api.freeagent.com/v2/bank_transactions/9999",
      "bank_account": "https://api.freeagent.com/v2/bank_accounts/555",
      "dated_on": "2025-01-15",
      "amount": 1500.00,
      "description": "Invoice payment from Acme Corp",
      "is_receipt": true,
      "is_manual": false,
      "created_at": "2025-01-15T10:00:00Z",
      "updated_at": "2025-01-15T10:00:00Z"
    },
    {
      "url": "https://api.freeagent.com/v2/bank_transactions/10000",
      "bank_account": "https://api.freeagent.com/v2/bank_accounts/555",
      "dated_on": "2025-01-16",
      "amount": -250.00,
      "description": "Office supplies purchase",
      "is_receipt": false,
      "is_manual": false
    }
  ]
}
```

### Create Bank Transaction (Manual)

```
POST /v2/bank_transactions
```

Manually record a transaction (typically for non-connected accounts).

**Required Fields:**
- `bank_account` - Bank account URL
- `dated_on` - Transaction date (YYYY-MM-DD)
- `amount` - Amount (positive for receipts, negative for payments)
- `description` - Transaction description

**Example:**
```bash
curl -X POST \
     -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "bank_transaction": {
         "bank_account": "https://api.freeagent.com/v2/bank_accounts/555",
         "dated_on": "2025-01-20",
         "amount": 1200.00,
         "description": "Client payment for project"
       }
     }' \
     "https://api.freeagent.com/v2/bank_transactions"
```

## Categories (Expense & Income)

### List Categories

```
GET /v2/categories
```

Returns all available expense and income categories for categorizing transactions.

**Response:**
```json
{
  "categories": [
    {
      "url": "https://api.freeagent.com/v2/categories/101",
      "name": "Office Rent",
      "code": "7100",
      "type": "Overheads",
      "is_tax_deductible": true
    },
    {
      "url": "https://api.freeagent.com/v2/categories/102",
      "name": "Office Supplies",
      "code": "7200",
      "type": "Overheads",
      "is_tax_deductible": true
    },
    {
      "url": "https://api.freeagent.com/v2/categories/103",
      "name": "Professional Services",
      "code": "7300",
      "type": "Overheads",
      "is_tax_deductible": true
    }
  ]
}
```

### Common Categories

- **Overheads**: General business expenses
- **Cost of Sales**: Direct costs of delivering services
- **Capital**: Asset purchases
- **Private**: Non-business expenses
- **Exceptional**: One-time transactions

## Tasks (Time Tracking Categories)

### List Tasks

```
GET /v2/tasks
```

Returns task types available for categorizing timeslips.

**Response:**
```json
{
  "tasks": [
    {
      "url": "https://api.freeagent.com/v2/tasks/201",
      "name": "Development",
      "description": "Software development work"
    },
    {
      "url": "https://api.freeagent.com/v2/tasks/202",
      "name": "Design",
      "description": "Design and UX work"
    },
    {
      "url": "https://api.freeagent.com/v2/tasks/203",
      "name": "Project Management",
      "description": "PM and coordination"
    }
  ]
}
```

## Common API Patterns

### Cash Flow Analysis

```python
def analyze_cash_flow(client, from_date, to_date, bank_account_url):
    """Analyze inflows and outflows for a date range"""
    
    transactions = client.get('bank_transactions', params={
        'bank_account': bank_account_url,
        'from_date': from_date,
        'to_date': to_date,
        'view': 'all'
    })
    
    inflows = sum(t['amount'] for t in transactions['bank_transactions'] if t['amount'] > 0)
    outflows = sum(abs(t['amount']) for t in transactions['bank_transactions'] if t['amount'] < 0)
    net = inflows - outflows
    
    return {
        'inflows': inflows,
        'outflows': outflows,
        'net': net,
        'transaction_count': len(transactions['bank_transactions'])
    }

# Usage
from datetime import datetime, timedelta

end_date = datetime.now().strftime('%Y-%m-%d')
start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

cash_flow = analyze_cash_flow(
    client,
    start_date,
    end_date,
    'https://api.freeagent.com/v2/bank_accounts/555'
)

print(f"Cash Flow for {start_date} to {end_date}")
print(f"Inflows: £{cash_flow['inflows']:.2f}")
print(f"Outflows: £{cash_flow['outflows']:.2f}")
print(f"Net: £{cash_flow['net']:.2f}")
```

### Find Unreconciled Transactions

```python
def get_unreconciled_transactions(client, bank_account_url):
    """Get all unreconciled transactions for a bank account"""
    
    transactions = client.get('bank_transactions', params={
        'bank_account': bank_account_url,
        'view': 'unexplained'
    })
    
    return transactions['bank_transactions']

# Usage
unreconciled = get_unreconciled_transactions(
    client,
    'https://api.freeagent.com/v2/bank_accounts/555'
)

print(f"Unreconciled transactions: {len(unreconciled)}")
for txn in unreconciled:
    print(f"  {txn['dated_on']}: {txn['description']} - £{txn['amount']:.2f}")
```

### Match Bank Transactions to Invoices

```python
def match_transactions_to_invoices(client, bank_account_url, contact_url=None):
    """Match bank transactions to paid invoices"""
    
    # Get recent transactions
    transactions = client.get('bank_transactions', params={
        'bank_account': bank_account_url,
        'view': 'unexplained'
    })
    
    # Get invoices
    invoice_params = {'view': 'recent'}
    if contact_url:
        invoice_params['contact'] = contact_url
    
    invoices = client.get('invoices', params=invoice_params)
    
    matches = []
    
    # Simple matching by amount (can be enhanced with date/reference matching)
    for txn in transactions['bank_transactions']:
        for invoice in invoices['invoices']:
            if abs(txn['amount'] - invoice['total_value']) < 0.01:  # Within 1 pence
                matches.append({
                    'transaction': txn,
                    'invoice': invoice,
                    'matched_amount': txn['amount']
                })
    
    return matches
```

## Reconciliation Workflow

### Monthly Bank Reconciliation

```python
def reconcile_month(client, bank_account_url, year, month):
    """Reconcile bank account for a specific month"""
    
    from datetime import date, timedelta
    from calendar import monthrange
    
    # Get first and last day of month
    first_day = date(year, month, 1).strftime('%Y-%m-%d')
    last_day = date(year, month, monthrange(year, month)[1]).strftime('%Y-%m-%d')
    
    # Get transactions
    transactions = client.get('bank_transactions', params={
        'bank_account': bank_account_url,
        'from_date': first_day,
        'to_date': last_day
    })
    
    # Calculate totals
    total_in = sum(t['amount'] for t in transactions['bank_transactions'] if t['amount'] > 0)
    total_out = sum(abs(t['amount']) for t in transactions['bank_transactions'] if t['amount'] < 0)
    
    # Get starting balance (from first transaction of month or previous)
    bank_info = client.get(f"bank_accounts/{bank_account_url.split('/')[-1]}")
    
    return {
        'period': f"{year}-{month:02d}",
        'total_receipts': total_in,
        'total_payments': total_out,
        'net_change': total_in - total_out,
        'transaction_count': len(transactions['bank_transactions']),
        'unreconciled_count': len([t for t in transactions['bank_transactions'] if 'reconciled' not in t])
    }
```

## Related Resources

See also:
- [Accounting Objects](accounting-objects.md) for invoices and expenses
- [Contacts & Organizations](contacts-organizations.md) for company information
- [Code Examples](../resources/examples.md) for working examples
- [API Request Template](../templates/api-request-template.sh) for curl commands
