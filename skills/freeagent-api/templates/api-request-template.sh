#!/bin/bash
# FreeAgent API Request Template
# This script provides a template for making FreeAgent API requests
#
# SECURITY NOTE
# -------------
# Write operations (POST, PUT, DELETE) affect real financial data.
# This script will show a preview and require confirmation before executing them.
# Set DRY_RUN=true to preview any request without sending it.

# Environment variables (set these in your shell profile or .env file)
: ${FREEAGENT_API_URL:="https://api.sandbox.freeagent.com/v2"}  # Defaults to sandbox
: ${FREEAGENT_ACCESS_TOKEN:?"Error: FREEAGENT_ACCESS_TOKEN not set"}

# Set DRY_RUN=true to print the request without executing it
: ${DRY_RUN:="false"}

# API endpoint (change this to your desired endpoint)
ENDPOINT="contacts"

# Optional: Query parameters
QUERY_PARAMS="?view=active"

# HTTP method (GET, POST, PUT, DELETE)
METHOD="GET"

# Optional: Request body (for POST/PUT)
REQUEST_BODY='{
  "contact": {
    "organisation_name": "Example Company",
    "email": "contact@example.com"
  }
}'

# Make the API request
_confirm_write() {
    echo "" >&2
    echo "--- Write Operation Preview ---" >&2
    echo "  Method  : $METHOD" >&2
    echo "  URL     : $FREEAGENT_API_URL/$ENDPOINT" >&2
    if [ -n "$REQUEST_BODY" ]; then
        echo "  Body    : $REQUEST_BODY" >&2
    fi
    echo "-------------------------------" >&2
    printf "Confirm this operation? [y/N]: " >&2
    read -r reply
    case "$reply" in
        [Yy]|[Yy][Ee][Ss]) return 0 ;;
        *) echo "Cancelled." >&2; exit 1 ;;
    esac
}

if [ "$METHOD" = "GET" ]; then
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] GET $FREEAGENT_API_URL/$ENDPOINT$QUERY_PARAMS" >&2
        exit 0
    fi
    # GET request
    curl -X GET \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Accept: application/json" \
        "$FREEAGENT_API_URL/$ENDPOINT$QUERY_PARAMS"
elif [ "$METHOD" = "POST" ]; then
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] POST $FREEAGENT_API_URL/$ENDPOINT" >&2
        echo "  Body: $REQUEST_BODY" >&2
        exit 0
    fi
    _confirm_write
    # POST request
    curl -X POST \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$REQUEST_BODY" \
        "$FREEAGENT_API_URL/$ENDPOINT"
elif [ "$METHOD" = "PUT" ]; then
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] PUT $FREEAGENT_API_URL/$ENDPOINT" >&2
        echo "  Body: $REQUEST_BODY" >&2
        exit 0
    fi
    _confirm_write
    # PUT request
    curl -X PUT \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$REQUEST_BODY" \
        "$FREEAGENT_API_URL/$ENDPOINT"
elif [ "$METHOD" = "DELETE" ]; then
    if [ "$DRY_RUN" = "true" ]; then
        echo "[DRY RUN] DELETE $FREEAGENT_API_URL/$ENDPOINT" >&2
        exit 0
    fi
    _confirm_write
    # DELETE request
    curl -X DELETE \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Accept: application/json" \
        "$FREEAGENT_API_URL/$ENDPOINT"
else
    echo "Error: Invalid METHOD. Use GET, POST, PUT, or DELETE"
    exit 1
fi
