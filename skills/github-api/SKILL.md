---
name: github-api
description: Comprehensive skill for working with GitHub API covering repositories, issues, pull requests, actions, workflows, projects, users, organizations, teams, security, packages, Git data, webhooks, search, and all other GitHub services. Use when implementing GitHub integrations, automating repository operations, managing workflows, analyzing code, or building applications that interact with GitHub.
version: 1.0
---

# GitHub API Skill

Comprehensive skill for working with the GitHub API across all services and operations. This skill covers both REST API v3 and GraphQL API v4.

## Overview

The GitHub API provides programmatic access to all GitHub functionality including:

- **Repositories**: Create, manage, and interact with repositories
- **Issues & Pull Requests**: Track work and collaborate on code reviews
- **Actions & Workflows**: Automate CI/CD pipelines and workflows
- **Projects**: Manage project boards and roadmaps
- **Users & Organizations**: Manage accounts, profiles, and settings
- **Teams**: Organize collaborators and manage permissions
- **Gists**: Share code snippets and small files
- **Git Data**: Work directly with Git objects (commits, trees, blobs, refs)
- **Search**: Find repositories, code, issues, users, and more
- **Security**: Manage scanning, secrets, alerts, and vulnerabilities
- **Packages**: Publish and manage packages (npm, Docker, Maven, etc.)
- **Webhooks**: Listen for and respond to GitHub events
- **Apps & OAuth**: Build integrations and authenticate users

## Authentication Methods

### 1. GitHub CLI (`gh`)
The `gh` CLI is the recommended method when available:

```bash
# Authenticate
gh auth login

# Check authentication status
gh auth status

# Use authenticated requests
gh api /user
gh api repos/owner/repo/issues
```

### 2. Personal Access Token (PAT)
For direct API calls:

```bash
# Classic PAT
curl -H "Authorization: token YOUR_TOKEN" \
  https://api.github.com/user

# Fine-grained PAT (recommended)
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.github.com/user
```

### 3. GitHub Apps
For building integrations:

```bash
# Installation access token
curl -H "Authorization: Bearer INSTALLATION_TOKEN" \
  -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/installation/repositories
```

### 4. OAuth Apps
For user authentication flows:

```bash
# After OAuth flow completion
curl -H "Authorization: token USER_ACCESS_TOKEN" \
  https://api.github.com/user
```

## API Versions

### REST API (v3)
Base URL: `https://api.github.com`

```bash
# Using gh CLI
gh api /repos/owner/repo

# Using curl
curl -H "Accept: application/vnd.github.v3+json" \
  https://api.github.com/repos/owner/repo
```

### GraphQL API (v4)
Endpoint: `https://api.github.com/graphql`

```bash
# Using gh CLI
gh api graphql -f query='
  query {
    viewer {
      login
      name
    }
  }'

# Using curl
curl -H "Authorization: Bearer TOKEN" \
  -X POST -d '{"query":"query { viewer { login name } }"}' \
  https://api.github.com/graphql
```

## Repositories

### Repository Management

```bash
# Get repository details
gh api repos/owner/repo

# List user repositories
gh api user/repos

# List organization repositories
gh api orgs/orgname/repos

# Create repository
gh repo create my-repo --public --description "My description"

# Or via API
gh api user/repos -X POST -f name="my-repo" -f private=false

# Delete repository
gh api repos/owner/repo -X DELETE

# Update repository settings
gh api repos/owner/repo -X PATCH \
  -f description="New description" \
  -f homepage="https://example.com"

# Archive repository
gh api repos/owner/repo -X PATCH -f archived=true

# Transfer repository
gh api repos/owner/repo/transfer -X POST -f new_owner="newowner"
```

### Branches and Protection

```bash
# List branches
gh api repos/owner/repo/branches

# Get branch
gh api repos/owner/repo/branches/main

# Create branch (via Git refs)
gh api repos/owner/repo/git/refs -X POST \
  -f ref="refs/heads/new-branch" \
  -f sha="COMMIT_SHA"

# Delete branch
gh api repos/owner/repo/git/refs/heads/branch-name -X DELETE

# Get branch protection
gh api repos/owner/repo/branches/main/protection

# Enable branch protection
gh api repos/owner/repo/branches/main/protection -X PUT \
  -f required_status_checks[strict]=true \
  -f required_pull_request_reviews[required_approving_review_count]=2 \
  -f enforce_admins=true

# Update branch protection
gh api repos/owner/repo/branches/main/protection -X PATCH \
  -f required_pull_request_reviews[required_approving_review_count]=1
```

### Commits and Content

```bash
# List commits
gh api repos/owner/repo/commits

# Get specific commit
gh api repos/owner/repo/commits/SHA

# Compare commits
gh api repos/owner/repo/compare/base...head

# Get file contents
gh api repos/owner/repo/contents/path/to/file

# Create or update file
gh api repos/owner/repo/contents/path/to/file -X PUT \
  -f message="Commit message" \
  -f content="BASE64_ENCODED_CONTENT"

# Delete file
gh api repos/owner/repo/contents/path/to/file -X DELETE \
  -f message="Delete file" \
  -f sha="FILE_BLOB_SHA"
```

### Releases and Tags

```bash
# List releases
gh api repos/owner/repo/releases

# Get latest release
gh api repos/owner/repo/releases/latest

# Create release
gh release create v1.0.0 --title "Version 1.0.0" --notes "Release notes"

# Or via API
gh api repos/owner/repo/releases -X POST \
  -f tag_name="v1.0.0" \
  -f name="Version 1.0.0" \
  -f body="Release notes"

# Upload release asset
gh release upload v1.0.0 ./artifact.zip

# List tags
gh api repos/owner/repo/tags

# Create tag
gh api repos/owner/repo/git/tags -X POST \
  -f tag="v1.0.0" \
  -f message="Version 1.0.0" \
  -f object="COMMIT_SHA" \
  -f type="commit"
```

## Issues

### Issue Management

```bash
# List issues
gh api repos/owner/repo/issues

# Get issue
gh api repos/owner/repo/issues/123

# Create issue
gh issue create --title "Bug report" --body "Description"

# Or via API
gh api repos/owner/repo/issues -X POST \
  -f title="Bug report" \
  -f body="Description" \
  -f labels[]=bug

# Update issue
gh api repos/owner/repo/issues/123 -X PATCH \
  -f state="closed" \
  -f labels[]=resolved

# Close issue
gh issue close 123

# Reopen issue
gh issue reopen 123

# Lock issue
gh api repos/owner/repo/issues/123/lock -X PUT

# Add assignees
gh api repos/owner/repo/issues/123/assignees -X POST \
  -f assignees[]=username1 -f assignees[]=username2
```

### Labels and Milestones

```bash
# List labels
gh api repos/owner/repo/labels

# Create label
gh api repos/owner/repo/labels -X POST \
  -f name="bug" \
  -f color="d73a4a" \
  -f description="Something isn't working"

# Add labels to issue
gh api repos/owner/repo/issues/123/labels -X POST \
  -f labels[]=bug -f labels[]=priority-high

# List milestones
gh api repos/owner/repo/milestones

# Create milestone
gh api repos/owner/repo/milestones -X POST \
  -f title="v1.0" \
  -f description="First release" \
  -f due_on="2025-12-31T23:59:59Z"

# Set issue milestone
gh api repos/owner/repo/issues/123 -X PATCH -f milestone=1
```

### Comments and Reactions

```bash
# List issue comments
gh api repos/owner/repo/issues/123/comments

# Create comment
gh api repos/owner/repo/issues/123/comments -X POST \
  -f body="Comment text"

# Update comment
gh api repos/owner/repo/issues/comments/COMMENT_ID -X PATCH \
  -f body="Updated comment"

# Delete comment
gh api repos/owner/repo/issues/comments/COMMENT_ID -X DELETE

# Add reaction to issue
gh api repos/owner/repo/issues/123/reactions -X POST \
  -f content="+1"

# Reaction types: +1, -1, laugh, confused, heart, hooray, rocket, eyes
```

## Pull Requests

### PR Management

```bash
# List pull requests
gh api repos/owner/repo/pulls

# Get pull request
gh api repos/owner/repo/pulls/123

# Create pull request
gh pr create --title "Feature" --body "Description" --base main --head feature-branch

# Or via API
gh api repos/owner/repo/pulls -X POST \
  -f title="Feature" \
  -f body="Description" \
  -f head="feature-branch" \
  -f base="main"

# Update pull request
gh api repos/owner/repo/pulls/123 -X PATCH \
  -f title="Updated title" \
  -f state="closed"

# Merge pull request
gh pr merge 123 --merge

# Or via API
gh api repos/owner/repo/pulls/123/merge -X PUT \
  -f merge_method="merge"

# Merge methods: merge, squash, rebase

# Close without merging
gh pr close 123
```

### Reviews and Approvals

```bash
# List reviews
gh api repos/owner/repo/pulls/123/reviews

# Create review
gh api repos/owner/repo/pulls/123/reviews -X POST \
  -f body="Looks good!" \
  -f event="APPROVE"

# Review events: APPROVE, REQUEST_CHANGES, COMMENT

# Request reviewers
gh api repos/owner/repo/pulls/123/requested_reviewers -X POST \
  -f reviewers[]=username1 -f reviewers[]=username2

# Dismiss review
gh api repos/owner/repo/pulls/123/reviews/REVIEW_ID/dismissals -X PUT \
  -f message="No longer relevant"
```

### PR Files and Commits

```bash
# List PR files
gh api repos/owner/repo/pulls/123/files

# List PR commits
gh api repos/owner/repo/pulls/123/commits

# Create review comment on code
gh api repos/owner/repo/pulls/123/comments -X POST \
  -f body="Comment on this line" \
  -f commit_id="COMMIT_SHA" \
  -f path="file.js" \
  -f line=42

# List review comments
gh api repos/owner/repo/pulls/123/comments
```

## Actions and Workflows

### Workflow Management

```bash
# List workflows
gh api repos/owner/repo/actions/workflows

# Get workflow
gh api repos/owner/repo/actions/workflows/WORKFLOW_ID

# Enable/disable workflow
gh api repos/owner/repo/actions/workflows/WORKFLOW_ID/enable -X PUT
gh api repos/owner/repo/actions/workflows/WORKFLOW_ID/disable -X PUT

# Trigger workflow dispatch
gh api repos/owner/repo/actions/workflows/WORKFLOW_ID/dispatches -X POST \
  -f ref="main" \
  -f inputs[key]="value"

# Or using gh CLI
gh workflow run workflow.yml -f key=value
```

### Workflow Runs

```bash
# List workflow runs
gh api repos/owner/repo/actions/runs

# List runs for specific workflow
gh api repos/owner/repo/actions/workflows/WORKFLOW_ID/runs

# Get workflow run
gh api repos/owner/repo/actions/runs/RUN_ID

# Re-run workflow
gh api repos/owner/repo/actions/runs/RUN_ID/rerun -X POST

# Cancel workflow run
gh api repos/owner/repo/actions/runs/RUN_ID/cancel -X POST

# Delete workflow run
gh api repos/owner/repo/actions/runs/RUN_ID -X DELETE

# List workflow run jobs
gh api repos/owner/repo/actions/runs/RUN_ID/jobs

# Get job logs
gh api repos/owner/repo/actions/jobs/JOB_ID/logs
```

### Artifacts and Cache

```bash
# List artifacts
gh api repos/owner/repo/actions/artifacts

# Download artifact
gh api repos/owner/repo/actions/artifacts/ARTIFACT_ID/zip > artifact.zip

# Delete artifact
gh api repos/owner/repo/actions/artifacts/ARTIFACT_ID -X DELETE

# List caches
gh api repos/owner/repo/actions/caches

# Delete cache
gh api repos/owner/repo/actions/caches/CACHE_ID -X DELETE
```

### Secrets and Variables

```bash
# List repository secrets
gh api repos/owner/repo/actions/secrets

# Create/update secret
gh secret set SECRET_NAME --body "secret-value"

# Delete secret
gh api repos/owner/repo/actions/secrets/SECRET_NAME -X DELETE

# List variables
gh api repos/owner/repo/actions/variables

# Create variable
gh api repos/owner/repo/actions/variables -X POST \
  -f name="VAR_NAME" \
  -f value="var-value"

# Update variable
gh api repos/owner/repo/actions/variables/VAR_NAME -X PATCH \
  -f value="new-value"

# Organization secrets and variables use similar patterns:
gh api orgs/orgname/actions/secrets
gh api orgs/orgname/actions/variables
```

### Self-hosted Runners

```bash
# List runners
gh api repos/owner/repo/actions/runners

# Get runner
gh api repos/owner/repo/actions/runners/RUNNER_ID

# Delete runner
gh api repos/owner/repo/actions/runners/RUNNER_ID -X DELETE

# Generate registration token
gh api repos/owner/repo/actions/runners/registration-token -X POST

# List runner applications
gh api repos/owner/repo/actions/runners/downloads
```

## Projects

### Projects (Classic)

```bash
# List repository projects
gh api repos/owner/repo/projects

# Create project
gh api repos/owner/repo/projects -X POST \
  -f name="Project Name" \
  -f body="Description"

# Get project
gh api projects/PROJECT_ID

# Update project
gh api projects/PROJECT_ID -X PATCH \
  -f name="Updated Name" \
  -f state="closed"

# Delete project
gh api projects/PROJECT_ID -X DELETE

# List project columns
gh api projects/PROJECT_ID/columns

# Create column
gh api projects/PROJECT_ID/columns -X POST \
  -f name="To Do"

# List cards in column
gh api projects/columns/COLUMN_ID/cards

# Create card
gh api projects/columns/COLUMN_ID/cards -X POST \
  -f note="Card content"
```

### Projects (V2 - Beta)

Projects V2 use GraphQL API:

```bash
# Get organization projects
gh api graphql -f query='
  query {
    organization(login: "orgname") {
      projectsV2(first: 10) {
        nodes {
          id
          title
          url
        }
      }
    }
  }'

# Get project details
gh api graphql -f query='
  query {
    node(id: "PROJECT_ID") {
      ... on ProjectV2 {
        title
        items(first: 20) {
          nodes {
            id
            content {
              ... on Issue {
                title
                number
              }
            }
          }
        }
      }
    }
  }'
```

## Users and Organizations

### User Information

```bash
# Get authenticated user
gh api user

# Get user by username
gh api users/username

# Update authenticated user
gh api user -X PATCH \
  -f bio="My bio" \
  -f location="City, Country" \
  -f blog="https://example.com"

# List user repositories
gh api users/username/repos

# List user gists
gh api users/username/gists

# List user followers
gh api users/username/followers

# List user following
gh api users/username/following

# Check if user follows another
gh api user/following/username

# Follow user
gh api user/following/username -X PUT

# Unfollow user
gh api user/following/username -X DELETE
```

### Organization Management

```bash
# Get organization
gh api orgs/orgname

# Update organization
gh api orgs/orgname -X PATCH \
  -f description="Org description" \
  -f location="City"

# List organization members
gh api orgs/orgname/members

# Check membership
gh api orgs/orgname/members/username

# Remove member
gh api orgs/orgname/members/username -X DELETE

# List organization teams
gh api orgs/orgname/teams

# List organization repositories
gh api orgs/orgname/repos

# List organization projects
gh api orgs/orgname/projects
```

### Teams

```bash
# List teams
gh api orgs/orgname/teams

# Get team
gh api orgs/orgname/teams/teamslug

# Create team
gh api orgs/orgname/teams -X POST \
  -f name="Team Name" \
  -f description="Team description" \
  -f privacy="closed"

# Update team
gh api orgs/orgname/teams/teamslug -X PATCH \
  -f description="Updated description"

# Delete team
gh api orgs/orgname/teams/teamslug -X DELETE

# List team members
gh api orgs/orgname/teams/teamslug/members

# Add team member
gh api orgs/orgname/teams/teamslug/memberships/username -X PUT

# Remove team member
gh api orgs/orgname/teams/teamslug/memberships/username -X DELETE

# List team repositories
gh api orgs/orgname/teams/teamslug/repos

# Add repository to team
gh api orgs/orgname/teams/teamslug/repos/owner/repo -X PUT \
  -f permission="push"

# Permissions: pull, push, admin, maintain, triage
```

## Search

### Search Repositories

```bash
# Search repositories
gh api search/repositories -f q="language:python stars:>1000"

# Search with multiple criteria
gh api search/repositories -f q="topic:machine-learning language:python pushed:>2024-01-01"

# Sort options: stars, forks, help-wanted-issues, updated
# Order: desc, asc
gh api search/repositories -f q="react" -f sort="stars" -f order="desc"
```

### Search Code

```bash
# Search code
gh api search/code -f q="addClass in:file language:js repo:owner/repo"

# Search in organization
gh api search/code -f q="TODO org:orgname"

# Search by filename
gh api search/code -f q="filename:package.json"

# Search by path
gh api search/code -f q="path:src/components"
```

### Search Issues and PRs

```bash
# Search issues
gh api search/issues -f q="is:issue is:open label:bug"

# Search pull requests
gh api search/issues -f q="is:pr is:merged author:username"

# Search by date
gh api search/issues -f q="is:issue created:>2024-01-01"

# Search by state
gh api search/issues -f q="is:issue is:closed state:closed"

# Search by assignee
gh api search/issues -f q="is:issue assignee:username"
```

### Search Users

```bash
# Search users
gh api search/users -f q="location:London language:python"

# Search by followers
gh api search/users -f q="followers:>1000"

# Search by repositories
gh api search/users -f q="repos:>10"
```

### Search Commits

```bash
# Search commits
gh api search/commits -f q="bug fix repo:owner/repo"

# Search by author
gh api search/commits -f q="author:username"

# Search by date
gh api search/commits -f q="committer-date:>2024-01-01"
```

## Git Data

### Blobs

```bash
# Get blob
gh api repos/owner/repo/git/blobs/SHA

# Create blob
gh api repos/owner/repo/git/blobs -X POST \
  -f content="File content" \
  -f encoding="utf-8"
```

### Trees

```bash
# Get tree
gh api repos/owner/repo/git/trees/SHA

# Get tree recursively
gh api repos/owner/repo/git/trees/SHA?recursive=1

# Create tree
gh api repos/owner/repo/git/trees -X POST \
  -f base_tree="BASE_SHA" \
  -f tree[][path]="file.txt" \
  -f tree[][mode]="100644" \
  -f tree[][type]="blob" \
  -f tree[][sha]="BLOB_SHA"
```

### Commits

```bash
# Get commit
gh api repos/owner/repo/git/commits/SHA

# Create commit
gh api repos/owner/repo/git/commits -X POST \
  -f message="Commit message" \
  -f tree="TREE_SHA" \
  -f parents[]="PARENT_SHA"
```

### References

```bash
# List references
gh api repos/owner/repo/git/refs

# Get reference
gh api repos/owner/repo/git/refs/heads/main

# Create reference
gh api repos/owner/repo/git/refs -X POST \
  -f ref="refs/heads/feature" \
  -f sha="COMMIT_SHA"

# Update reference
gh api repos/owner/repo/git/refs/heads/feature -X PATCH \
  -f sha="NEW_SHA" \
  -f force=true

# Delete reference
gh api repos/owner/repo/git/refs/heads/feature -X DELETE
```

### Tags

```bash
# Get tag
gh api repos/owner/repo/git/tags/TAG_SHA

# Create tag object
gh api repos/owner/repo/git/tags -X POST \
  -f tag="v1.0.0" \
  -f message="Version 1.0.0" \
  -f object="COMMIT_SHA" \
  -f type="commit"
```

## Gists

### Gist Management

```bash
# List gists
gh api gists

# Get gist
gh api gists/GIST_ID

# Create gist
gh gist create file.txt --public

# Or via API
gh api gists -X POST \
  -f description="Description" \
  -f public=true \
  -f files[file.txt][content]="File content"

# Update gist
gh api gists/GIST_ID -X PATCH \
  -f description="Updated description" \
  -f files[file.txt][content]="Updated content"

# Delete gist
gh api gists/GIST_ID -X DELETE

# Star gist
gh api gists/GIST_ID/star -X PUT

# Unstar gist
gh api gists/GIST_ID/star -X DELETE

# Check if gist is starred
gh api gists/GIST_ID/star

# Fork gist
gh api gists/GIST_ID/forks -X POST
```

### Gist Comments

```bash
# List comments
gh api gists/GIST_ID/comments

# Create comment
gh api gists/GIST_ID/comments -X POST \
  -f body="Comment text"

# Update comment
gh api gists/comments/COMMENT_ID -X PATCH \
  -f body="Updated comment"

# Delete comment
gh api gists/comments/COMMENT_ID -X DELETE
```

## Webhooks

### Repository Webhooks

```bash
# List webhooks
gh api repos/owner/repo/hooks

# Get webhook
gh api repos/owner/repo/hooks/HOOK_ID

# Create webhook
gh api repos/owner/repo/hooks -X POST \
  -f name="web" \
  -f config[url]="https://example.com/webhook" \
  -f config[content_type]="json" \
  -f events[]="push" \
  -f events[]="pull_request"

# Update webhook
gh api repos/owner/repo/hooks/HOOK_ID -X PATCH \
  -f events[]="push" \
  -f events[]="issues"

# Test webhook
gh api repos/owner/repo/hooks/HOOK_ID/tests -X POST

# Ping webhook
gh api repos/owner/repo/hooks/HOOK_ID/pings -X POST

# Delete webhook
gh api repos/owner/repo/hooks/HOOK_ID -X DELETE

# List webhook deliveries
gh api repos/owner/repo/hooks/HOOK_ID/deliveries

# Get delivery
gh api repos/owner/repo/hooks/HOOK_ID/deliveries/DELIVERY_ID

# Redeliver webhook
gh api repos/owner/repo/hooks/HOOK_ID/deliveries/DELIVERY_ID/attempts -X POST
```

### Organization Webhooks

```bash
# List organization webhooks
gh api orgs/orgname/hooks

# Create organization webhook
gh api orgs/orgname/hooks -X POST \
  -f name="web" \
  -f config[url]="https://example.com/webhook" \
  -f events[]="repository" \
  -f events[]="member"
```

## Security

### Dependabot

```bash
# List Dependabot alerts
gh api repos/owner/repo/dependabot/alerts

# Get Dependabot alert
gh api repos/owner/repo/dependabot/alerts/ALERT_NUMBER

# Update Dependabot alert
gh api repos/owner/repo/dependabot/alerts/ALERT_NUMBER -X PATCH \
  -f state="dismissed" \
  -f dismissed_reason="tolerable_risk"

# List Dependabot secrets
gh api repos/owner/repo/dependabot/secrets

# Create Dependabot secret
gh secret set DEPENDABOT_SECRET --body "secret-value" --app dependabot
```

### Code Scanning

```bash
# List code scanning alerts
gh api repos/owner/repo/code-scanning/alerts

# Get code scanning alert
gh api repos/owner/repo/code-scanning/alerts/ALERT_NUMBER

# Update code scanning alert
gh api repos/owner/repo/code-scanning/alerts/ALERT_NUMBER -X PATCH \
  -f state="dismissed" \
  -f dismissed_reason="false positive"

# List code scanning analyses
gh api repos/owner/repo/code-scanning/analyses

# Get SARIF
gh api repos/owner/repo/code-scanning/sarifs/SARIF_ID

# Upload SARIF
gh api repos/owner/repo/code-scanning/sarifs -X POST \
  -f sarif="BASE64_ENCODED_SARIF" \
  -f commit_sha="COMMIT_SHA" \
  -f ref="refs/heads/main"
```

### Secret Scanning

```bash
# List secret scanning alerts
gh api repos/owner/repo/secret-scanning/alerts

# Get secret scanning alert
gh api repos/owner/repo/secret-scanning/alerts/ALERT_NUMBER

# Update secret scanning alert
gh api repos/owner/repo/secret-scanning/alerts/ALERT_NUMBER -X PATCH \
  -f state="resolved" \
  -f resolution="revoked"

# List secret scanning locations
gh api repos/owner/repo/secret-scanning/alerts/ALERT_NUMBER/locations
```

### Security Advisories

```bash
# List repository advisories
gh api repos/owner/repo/security-advisories

# Get advisory
gh api repos/owner/repo/security-advisories/GHSA_ID

# Create advisory
gh api repos/owner/repo/security-advisories -X POST \
  -f summary="Security issue" \
  -f description="Details" \
  -f severity="high"

# Update advisory
gh api repos/owner/repo/security-advisories/GHSA_ID -X PATCH \
  -f state="published"
```

## Packages

### GitHub Packages

```bash
# List packages for user
gh api user/packages

# List packages for organization
gh api orgs/orgname/packages

# Get package
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME

# Package types: npm, maven, rubygems, docker, nuget, container

# Delete package
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME -X DELETE

# List package versions
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME/versions

# Get package version
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME/versions/VERSION_ID

# Delete package version
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME/versions/VERSION_ID -X DELETE

# Restore package version
gh api users/username/packages/PACKAGE_TYPE/PACKAGE_NAME/versions/VERSION_ID/restore -X POST
```

### Container Registry

```bash
# List container packages
gh api user/packages?package_type=container

# Get container package
gh api user/packages/container/PACKAGE_NAME

# List container versions
gh api user/packages/container/PACKAGE_NAME/versions

# Delete container version
gh api user/packages/container/PACKAGE_NAME/versions/VERSION_ID -X DELETE
```

## Notifications

```bash
# List notifications
gh api notifications

# List repository notifications
gh api repos/owner/repo/notifications

# Mark as read
gh api notifications -X PUT

# Mark repository notifications as read
gh api repos/owner/repo/notifications -X PUT

# Get thread
gh api notifications/threads/THREAD_ID

# Mark thread as read
gh api notifications/threads/THREAD_ID -X PATCH

# Get thread subscription
gh api notifications/threads/THREAD_ID/subscription

# Set thread subscription
gh api notifications/threads/THREAD_ID/subscription -X PUT \
  -f subscribed=true

# Delete thread subscription
gh api notifications/threads/THREAD_ID/subscription -X DELETE
```

## Apps

### GitHub Apps

```bash
# Get app
gh api app

# List installations
gh api app/installations

# Get installation
gh api app/installations/INSTALLATION_ID

# List installation repositories
gh api installation/repositories

# Create installation access token
gh api app/installations/INSTALLATION_ID/access_tokens -X POST

# Suspend installation
gh api app/installations/INSTALLATION_ID/suspended -X PUT

# Unsuspend installation
gh api app/installations/INSTALLATION_ID/suspended -X DELETE
```

### OAuth Apps

```bash
# Get app by client_id
gh api applications/CLIENT_ID/token -X POST \
  -f access_token="USER_TOKEN"

# Delete token
gh api applications/CLIENT_ID/token -X DELETE \
  -f access_token="USER_TOKEN"

# Delete grant
gh api applications/CLIENT_ID/grant -X DELETE \
  -f access_token="USER_TOKEN"
```

## GraphQL Examples

### Complex Queries

```bash
# Get repository with issues and PRs
gh api graphql -f query='
  query($owner:String!, $repo:String!) {
    repository(owner: $owner, name: $repo) {
      name
      description
      issues(first: 10, states: OPEN) {
        nodes {
          number
          title
          author {
            login
          }
        }
      }
      pullRequests(first: 10, states: OPEN) {
        nodes {
          number
          title
          author {
            login
          }
        }
      }
    }
  }' -f owner="owner" -f repo="repo"

# Search repositories with details
gh api graphql -f query='
  query($searchQuery:String!) {
    search(query: $searchQuery, type: REPOSITORY, first: 10) {
      edges {
        node {
          ... on Repository {
            name
            owner {
              login
            }
            stargazerCount
            forkCount
            primaryLanguage {
              name
            }
          }
        }
      }
    }
  }' -f searchQuery="language:python stars:>1000"

# Get user contributions
gh api graphql -f query='
  query($username:String!) {
    user(login: $username) {
      contributionsCollection {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              contributionCount
              date
            }
          }
        }
      }
    }
  }' -f username="username"
```

### Mutations

```bash
# Add comment to issue
gh api graphql -f query='
  mutation($subjectId:ID!, $body:String!) {
    addComment(input: {subjectId: $subjectId, body: $body}) {
      commentEdge {
        node {
          id
          body
        }
      }
    }
  }' -f subjectId="ISSUE_NODE_ID" -f body="Comment text"

# Close issue
gh api graphql -f query='
  mutation($issueId:ID!) {
    closeIssue(input: {issueId: $issueId}) {
      issue {
        id
        state
      }
    }
  }' -f issueId="ISSUE_NODE_ID"

# Add reaction
gh api graphql -f query='
  mutation($subjectId:ID!, $content:ReactionContent!) {
    addReaction(input: {subjectId: $subjectId, content: $content}) {
      reaction {
        id
        content
      }
    }
  }' -f subjectId="COMMENT_NODE_ID" -f content="THUMBS_UP"
```

## Rate Limiting

### Check Rate Limit

```bash
# Get rate limit status
gh api rate_limit

# Check specific rate limit
gh api rate_limit | jq '.resources.core'

# Rate limit headers are included in all API responses:
# X-RateLimit-Limit: Maximum requests per hour
# X-RateLimit-Remaining: Remaining requests
# X-RateLimit-Reset: Time when limit resets (Unix timestamp)
```

### Rate Limit Tiers

- **Authenticated requests**: 5,000 requests/hour
- **Unauthenticated requests**: 60 requests/hour
- **GraphQL**: 5,000 points/hour (varies by query complexity)
- **Search**: 30 requests/minute
- **GitHub Actions**: 1,000 requests/hour per repository

### Best Practices

1. **Use conditional requests** with ETags:
```bash
# First request
response=$(gh api repos/owner/repo -i)
etag=$(echo "$response" | grep -i etag | cut -d' ' -f2)

# Subsequent request
gh api repos/owner/repo -H "If-None-Match: $etag"
# Returns 304 Not Modified if unchanged (doesn't count against rate limit)
```

2. **Use GraphQL for complex queries** (more efficient than multiple REST calls)

3. **Implement exponential backoff** when hitting rate limits

4. **Cache responses** when appropriate

## Error Handling

### Common HTTP Status Codes

- `200 OK`: Success
- `201 Created`: Resource created successfully
- `204 No Content`: Success with no response body
- `304 Not Modified`: Resource hasn't changed (with conditional requests)
- `400 Bad Request`: Invalid request
- `401 Unauthorized`: Authentication required or failed
- `403 Forbidden`: Authentication succeeded but not authorized / rate limited
- `404 Not Found`: Resource doesn't exist
- `422 Unprocessable Entity`: Validation failed
- `500 Internal Server Error`: GitHub server error
- `502 Bad Gateway`: GitHub temporarily unavailable
- `503 Service Unavailable`: GitHub in maintenance mode

### Error Response Format

```json
{
  "message": "Validation Failed",
  "errors": [
    {
      "resource": "Issue",
      "field": "title",
      "code": "missing_field"
    }
  ],
  "documentation_url": "https://docs.github.com/rest/issues/issues#create-an-issue"
}
```

### Handling Errors

```bash
# Check response status
response=$(gh api repos/owner/repo -i 2>&1)
if echo "$response" | grep -q "HTTP/2 404"; then
  echo "Repository not found"
elif echo "$response" | grep -q "HTTP/2 403"; then
  echo "Rate limited or forbidden"
fi

# Use jq to parse error messages
gh api repos/owner/repo 2>&1 | jq -r '.message'
```

## Pagination

### REST API Pagination

```bash
# Default: 30 items per page, max: 100
gh api repos/owner/repo/issues --paginate

# Or manually with per_page and page
gh api repos/owner/repo/issues -f per_page=100 -f page=1

# Link header provides navigation:
# Link: <https://api.github.com/repos/owner/repo/issues?page=2>; rel="next",
#       <https://api.github.com/repos/owner/repo/issues?page=5>; rel="last"
```

### GraphQL Pagination (Cursor-based)

```bash
gh api graphql -f query='
  query($cursor:String) {
    repository(owner: "owner", name: "repo") {
      issues(first: 100, after: $cursor) {
        pageInfo {
          hasNextPage
          endCursor
        }
        nodes {
          number
          title
        }
      }
    }
  }' -f cursor="$end_cursor"
```

## Best Practices

### 1. Use Appropriate Authentication
- Use fine-grained PATs with minimal scopes
- Prefer GitHub Apps for integrations
- Use `gh` CLI when available

### 2. Optimize API Usage
- Use GraphQL for complex data requirements
- Implement pagination properly
- Use conditional requests with ETags
- Batch operations when possible

### 3. Handle Errors Gracefully
- Implement retry logic with exponential backoff
- Check rate limits before making requests
- Validate input before sending requests
- Log errors with context

### 4. Security
- Never commit tokens to repositories
- Rotate tokens regularly
- Use minimal required permissions
- Validate webhook signatures

### 5. Performance
- Cache responses when appropriate
- Use webhooks instead of polling
- Minimize API calls with efficient queries
- Use background jobs for bulk operations

## Common Patterns

### Bulk Operations

```bash
# Close multiple issues
for issue in 1 2 3 4 5; do
  gh api repos/owner/repo/issues/$issue -X PATCH -f state="closed"
  sleep 1  # Rate limiting courtesy
done

# Add label to multiple issues
issues=(1 2 3 4 5)
for issue in "${issues[@]}"; do
  gh api repos/owner/repo/issues/$issue/labels -X POST -f labels[]=bug
done
```

### Webhook Processing

```bash
# Verify webhook signature (in your webhook handler)
signature="$HTTP_X_HUB_SIGNATURE_256"
payload="$REQUEST_BODY"
secret="YOUR_WEBHOOK_SECRET"

computed=$(echo -n "$payload" | openssl dgst -sha256 -hmac "$secret" | sed 's/^.* //')
expected=$(echo "$signature" | sed 's/^sha256=//')

if [ "$computed" = "$expected" ]; then
  echo "Signature valid"
else
  echo "Signature invalid"
fi
```

### Automated Workflows

```bash
# Auto-merge dependabot PRs
gh api graphql -f query='
  query {
    repository(owner: "owner", name: "repo") {
      pullRequests(first: 10, states: OPEN) {
        nodes {
          number
          author {
            login
          }
          mergeable
        }
      }
    }
  }' | jq -r '.data.repository.pullRequests.nodes[] | select(.author.login == "dependabot") | select(.mergeable == "MERGEABLE") | .number' | while read pr; do
  gh pr merge "$pr" --auto --squash
done
```

## Resources

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub GraphQL API Documentation](https://docs.github.com/en/graphql)
- [GitHub CLI Documentation](https://cli.github.com/manual/)
- [GitHub API Rate Limiting](https://docs.github.com/en/rest/overview/resources-in-the-rest-api#rate-limiting)
- [GitHub Webhooks Documentation](https://docs.github.com/en/webhooks)
- [GitHub Apps Documentation](https://docs.github.com/en/apps)
- [GitHub Actions API](https://docs.github.com/en/rest/actions)

## Quick Reference

### Most Common Operations

```bash
# Repository operations
gh repo create NAME
gh repo view owner/repo
gh repo clone owner/repo

# Issues
gh issue list
gh issue create
gh issue close NUMBER

# Pull requests
gh pr list
gh pr create
gh pr merge NUMBER

# Actions
gh workflow run WORKFLOW
gh run list
gh run view RUN_ID

# Search
gh api search/repositories -f q="QUERY"
gh api search/code -f q="QUERY"
gh api search/issues -f q="QUERY"

# Authentication
gh auth login
gh auth status
gh auth token
```

This comprehensive skill covers all major GitHub API operations. Use it to build integrations, automate workflows, manage repositories, and interact with all GitHub services programmatically.
