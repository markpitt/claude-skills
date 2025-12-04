# Azure Repos - Version Control & Git

Azure Repos provides Git and TFVC repository management with comprehensive pull request workflow, branch policies, and commit tracking.

## Repositories - Management

Work with Git repositories in Azure DevOps.

### List Repositories
```http
GET /{organization}/{project}/_apis/git/repositories?api-version=7.1
```

### Get Repository
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}?api-version=7.1
```

### Create Repository
```http
POST /{organization}/{project}/_apis/git/repositories?api-version=7.1
Content-Type: application/json

{
  "name": "MyRepo",
  "project": {
    "id": "{projectId}"
  }
}
```

### Delete Repository
```http
DELETE /{organization}/{project}/_apis/git/repositories/{repositoryId}?api-version=7.1
```

## Commits & History

Query commits and file changes.

### Get Commits
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/commits?api-version=7.1
```

Query options:
- `?branch=refs/heads/main` - Filter by branch
- `?searchCriteria.itemVersion.versionType=branch&searchCriteria.itemVersion.version=main` - Branch specification
- `?$top=100&$skip=200` - Pagination

### Get Specific Commit
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/commits/{commitId}?api-version=7.1
```

### Get Commit Changes
View files modified in a commit:
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/commits/{commitId}/changes?api-version=7.1
```

Response includes:
- File path
- Change type (add, edit, delete, rename)
- File size
- Line counts

## Branches & References

Manage branches and Git references.

### Get All Branches
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?filter=heads/&api-version=7.1
```

### Get Specific Branch
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?filter=heads/main&api-version=7.1
```

### Create Branch
```http
POST /{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?api-version=7.1
Content-Type: application/json

[
  {
    "name": "refs/heads/feature-branch",
    "oldObjectId": "0000000000000000000000000000000000000000",
    "newObjectId": "{commitId}"
  }
]
```

### Delete Branch
```http
POST /{organization}/{project}/_apis/git/repositories/{repositoryId}/refs?api-version=7.1
Content-Type: application/json

[
  {
    "name": "refs/heads/old-branch",
    "oldObjectId": "{currentCommitId}",
    "newObjectId": "0000000000000000000000000000000000000000"
  }
]
```

## Pull Requests - Core Operations

Manage pull request workflow.

### Create Pull Request
```http
POST /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests?api-version=7.1
Content-Type: application/json

{
  "sourceRefName": "refs/heads/feature",
  "targetRefName": "refs/heads/main",
  "title": "Add new feature",
  "description": "This PR adds the new feature"
}
```

### Get Pull Requests
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests?api-version=7.1
```

Filter options:
- `?searchCriteria.status=active` - Active PRs only
- `?searchCriteria.status=all` - All PRs
- `?searchCriteria.reviewerId={userId}` - Filter by reviewer
- `?searchCriteria.creatorId={userId}` - Filter by creator

### Get Specific Pull Request
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}?api-version=7.1
```

### Update Pull Request
```http
PATCH /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}?api-version=7.1
Content-Type: application/json

{
  "status": "completed",
  "title": "Updated PR title",
  "description": "Updated description"
}
```

### Complete/Merge Pull Request
```http
PATCH /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}?api-version=7.1
Content-Type: application/json

{
  "status": "completed",
  "lastMergeSourceCommit": {
    "commitId": "{sourceCommitId}"
  },
  "completionOptions": {
    "mergeCommitMessage": "Merged via API",
    "deleteSourceBranch": true,
    "squashMerge": false,
    "transitionWorkItems": true
  }
}
```

## Pull Request Reviews

Manage reviewers and review process.

### Add Reviewer
```http
PUT /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/reviewers/{reviewerId}?api-version=7.1
Content-Type: application/json

{
  "vote": 0,
  "isFlagged": false
}
```

Vote values:
- `-10` - Rejected
- `-5` - Waiting for author
- `0` - No response (default)
- `5` - Approved with suggestions
- `10` - Approved

### Get Reviewers
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/reviewers?api-version=7.1
```

### Get PR Work Items
View linked work items:
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/workitems?api-version=7.1
```

## Pull Request Comments & Discussions

Manage review threads and comments.

### Get PR Threads (Comments)
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/threads?api-version=7.1
```

### Add Comment Thread
```http
POST /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/threads?api-version=7.1
Content-Type: application/json

{
  "comments": [
    {
      "content": "This looks good, but consider optimizing this loop.",
      "commentType": 1
    }
  ],
  "status": 1,
  "threadContext": {
    "filePath": "/src/file.ts",
    "leftFileStart": 45,
    "leftFileEnd": 45,
    "rightFileStart": 45,
    "rightFileEnd": 45
  }
}
```

### Update Thread
```http
PATCH /{organization}/{project}/_apis/git/repositories/{repositoryId}/pullrequests/{pullRequestId}/threads/{threadId}?api-version=7.1
Content-Type: application/json

{
  "status": 1,
  "comments": [
    {
      "id": {commentId},
      "content": "Updated comment"
    }
  ]
}
```

## File & Path Operations

Access repository files and directory contents.

### Get Item (File or Folder)
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/items?path=/src/file.ts&api-version=7.1
```

### Get Item Content (File Download)
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/items?path=/src/file.ts&download=true&api-version=7.1
```

### Get Items Batch
Query multiple files efficiently:
```http
POST /{organization}/{project}/_apis/git/repositories/{repositoryId}/itemsbatch?api-version=7.1
Content-Type: application/json

{
  "itemDescriptors": [
    {"path": "/file1.txt", "version": "main"},
    {"path": "/file2.txt", "version": "main"},
    {"path": "/config.json", "version": "main"}
  ]
}
```

## Branch Policies & Protection

Manage branch policies and protection rules.

### Get Policy Configurations
```http
GET /{organization}/{project}/_apis/policy/configurations?api-version=7.1
```

### Create Policy
```http
POST /{organization}/{project}/_apis/policy/configurations?api-version=7.1
Content-Type: application/json

{
  "type": {
    "id": "{policyTypeId}"
  },
  "isEnabled": true,
  "isBlocking": true,
  "settings": {
    "scope": [
      {
        "repositoryId": "{repositoryId}",
        "refName": "refs/heads/main",
        "matchKind": "exact"
      }
    ],
    "minimumApproverCount": 2,
    "creatorVoteCounts": false,
    "resetOnSourcePush": true,
    "resetVotes": true
  }
}
```

Common policy types:
- Minimum reviewers
- Build validation
- Status checks
- Comment requirements
- Case enforcement
- Reserved names

## Pushes

View push history and operations.

### Get Pushes
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pushes?api-version=7.1
```

Query options:
- `?searchCriteria.fromDate=2025-01-01T00:00:00Z` - Filter by date range
- `?searchCriteria.pusherId={userId}` - Filter by pusher

### Get Specific Push
```http
GET /{organization}/{project}/_apis/git/repositories/{repositoryId}/pushes/{pushId}?api-version=7.1
```

## Best Practices

### Repository Management
1. Use clear repository naming conventions
2. Implement appropriate branch policies
3. Document repository purposes
4. Organize repositories by team or project domain
5. Regularly archive unused repositories
6. Use read-only mirrors for sensitive code

### Pull Request Workflow
1. Require minimum reviewers (typically 2)
2. Enforce build/CI validation
3. Use branch policies for protection
4. Write descriptive PR titles and descriptions
5. Link related work items
6. Use squash merge for feature branches
7. Delete source branch after merge
8. Automate PR closure of resolved issues

### Commit Best Practices
1. Write descriptive commit messages
2. Use conventional commit format (feat:, fix:, docs:, etc.)
3. Keep commits atomic and focused
4. Reference work items in commits
5. Avoid committing secrets or credentials

### Review Best Practices
1. Set clear review expectations
2. Provide constructive feedback
3. Approve or request changes decisively
4. Resolve threads explicitly
5. Don't approve just to get PR merged
6. Consider code quality, security, and maintainability

### Branching Strategy
1. Use main/develop/feature branch strategy
2. Protect main branch with policies
3. Use meaningful branch names
4. Clean up merged branches
5. Consider trunk-based development for fast teams
