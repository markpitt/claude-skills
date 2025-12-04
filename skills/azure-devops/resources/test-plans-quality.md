# Azure Test Plans - Testing & Quality Management

Azure Test Plans provides test management, test execution, and quality tracking for manual and automated testing scenarios.

## Test Plans

Manage test plan organization and structure.

### List Test Plans
```http
GET /{organization}/{project}/_apis/testplan/plans?api-version=7.1
```

Query options:
- `?$orderBy=name` - Sort by name
- `?$top=50` - Limit results
- `?filterActivePlans=true` - Active plans only

### Get Test Plan
```http
GET /{organization}/{project}/_apis/testplan/plans/{planId}?api-version=7.1
```

### Create Test Plan
```http
POST /{organization}/{project}/_apis/testplan/plans?api-version=7.1
Content-Type: application/json

{
  "name": "Website Regression Testing",
  "description": "Test plan for website functionality",
  "startDate": "2025-01-15T00:00:00Z",
  "endDate": "2025-01-31T23:59:59Z"
}
```

### Update Test Plan
```http
PATCH /{organization}/{project}/_apis/testplan/plans/{planId}?api-version=7.1
Content-Type: application/json

{
  "name": "Updated Plan Name",
  "description": "Updated description",
  "state": "Active"
}
```

## Test Suites

Organize tests into logical suites within plans.

### List Test Suites
```http
GET /{organization}/{project}/_apis/testplan/plans/{planId}/suites?api-version=7.1
```

### Get Test Suite
```http
GET /{organization}/{project}/_apis/testplan/plans/{planId}/suites/{suiteId}?api-version=7.1
```

### Create Test Suite
```http
POST /{organization}/{project}/_apis/testplan/plans/{planId}/suites?api-version=7.1
Content-Type: application/json

{
  "name": "Login Functionality",
  "suiteType": "StaticTestSuite",
  "parentSuite": {
    "id": "{parentSuiteId}"
  }
}
```

Suite types:
- `StaticTestSuite` - Manual suite
- `DynamicTestSuite` - Query-based suite
- `RequirementTestSuite` - Linked to requirements

### Update Test Suite
```http
PATCH /{organization}/{project}/_apis/testplan/plans/{planId}/suites/{suiteId}?api-version=7.1
Content-Type: application/json

{
  "name": "Updated Suite Name",
  "inheritDefaultConfigurations": true
}
```

## Test Cases

Add and manage test cases within suites.

### List Test Cases in Suite
```http
GET /{organization}/{project}/_apis/testplan/plans/{planId}/suites/{suiteId}/testcases?api-version=7.1
```

### Get Test Case
```http
GET /{organization}/{project}/_apis/testplan/plans/{planId}/suites/{suiteId}/testcases/{testCaseId}?api-version=7.1
```

### Add Test Case to Suite
```http
POST /{organization}/{project}/_apis/testplan/plans/{planId}/suites/{suiteId}/testcases?api-version=7.1
Content-Type: application/json

{
  "workItem": {
    "id": "{workItemId}"
  }
}
```

### Create Test Case (as Work Item)
Test cases are work items of type "Test Case":
```http
POST /{organization}/{project}/_apis/wit/workitems/$TestCase?api-version=7.1
Content-Type: application/json-patch+json

[
  {
    "op": "add",
    "path": "/fields/System.Title",
    "value": "Test user login with SSO"
  },
  {
    "op": "add",
    "path": "/fields/System.Description",
    "value": "Verify user can log in using single sign-on"
  },
  {
    "op": "add",
    "path": "/fields/Microsoft.VSTS.TCM.Steps",
    "value": "<steps id='0' last='2'><step id='1' type='ActionStep'><parameterizedString isformatted='true'>1. Navigate to login page</parameterizedString><parameterizedString isformatted='true'>SSO login option displayed</parameterizedString></step><step id='2' type='ActionStep'><parameterizedString isformatted='true'>2. Click SSO button</parameterizedString><parameterizedString isformatted='true'>User logged in successfully</parameterizedString></step></steps>"
  }
]
```

## Test Runs & Results

Manage test execution and result tracking.

### Create Test Run
```http
POST /{organization}/{project}/_apis/test/runs?api-version=7.1
Content-Type: application/json

{
  "name": "Smoke Test Run",
  "automated": false,
  "build": {
    "id": "{buildId}"
  },
  "releaseUri": "vstfs:///ReleaseManagement/Release/1",
  "releaseEnvironmentUri": "vstfs:///ReleaseManagement/Release/1/environments/1",
  "startedDate": "2025-01-15T10:00:00Z",
  "completeDate": "2025-01-15T11:00:00Z",
  "dueDate": "2025-01-15T12:00:00Z",
  "state": "InProgress",
  "planId": "{planId}",
  "isAutomated": false
}
```

### Get Test Runs
```http
GET /{organization}/{project}/_apis/test/runs?api-version=7.1
```

Filter options:
- `?buildIds={buildId}` - By build
- `?automated=true` - Automated tests only
- `?$top=100` - Limit results

### Get Specific Test Run
```http
GET /{organization}/{project}/_apis/test/runs/{runId}?api-version=7.1
```

### Update Test Run
```http
PATCH /{organization}/{project}/_apis/test/runs/{runId}?api-version=7.1
Content-Type: application/json

{
  "state": "Completed",
  "completeDate": "2025-01-15T11:30:00Z"
}
```

Test run states:
- `NotStarted` - Created but not started
- `InProgress` - Currently running
- `Completed` - Finished
- `Aborted` - Stopped before completion
- `NotRelevant` - Not applicable

### Get Test Results
```http
GET /{organization}/{project}/_apis/test/runs/{runId}/results?api-version=7.1
```

### Get Specific Test Result
```http
GET /{organization}/{project}/_apis/test/runs/{runId}/results/{resultId}?api-version=7.1
```

### Add Test Results
```http
POST /{organization}/{project}/_apis/test/runs/{runId}/results?api-version=7.1
Content-Type: application/json

[
  {
    "testCase": {
      "id": "{testCaseId}"
    },
    "outcome": "Passed",
    "startedDate": "2025-01-15T10:00:00Z",
    "completedDate": "2025-01-15T10:05:00Z",
    "durationInMs": 300000,
    "comment": "Test executed successfully"
  }
]
```

### Update Test Results
```http
PATCH /{organization}/{project}/_apis/test/runs/{runId}/results?api-version=7.1
Content-Type: application/json

[
  {
    "id": {resultId},
    "outcome": "Failed",
    "comment": "Assertion failed on line 45",
    "errorMessage": "Expected value was not found"
  }
]
```

Test outcomes:
- `Passed` - Test passed
- `Failed` - Test failed
- `NotExecuted` - Test not run
- `Blocked` - Test blocked
- `NotApplicable` - Not applicable
- `Paused` - Paused
- `InProgress` - Currently executing

## Test Configurations

Manage test configurations (browser, OS, device combinations).

### List Configurations
```http
GET /{organization}/{project}/_apis/testplan/configurations?api-version=7.1
```

### Get Configuration
```http
GET /{organization}/{project}/_apis/testplan/configurations/{configurationId}?api-version=7.1
```

### Create Configuration
```http
POST /{organization}/{project}/_apis/testplan/configurations?api-version=7.1
Content-Type: application/json

{
  "name": "Chrome on Windows 10",
  "description": "Configuration for Chrome browser on Windows 10",
  "values": [
    {
      "configurationVariableId": "{varId1}",
      "value": "Chrome"
    },
    {
      "configurationVariableId": "{varId2}",
      "value": "Windows 10"
    }
  ]
}
```

## Query Test Results

Analyze test execution history and trends.

### Get Test Summary
```http
GET /{organization}/{project}/_apis/test/runs/{runId}/statistics?api-version=7.1
```

Response includes:
- Total tests
- Passed count
- Failed count
- Not executed count

### Get Test Trend
Query results over time:
```http
GET /{organization}/{project}/_apis/test/ResultTrendService/QueryResultTrendForBuild?buildId={buildId}&api-version=7.1-preview
```

## Best Practices

### Test Planning
1. Create comprehensive test plans before development
2. Organize tests logically in suites
3. Link tests to work items/requirements
4. Define clear pass/fail criteria
5. Document test steps explicitly
6. Use configurations for cross-platform testing
7. Keep test data up-to-date

### Test Case Design
1. Write clear, concise test names
2. Break tests into logical steps
3. Include expected results for each step
4. Test one thing per test case
5. Avoid test interdependencies
6. Use parameterized tests for variations
7. Link to requirements/user stories

### Test Execution
1. Run tests on every build
2. Prioritize critical path testing
3. Use configurations for browsers/OS
4. Capture failure details
5. Include environment information
6. Log execution time for performance tracking
7. Archive results for compliance

### Defect Tracking
1. Link failed tests to bugs
2. Include reproduction steps
3. Attach screenshots/logs
4. Document environment details
5. Assign defect priority
6. Track defect resolution
7. Prevent regression with tests

### Continuous Integration
1. Run automated tests in pipeline
2. Fail build on test failures
3. Track test coverage trends
4. Run tests in parallel
5. Cache test data
6. Clean up test runs regularly
7. Generate test reports

### Reporting & Metrics
1. Track pass/fail rates
2. Monitor test coverage
3. Measure bug escape rate
4. Track defect density
5. Calculate test effectiveness
6. Monitor execution time trends
7. Share metrics with stakeholders
