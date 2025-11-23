#!/usr/bin/env python3
"""
FreeAgent API Python Client Template

A reusable Python client for interacting with the FreeAgent API.
"""

import os
import sys
import json
import requests
from typing import Dict, List, Optional, Any
from datetime import datetime


class FreeAgentAPIError(Exception):
    """Base exception for FreeAgent API errors"""
    pass


class FreeAgentClient:
    """FreeAgent API Client"""

    def __init__(
        self,
        access_token: Optional[str] = None,
        api_url: Optional[str] = None,
        sandbox: bool = False
    ):
        """
        Initialize FreeAgent API client

        Args:
            access_token: OAuth access token (defaults to FREEAGENT_ACCESS_TOKEN env var)
            api_url: API base URL (defaults to FREEAGENT_API_URL env var)
            sandbox: Use sandbox environment if True
        """
        self.access_token = access_token or os.getenv('FREEAGENT_ACCESS_TOKEN')
        if not self.access_token:
            raise FreeAgentAPIError("Access token not provided")

        if sandbox:
            self.api_url = 'https://api.sandbox.freeagent.com/v2'
        else:
            self.api_url = api_url or os.getenv(
                'FREEAGENT_API_URL',
                'https://api.freeagent.com/v2'
            )

        self.headers = {
            'Authorization': f'Bearer {self.access_token}',
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'User-Agent': 'FreeAgentPythonClient/1.0'
        }

    def _request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict] = None,
        data: Optional[Dict] = None
    ) -> Dict[str, Any]:
        """
        Make HTTP request to FreeAgent API

        Args:
            method: HTTP method (GET, POST, PUT, DELETE)
            endpoint: API endpoint (without base URL)
            params: Query parameters
            data: Request body data

        Returns:
            Response data as dictionary

        Raises:
            FreeAgentAPIError: If request fails
        """
        url = f"{self.api_url}/{endpoint.lstrip('/')}"

        try:
            response = requests.request(
                method=method,
                url=url,
                headers=self.headers,
                params=params,
                json=data,
                timeout=30
            )

            # Check rate limits
            if 'X-RateLimit-Remaining' in response.headers:
                remaining = int(response.headers['X-RateLimit-Remaining'])
                if remaining < 10:
                    print(f"Warning: Only {remaining} API calls remaining", file=sys.stderr)

            response.raise_for_status()

            if response.status_code == 204:  # No content (DELETE)
                return {}

            return response.json()

        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP {e.response.status_code}: {e.response.reason}"

            try:
                error_data = e.response.json()
                if 'errors' in error_data:
                    errors = error_data['errors']
                    error_details = '; '.join([
                        f"{err.get('field', 'unknown')}: {err.get('message', 'error')}"
                        for err in errors
                    ])
                    error_msg += f" - {error_details}"
            except:
                pass

            raise FreeAgentAPIError(error_msg) from e

        except requests.exceptions.RequestException as e:
            raise FreeAgentAPIError(f"Request failed: {str(e)}") from e

    def get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request"""
        return self._request('GET', endpoint, params=params)

    def post(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        """Make POST request"""
        return self._request('POST', endpoint, data=data)

    def put(self, endpoint: str, data: Dict) -> Dict[str, Any]:
        """Make PUT request"""
        return self._request('PUT', endpoint, data=data)

    def delete(self, endpoint: str) -> Dict[str, Any]:
        """Make DELETE request"""
        return self._request('DELETE', endpoint)

    # Convenience methods for common resources

    def get_contacts(self, view: str = 'active') -> List[Dict]:
        """Get contacts"""
        response = self.get('contacts', params={'view': view})
        return response.get('contacts', [])

    def create_contact(self, contact_data: Dict) -> Dict:
        """Create a new contact"""
        response = self.post('contacts', {'contact': contact_data})
        return response.get('contact', {})

    def get_invoices(self, view: str = 'recent', **params) -> List[Dict]:
        """Get invoices"""
        params['view'] = view
        response = self.get('invoices', params=params)
        return response.get('invoices', [])

    def create_invoice(self, invoice_data: Dict) -> Dict:
        """Create a new invoice"""
        response = self.post('invoices', {'invoice': invoice_data})
        return response.get('invoice', {})

    def get_projects(self, view: str = 'active') -> List[Dict]:
        """Get projects"""
        response = self.get('projects', params={'view': view})
        return response.get('projects', [])

    def create_project(self, project_data: Dict) -> Dict:
        """Create a new project"""
        response = self.post('projects', {'project': project_data})
        return response.get('project', {})

    def get_timeslips(self, **params) -> List[Dict]:
        """Get timeslips"""
        response = self.get('timeslips', params=params)
        return response.get('timeslips', [])

    def create_timeslip(self, timeslip_data: Dict) -> Dict:
        """Create a new timeslip"""
        response = self.post('timeslips', {'timeslip': timeslip_data})
        return response.get('timeslip', {})

    def get_expenses(self, view: str = 'recent', **params) -> List[Dict]:
        """Get expenses"""
        params['view'] = view
        response = self.get('expenses', params=params)
        return response.get('expenses', [])

    def create_expense(self, expense_data: Dict) -> Dict:
        """Create a new expense"""
        response = self.post('expenses', {'expense': expense_data})
        return response.get('expense', {})

    def get_company(self) -> Dict:
        """Get company information"""
        response = self.get('company')
        return response.get('company', {})

    def get_users(self) -> List[Dict]:
        """Get users"""
        response = self.get('users')
        return response.get('users', [])


def main():
    """Example usage"""
    try:
        # Initialize client
        client = FreeAgentClient()

        # Get company info
        company = client.get_company()
        print(f"Company: {company.get('name')}")
        print(f"Currency: {company.get('currency')}")

        # Get active contacts
        contacts = client.get_contacts(view='active')
        print(f"\nActive contacts: {len(contacts)}")
        for contact in contacts[:5]:  # Show first 5
            name = contact.get('organisation_name') or \
                   f"{contact.get('first_name')} {contact.get('last_name')}"
            print(f"  - {name}")

        # Get recent invoices
        invoices = client.get_invoices(view='recent')
        print(f"\nRecent invoices: {len(invoices)}")
        for invoice in invoices[:5]:  # Show first 5
            print(f"  - {invoice.get('reference')}: {invoice.get('status')} "
                  f"({invoice.get('currency')} {invoice.get('total_value')})")

    except FreeAgentAPIError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)


if __name__ == '__main__':
    main()
