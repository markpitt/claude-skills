#!/usr/bin/env python3
"""
Microsoft Graph API Connection Test Script

This script tests connectivity to Microsoft Graph API using client credentials flow.
It's useful for verifying that your app registration is configured correctly.

Requirements:
    pip install requests msal

Usage:
    python test-connection.py

Set the following environment variables:
    AZURE_CLIENT_ID - Your application (client) ID
    AZURE_TENANT_ID - Your directory (tenant) ID
    AZURE_CLIENT_SECRET - Your client secret

Or edit the script to provide values directly.
"""

import os
import sys
import json
import requests
from typing import Optional, Dict, Any

try:
    import msal
except ImportError:
    print("Error: msal library not installed.")
    print("Install it with: pip install msal")
    sys.exit(1)


class GraphAPITester:
    """Test Microsoft Graph API connectivity"""

    def __init__(self, client_id: str, tenant_id: str, client_secret: str):
        self.client_id = client_id
        self.tenant_id = tenant_id
        self.client_secret = client_secret
        self.access_token: Optional[str] = None
        self.graph_url = "https://graph.microsoft.com/v1.0"

    def acquire_token(self) -> bool:
        """Acquire access token using client credentials flow"""
        print("🔑 Acquiring access token...")

        authority = f"https://login.microsoftonline.com/{self.tenant_id}"
        app = msal.ConfidentialClientApplication(
            client_id=self.client_id,
            client_credential=self.client_secret,
            authority=authority
        )

        # Request token for Microsoft Graph
        result = app.acquire_token_for_client(
            scopes=["https://graph.microsoft.com/.default"]
        )

        if "access_token" in result:
            self.access_token = result["access_token"]
            print("✅ Successfully acquired access token")
            print(f"   Token expires in: {result.get('expires_in', 'unknown')} seconds")
            return True
        else:
            print("❌ Failed to acquire token")
            print(f"   Error: {result.get('error', 'Unknown error')}")
            print(f"   Description: {result.get('error_description', 'No description')}")
            return False

    def test_endpoint(self, endpoint: str, name: str) -> Dict[str, Any]:
        """Test a specific Graph API endpoint"""
        print(f"\n🧪 Testing: {name}")
        print(f"   Endpoint: {endpoint}")

        if not self.access_token:
            return {"success": False, "error": "No access token"}

        headers = {
            "Authorization": f"Bearer {self.access_token}",
            "Content-Type": "application/json"
        }

        try:
            response = requests.get(f"{self.graph_url}{endpoint}", headers=headers)

            if response.status_code == 200:
                data = response.json()
                # Get count if available
                count = len(data.get("value", [])) if "value" in data else 1
                print(f"   ✅ Success (HTTP {response.status_code})")
                print(f"   Results: {count} item(s)")
                return {"success": True, "data": data, "count": count}

            elif response.status_code == 403:
                print(f"   ⚠️  Forbidden (HTTP {response.status_code})")
                print(f"   This endpoint requires additional permissions")
                error = response.json().get("error", {})
                print(f"   Error: {error.get('message', 'Permission denied')}")
                return {"success": False, "error": "Permission denied", "status": 403}

            else:
                print(f"   ❌ Failed (HTTP {response.status_code})")
                error = response.json().get("error", {})
                print(f"   Error: {error.get('message', 'Unknown error')}")
                return {"success": False, "error": error.get("message"), "status": response.status_code}

        except requests.exceptions.RequestException as e:
            print(f"   ❌ Request failed: {str(e)}")
            return {"success": False, "error": str(e)}

    def run_tests(self) -> None:
        """Run a series of connectivity tests"""
        print("\n" + "="*60)
        print("Microsoft Graph API Connection Test")
        print("="*60)

        # Test authentication
        if not self.acquire_token():
            print("\n❌ Authentication failed. Cannot proceed with API tests.")
            return

        # Define test endpoints
        tests = [
            ("/organization", "Organization Info"),
            ("/users?$top=5&$select=displayName,userPrincipalName", "List Users (top 5)"),
            ("/groups?$top=5&$select=displayName,mail", "List Groups (top 5)"),
            ("/me", "Current User (delegated only)"),
        ]

        # Run tests
        results = []
        for endpoint, name in tests:
            result = self.test_endpoint(endpoint, name)
            results.append((name, result))

        # Summary
        print("\n" + "="*60)
        print("Test Summary")
        print("="*60)

        success_count = sum(1 for _, r in results if r.get("success"))
        total_count = len(results)

        for name, result in results:
            status = "✅ PASS" if result.get("success") else "❌ FAIL"
            if result.get("status") == 403:
                status = "⚠️  PERMISSION NEEDED"
            print(f"{status} - {name}")

        print(f"\n📊 Results: {success_count}/{total_count} tests passed")

        if success_count == total_count:
            print("\n🎉 All tests passed! Your Microsoft Graph API connection is working.")
        elif success_count > 0:
            print("\n⚠️  Some tests failed. Check permissions in Azure AD app registration.")
        else:
            print("\n❌ All tests failed. Verify your credentials and app configuration.")

        # Recommendations
        print("\n" + "="*60)
        print("Recommendations")
        print("="*60)
        print("If tests failed, verify:")
        print("1. Client ID, Tenant ID, and Client Secret are correct")
        print("2. Application permissions are granted in Azure AD")
        print("3. Admin consent has been granted for application permissions")
        print("4. Application has required permissions:")
        print("   - Organization.Read.All (for organization info)")
        print("   - User.Read.All (for users)")
        print("   - Group.Read.All (for groups)")


def main():
    """Main function"""
    # Get credentials from environment or prompt
    client_id = os.getenv("AZURE_CLIENT_ID") or input("Enter Client ID: ").strip()
    tenant_id = os.getenv("AZURE_TENANT_ID") or input("Enter Tenant ID: ").strip()
    client_secret = os.getenv("AZURE_CLIENT_SECRET") or input("Enter Client Secret: ").strip()

    if not all([client_id, tenant_id, client_secret]):
        print("❌ Error: Missing required credentials")
        print("\nSet environment variables:")
        print("  export AZURE_CLIENT_ID='your-client-id'")
        print("  export AZURE_TENANT_ID='your-tenant-id'")
        print("  export AZURE_CLIENT_SECRET='your-client-secret'")
        sys.exit(1)

    # Run tests
    tester = GraphAPITester(client_id, tenant_id, client_secret)
    tester.run_tests()


if __name__ == "__main__":
    main()
