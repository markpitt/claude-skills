#!/bin/bash
# FreeAgent API Request Template
# This script provides a template for making FreeAgent API requests

# Environment variables (set these in your shell profile or .env file)
: ${FREEAGENT_API_URL:="https://api.freeagent.com/v2"}
: ${FREEAGENT_ACCESS_TOKEN:?"Error: FREEAGENT_ACCESS_TOKEN not set"}

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
if [ "$METHOD" = "GET" ]; then
    # GET request
    curl -X GET \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Accept: application/json" \
        "$FREEAGENT_API_URL/$ENDPOINT$QUERY_PARAMS"
elif [ "$METHOD" = "POST" ]; then
    # POST request
    curl -X POST \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$REQUEST_BODY" \
        "$FREEAGENT_API_URL/$ENDPOINT"
elif [ "$METHOD" = "PUT" ]; then
    # PUT request
    curl -X PUT \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -H "Accept: application/json" \
        -d "$REQUEST_BODY" \
        "$FREEAGENT_API_URL/$ENDPOINT"
elif [ "$METHOD" = "DELETE" ]; then
    # DELETE request
    curl -X DELETE \
        -H "Authorization: Bearer $FREEAGENT_ACCESS_TOKEN" \
        -H "Accept: application/json" \
        "$FREEAGENT_API_URL/$ENDPOINT"
else
    echo "Error: Invalid METHOD. Use GET, POST, PUT, or DELETE"
    exit 1
fi
