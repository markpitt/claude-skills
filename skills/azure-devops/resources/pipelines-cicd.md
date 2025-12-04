# Azure Pipelines - CI/CD & Automation

Azure Pipelines provides build automation, release management, and deployment orchestration using YAML pipelines, classic builds, and release definitions.

## Build Definitions (Pipelines)

Manage YAML and classic pipeline definitions.

### List Build Definitions
```http
GET /{organization}/{project}/_apis/build/definitions?api-version=7.1
```

Query options:
- `?name=MyPipeline` - Filter by name
- `?$top=50` - Limit results
- `?includeAllProperties=true` - Include full definition

### Get Build Definition
```http
GET /{organization}/{project}/_apis/build/definitions/{definitionId}?api-version=7.1
```

### Create Build Definition
```http
POST /{organization}/{project}/_apis/build/definitions?api-version=7.1
Content-Type: application/json

{
  "name": "MyPipeline",
  "type": "build",
  "quality": "definition",
  "description": "Build pipeline for my project",
  "repository": {
    "id": "{repositoryId}",
    "type": "TfsGit",
    "name": "MyRepo",
    "url": "https://dev.azure.com/{org}/{project}/_git/MyRepo",
    "defaultBranch": "refs/heads/main"
  },
  "process": {
    "yamlFilename": "azure-pipelines.yml",
    "type": 2
  }
}
```

### Update Build Definition
```http
PUT /{organization}/{project}/_apis/build/definitions/{definitionId}?api-version=7.1
Content-Type: application/json
```

### Delete Build Definition
```http
DELETE /{organization}/{project}/_apis/build/definitions/{definitionId}?api-version=7.1
```

## Queuing & Managing Builds

Queue, monitor, and manage build executions.

### Queue Build
```http
POST /{organization}/{project}/_apis/build/builds?api-version=7.1
Content-Type: application/json

{
  "definition": {
    "id": 123
  },
  "sourceBranch": "refs/heads/main",
  "sourceVersion": "{commitId}",
  "priority": "normal",
  "parameters": "{\"param1\":\"value1\",\"param2\":\"value2\"}"
}
```

### Get Builds
```http
GET /{organization}/{project}/_apis/build/builds?api-version=7.1
```

Filter options:
- `?definitions=1,2,3` - Specific definitions
- `?buildNumber=MyBuild.123` - By build number
- `?branchName=refs/heads/main` - By branch
- `?$orderBy=finishTime desc` - Sort by finish time
- `?statusFilter=completed,inProgress` - By status

### Get Specific Build
```http
GET /{organization}/{project}/_apis/build/builds/{buildId}?api-version=7.1
```

### Update Build
```http
PATCH /{organization}/{project}/_apis/build/builds/{buildId}?api-version=7.1
Content-Type: application/json

{
  "status": "inProgress",
  "keepForever": true,
  "retainedByRelease": true
}
```

Build statuses:
- `inProgress` - Currently running
- `completed` - Finished
- `cancelling` - Being cancelled
- `postponed` - Queued

### Stop/Cancel Build
```http
PATCH /{organization}/{project}/_apis/build/builds/{buildId}?api-version=7.1
Content-Type: application/json

{
  "status": "cancelling"
}
```

### Delete Build
```http
DELETE /{organization}/{project}/_apis/build/builds/{buildId}?api-version=7.1
```

## Build Logs & Artifacts

Access build logs, timelines, and artifacts.

### Get Build Logs
```http
GET /{organization}/{project}/_apis/build/builds/{buildId}/logs?api-version=7.1
```

Each log entry includes:
- Log ID
- Log file URL

### Get Specific Log
```http
GET /{organization}/{project}/_apis/build/builds/{buildId}/logs/{logId}?api-version=7.1
```

### Get Build Timeline
Timeline shows task execution sequence and duration:
```http
GET /{organization}/{project}/_apis/build/builds/{buildId}/timeline?api-version=7.1
```

### Get Build Artifacts
```http
GET /{organization}/{project}/_apis/build/builds/{buildId}/artifacts?api-version=7.1
```

Response includes artifact names and download URLs:
```json
{
  "value": [
    {
      "id": 1,
      "name": "drop",
      "resource": {
        "downloadUrl": "..."
      }
    }
  ]
}
```

## Release Management

Manage release definitions and deployments.

**Note:** Release endpoints use `vsrm.dev.azure.com` instead of `dev.azure.com`

### List Release Definitions
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/definitions?api-version=7.1
```

### Get Release Definition
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/definitions/{definitionId}?api-version=7.1
```

### Create Release Definition
```http
POST https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/definitions?api-version=7.1
Content-Type: application/json

{
  "name": "MyRelease",
  "description": "Release definition",
  "environments": [
    {
      "name": "Development",
      "deployPhases": [],
      "environmentOptions": {}
    }
  ],
  "artifacts": [
    {
      "type": "Build",
      "alias": "drop",
      "definitionReference": {
        "definition": {
          "id": "{buildDefinitionId}"
        }
      }
    }
  ]
}
```

## Releases (Deployments)

Create and manage release instances.

### Create Release
```http
POST https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases?api-version=7.1
Content-Type: application/json

{
  "definitionId": 1,
  "description": "Release triggered from API",
  "artifacts": [
    {
      "alias": "drop",
      "instanceReference": {
        "id": "{buildId}"
      }
    }
  ]
}
```

### Get Releases
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases?api-version=7.1
```

Filter options:
- `?definitionId=1` - By definition
- `?statusFilter=active,draft` - By status
- `?$orderBy=modifiedOn desc` - Sort by modified date

### Get Specific Release
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases/{releaseId}?api-version=7.1
```

### Update Release
```http
PATCH https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases/{releaseId}?api-version=7.1
Content-Type: application/json

{
  "status": "active"
}
```

## Environment & Deployment Management

Manage release environments and deployments.

### Get Release Environment
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases/{releaseId}/environments/{environmentId}?api-version=7.1
```

### Update Release Environment
Deploy to or manage an environment:
```http
PATCH https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/releases/{releaseId}/environments/{environmentId}?api-version=7.1
Content-Type: application/json

{
  "status": "inProgress",
  "scheduledDeploymentTime": "2025-01-15T10:00:00Z"
}
```

Environment statuses:
- `notStarted` - Pending
- `inProgress` - Currently deploying
- `succeeded` - Successful
- `partiallysucceeded` - Some tasks failed
- `failed` - Failed
- `canceled` - Cancelled

## Approvals

Manage release approvals.

### Get Approvals
```http
GET https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/approvals?api-version=7.1
```

Filter options:
- `?releaseId={releaseId}` - By release
- `?statusFilter=pending,approved` - By status

### Update Approval
```http
PATCH https://vsrm.dev.azure.com/{organization}/{project}/_apis/release/approvals/{approvalId}?api-version=7.1
Content-Type: application/json

{
  "status": "approved",
  "comments": "Approved - ready for deployment"
}
```

Approval statuses:
- `pending` - Awaiting approval
- `approved` - Approved
- `rejected` - Rejected
- `reassigned` - Reassigned
- `deferred` - Deferred

## Agent Pools & Management

Manage build and release agents.

### List Agent Pools
```http
GET /{organization}/_apis/distributedtask/pools?api-version=7.1
```

### Get Specific Pool
```http
GET /{organization}/_apis/distributedtask/pools/{poolId}?api-version=7.1
```

### Create Agent Pool
```http
POST /{organization}/_apis/distributedtask/pools?api-version=7.1
Content-Type: application/json

{
  "name": "MyPoolName",
  "autoProvision": false
}
```

### List Agents in Pool
```http
GET /{organization}/_apis/distributedtask/pools/{poolId}/agents?api-version=7.1
```

### Get Specific Agent
```http
GET /{organization}/_apis/distributedtask/pools/{poolId}/agents/{agentId}?api-version=7.1
```

### Update Agent
```http
PATCH /{organization}/_apis/distributedtask/pools/{poolId}/agents/{agentId}?api-version=7.1
Content-Type: application/json

{
  "enabled": true
}
```

## Variable Groups & Pipeline Variables

Manage variables across pipelines.

### List Variable Groups
```http
GET /{organization}/{project}/_apis/distributedtask/variablegroups?api-version=7.1
```

### Get Variable Group
```http
GET /{organization}/{project}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.1
```

### Create Variable Group
```http
POST /{organization}/{project}/_apis/distributedtask/variablegroups?api-version=7.1
Content-Type: application/json

{
  "name": "MyVariableGroup",
  "description": "Shared variables",
  "variables": {
    "var1": {
      "value": "value1"
    },
    "secretVar": {
      "value": "secretValue",
      "isSecret": true
    }
  }
}
```

### Update Variable Group
```http
PUT /{organization}/{project}/_apis/distributedtask/variablegroups/{groupId}?api-version=7.1
Content-Type: application/json

{
  "id": {groupId},
  "name": "UpdatedName",
  "variables": {...}
}
```

## Task Groups & Reusable Components

Create reusable task groups for pipeline composition.

### List Task Groups
```http
GET /{organization}/{project}/_apis/distributedtask/taskgroups?api-version=7.1
```

### Get Task Group
```http
GET /{organization}/{project}/_apis/distributedtask/taskgroups/{taskGroupId}?api-version=7.1
```

## Service Endpoints (Connections)

Manage service connections for deployment targets.

### List Service Endpoints
```http
GET /{organization}/{project}/_apis/serviceendpoint/endpoints?api-version=7.1
```

### Get Service Endpoint
```http
GET /{organization}/{project}/_apis/serviceendpoint/endpoints/{endpointId}?api-version=7.1
```

### Create Service Endpoint
```http
POST /{organization}/{project}/_apis/serviceendpoint/endpoints?api-version=7.1
Content-Type: application/json

{
  "name": "MyAzureSubscription",
  "type": "azurerm",
  "url": "https://management.azure.com/",
  "authorization": {
    "parameters": {
      "tenantId": "{tenantId}",
      "clientId": "{clientId}",
      "clientSecret": "{clientSecret}",
      "subscriptionId": "{subscriptionId}",
      "subscriptionName": "My Subscription"
    },
    "scheme": "ServicePrincipal"
  },
  "isShared": false
}
```

Common endpoint types:
- `azurerm` - Azure Resource Manager
- `github` - GitHub
- `kubernetes` - Kubernetes
- `docker` - Docker Registry
- `npm` - npm Registry
- `nuget` - NuGet

## Best Practices

### Pipeline Design
1. Use YAML pipelines for version control
2. Keep pipelines simple and focused
3. Use templates for reusable components
4. Implement proper branching strategies
5. Use meaningful pipeline names
6. Document parameters and variables

### CI/CD Workflow
1. Build on every commit to main
2. Run tests automatically
3. Gate production deployments with approvals
4. Implement blue-green or canary deployments
5. Monitor and alert on deployment failures
6. Keep deployment logs for audit
7. Automate rollback procedures

### Security
1. Use managed identities where possible
2. Store secrets in Key Vault
3. Limit agent access to sensitive resources
4. Use separate pools for different environments
5. Implement PAT rotation
6. Audit and log all deployments
7. Use service principals with minimal permissions

### Performance & Cost
1. Use hosted agents for standard workloads
2. Self-host agents for long-running builds
3. Cache dependencies
4. Parallelize builds
5. Clean up old build artifacts
6. Monitor agent pool utilization
7. Use demand-based agent scaling

### Monitoring & Troubleshooting
1. Check build logs for errors
2. Review pipeline execution timeline
3. Monitor agent status and health
4. Track build duration trends
5. Set up alerts for failures
6. Use diagnostic logs
7. Test locally before committing
