# Azure Artifacts - Package Management

Azure Artifacts provides package management for NuGet, npm, PyPI, Maven, and Universal packages with feed management and package promotion.

## Feeds

Manage package feeds and access control.

### List Feeds
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds?api-version=7.1
```

Query options:
- `?includeDeletedUpstreams=true` - Include deleted upstream sources
- `?getUpstreamSources=true` - Include upstream source details

### Get Feed
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?api-version=7.1
```

### Create Feed
```http
POST https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds?api-version=7.1
Content-Type: application/json

{
  "name": "MyFeed",
  "description": "Feed for internal packages",
  "upstreamSources": [
    {
      "id": "public-source",
      "name": "Public Source",
      "location": "https://api.nuget.org/v3/index.json",
      "upstreamSourceType": "public",
      "internalUpstreamSourceId": null
    }
  ],
  "feedPermissions": [
    {
      "role": "contributor",
      "identityDescriptor": "{descriptor}"
    }
  ]
}
```

### Update Feed
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?api-version=7.1
Content-Type: application/json

{
  "name": "UpdatedFeedName",
  "description": "Updated description"
}
```

### Delete Feed
```http
DELETE https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?api-version=7.1
```

## Packages

Manage packages within feeds.

### List Packages
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages?api-version=7.1
```

Query options:
- `?protocolType=NuGet` - Filter by protocol (NuGet, npm, PyPI, Maven, etc.)
- `?includeDescription=true` - Include package descriptions
- `?$top=100` - Pagination

### Get Package
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}?api-version=7.1
```

### Delete Package
```http
DELETE https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}?api-version=7.1
```

Delete permanently (not just deprecate):
```http
DELETE https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}?api-version=7.1&hardDelete=true
```

## Package Versions

Manage individual package versions.

### List Package Versions
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/versions?api-version=7.1
```

Query options:
- `?includeDeleted=false` - Hide deleted versions
- `?$top=50` - Pagination

### Get Package Version
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/versions/{versionId}?api-version=7.1
```

### Deprecate Package Version
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/versions/{versionId}?api-version=7.1
Content-Type: application/json

{
  "isDeleted": false,
  "isDeprecated": true,
  "deprecationMessage": "Use version 2.0 instead"
}
```

### Delete Package Version
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/versions/{versionId}?api-version=7.1
Content-Type: application/json

{
  "isDeleted": true
}
```

### Permanently Delete Package Version
```http
DELETE https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/versions/{versionId}?api-version=7.1
```

## Package Permissions

Manage access to packages and feeds.

### Get Feed Permissions
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/permissions?api-version=7.1
```

### Set Feed Permissions
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/permissions?api-version=7.1
Content-Type: application/json

[
  {
    "role": "owner",
    "identityDescriptor": "{descriptor}"
  },
  {
    "role": "contributor",
    "identityDescriptor": "{descriptor}"
  },
  {
    "role": "reader",
    "identityDescriptor": "{descriptor}"
  }
]
```

Permission roles:
- `owner` - Full control
- `contributor` - Can publish packages
- `reader` - Can consume packages
- `collaborator` - Limited contributor access

### Get Package Permissions
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages/{packageId}/permissions?api-version=7.1
```

## NuGet Package Operations

### Publish NuGet Package
Publish via Azure Artifacts NuGet source:
```bash
nuget push MyPackage.1.0.0.nupkg -Source https://feeds.dev.azure.com/{organization}/{project}/_packaging/{feedName}/nuget/v2 -ApiKey AzureDevOps
```

Or via REST (not recommended - use NuGet CLI):
Upload `.nupkg` files using the NuGet CLI instead of REST API for best compatibility.

### Search NuGet Packages
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}/packages?protocolType=NuGet&api-version=7.1
```

## npm Package Operations

### Publish npm Package
Configure `.npmrc` with Azure Artifacts registry:
```
registry=https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/npm/registry/
```

Then:
```bash
npm publish --registry https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/npm/registry/
```

### Install npm Package
```bash
npm install @{scope}/mypackage --registry https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/npm/registry/
```

## PyPI Package Operations

### Publish PyPI Package
Configure `setup.py` or use `twine`:
```bash
twine upload -r https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/pypi/simple/ dist/*
```

### Install PyPI Package
```bash
pip install mypackage --index-url https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/pypi/simple/
```

## Maven Package Operations

### Publish Maven Package
Configure `pom.xml`:
```xml
<distributionManagement>
  <repository>
    <id>AzureArtifacts</id>
    <url>https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/maven/v1</url>
  </repository>
</distributionManagement>
```

Then:
```bash
mvn deploy
```

### Consume Maven Package
Configure `pom.xml`:
```xml
<repositories>
  <repository>
    <id>AzureArtifacts</id>
    <url>https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/maven/v1</url>
  </repository>
</repositories>
```

## Universal Packages

Create and manage custom binary packages.

### Create Universal Package
```bash
# Install Universal Package tool
dotnet tool install -g Microsoft.VisualStudio.Services.UniversalPackageTools

# Create and publish
upack pack --name MyPackage --version 1.0.0 --source ./package-contents --target ./
upack push ./MyPackage.1.0.0.upack https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/nuget/v2 --apiKey AzureDevOps
```

### Download Universal Package
```bash
upack download --name MyPackage --version 1.0.0 --source https://pkgs.dev.azure.com/{organization}/{project}/_packaging/{feedName}/nuget/v2 --target ./
```

## Upstream Sources

Link upstream package sources for dependency resolution.

### Add Upstream Source
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?api-version=7.1
Content-Type: application/json

{
  "upstreamSources": [
    {
      "id": "nuget-org",
      "name": "nuget.org",
      "location": "https://api.nuget.org/v3/index.json",
      "upstreamSourceType": "public"
    }
  ]
}
```

### List Upstream Sources
Upstream sources are returned with feed details:
```http
GET https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?getUpstreamSources=true&api-version=7.1
```

## Retention Policies

Manage package retention and cleanup.

### Set Retention Policy
```http
PATCH https://feeds.dev.azure.com/{organization}/_apis/packaging/feeds/{feedId}?api-version=7.1
Content-Type: application/json

{
  "retentionPolicy": {
    "daysToKeepRecentlyDownloadedPackages": 30
  }
}
```

## Best Practices

### Feed Organization
1. Create separate feeds for different projects/teams
2. Use naming conventions (prod, staging, test)
3. Implement promotion workflows
4. Set clear retention policies
5. Document feed purposes
6. Manage permissions by role
7. Monitor feed size and costs

### Package Management
1. Follow semantic versioning (major.minor.patch)
2. Tag pre-release versions clearly (alpha, beta, rc)
3. Document package contents and dependencies
4. Include changelogs
5. Deprecate old versions properly
6. Archive deprecated packages
7. Remove sensitive data before publishing

### Security & Access
1. Use service principals for automation
2. Scope PAT tokens appropriately
3. Restrict feed access by team
4. Audit package downloads
5. Scan packages for vulnerabilities
6. Require code reviews before publishing
7. Use signed packages where possible

### Consumption Best Practices
1. Pin to specific versions in production
2. Use version ranges for development
3. Cache dependencies locally
4. Monitor upstream package updates
5. Test dependency updates
6. Document external dependencies
7. Keep dependencies current

### CI/CD Integration
1. Publish packages from pipelines
2. Build packages during CI
3. Test packages before promotion
4. Automate version numbering
5. Include build metadata in versions
6. Generate package documentation
7. Report on package metrics

### Maintenance & Cleanup
1. Set retention policies
2. Archive old versions
3. Remove broken packages
4. Monitor disk usage
5. Clean up test packages
6. Review access logs
7. Update upstream sources regularly
