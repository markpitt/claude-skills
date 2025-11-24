# Software Debugging Root Cause Analysis Template

## Problem Statement

**Date/Time Discovered:** [YYYY-MM-DD HH:MM UTC]
**Reporter:** [Name/Team]
**Severity:** [Critical/High/Medium/Low]
**Environment:** [Production/Staging/Development]

**Description:**
[What happened? Be specific about the symptom, not the assumed cause]

**Impact:**
- Users affected: [Number/percentage/specific users]
- Systems affected: [Which services/components]
- Business impact: [Revenue, reputation, functionality]

**First Observed:** [When did this start? Any triggering events?]

**Frequency:** [Always/Intermittent/Under specific conditions]

## Evidence Gathered

### Error Messages/Stack Traces
```
[Paste relevant error messages and stack traces]
```

### Logs
```
[Include relevant log entries with timestamps]
```

### Metrics/Monitoring Data
- [CPU usage, memory, latency, error rates, etc.]
- [Include graphs or data points]

### Recent Changes
- [ ] Code deployments: [List with timestamps]
- [ ] Configuration changes: [List with timestamps]
- [ ] Infrastructure changes: [List with timestamps]
- [ ] Dependency updates: [List with timestamps]

### Reproduction Steps
1. [Step 1]
2. [Step 2]
3. [Step 3]
Expected: [What should happen]
Actual: [What actually happens]

### System State
- Code version: [commit hash/version]
- Dependencies: [relevant library versions]
- Environment config: [relevant settings]
- Resource usage: [CPU/memory/disk/network]

## 5 Whys Analysis

**WHY #1:** Why did [the problem] occur?
- **Answer:**
- **Evidence:**
- **Verified by:** [How did you confirm this?]

**WHY #2:** Why did [answer to WHY #1] happen?
- **Answer:**
- **Evidence:**
- **Verified by:**

**WHY #3:** Why did [answer to WHY #2] happen?
- **Answer:**
- **Evidence:**
- **Verified by:**

**WHY #4:** Why did [answer to WHY #3] happen?
- **Answer:**
- **Evidence:**
- **Verified by:**

**WHY #5:** Why did [answer to WHY #4] happen?
- **Answer:**
- **Evidence:**
- **Verified by:**

[Continue if needed...]

## Root Cause Identified

**Root Cause:**
[The deepest actionable cause you identified]

**Category:** [Code Defect/Configuration/Dependencies/Resources/Data/Deployment/Process]

### Verification

**Forward Test:**
[If this root cause exists, would it create the observed problem? Yes/No + explanation]

**Backward Test:**
[If we fix this root cause, will the problem be prevented? Yes/No + explanation]

**Evidence Support:**
[What data/logs/tests support this conclusion?]

**Completeness:**
[Does this explain all instances of the problem? Any outliers?]

## Contributing Factors

[Other factors that made the problem possible or worse, even if not the root cause]

1. [Factor 1]
2. [Factor 2]

## Solutions

### Immediate Fix (Stop the Bleeding)
**Action:** [What to do right now]
**Timeline:** [How quickly]
**Risks:** [Any risks of the quick fix]
**Status:** [ ] Implemented [ ] Verified [ ] Rolled back

### Root Cause Fix (Prevent Recurrence)
**Action:** [Permanent fix for the root cause]
**Implementation plan:** [Steps to implement]
**Timeline:** [Estimated time]
**Testing plan:** [How to verify the fix]
**Status:** [ ] Designed [ ] In Progress [ ] Testing [ ] Deployed

### Systemic Improvements (Strengthen the System)
[Improvements to prevent similar issues in the future]

1. **[Improvement area]:** [Description]
   - Action: [Specific action]
   - Owner: [Who]
   - Timeline: [When]

2. **[Improvement area]:** [Description]
   - Action: [Specific action]
   - Owner: [Who]
   - Timeline: [When]

### Detection/Monitoring Enhancements
[How to catch this earlier or prevent it from reaching production]

- [ ] Add alert for [specific condition]
- [ ] Add test for [scenario]
- [ ] Add monitoring for [metric]
- [ ] Update dashboard to show [indicator]

## Prevention Checklist

What could have prevented this?

- [ ] Better testing: [What type? Unit/Integration/E2E/Performance]
- [ ] Code review focus: [What should reviewers look for?]
- [ ] Monitoring: [What should be monitored?]
- [ ] Documentation: [What should be documented?]
- [ ] Process change: [What process should change?]
- [ ] Tooling: [What tools would help?]
- [ ] Training: [What knowledge gap exists?]

## Lessons Learned

### What Went Well
- [Positive aspects of detection, response, or resolution]

### What Could Be Improved
- [Areas for improvement in process, tools, or skills]

### Knowledge Sharing
- [ ] Document in knowledge base
- [ ] Share in team meeting
- [ ] Update runbooks/playbooks
- [ ] Create/update tests
- [ ] Update coding guidelines

## Timeline

| Time (UTC) | Event | Action Taken |
|------------|-------|--------------|
| [HH:MM] | Problem first occurred | |
| [HH:MM] | Problem detected | |
| [HH:MM] | Investigation started | |
| [HH:MM] | Root cause identified | |
| [HH:MM] | Fix implemented | |
| [HH:MM] | Verification completed | |
| [HH:MM] | Incident closed | |

## Follow-Up

- [ ] Monitor for recurrence (Duration: [timeframe])
- [ ] Verify metrics returned to normal
- [ ] Complete systemic improvements
- [ ] Share lessons learned
- [ ] Update documentation
- [ ] Schedule review of prevention measures

---

**Prepared by:** [Name]
**Reviewed by:** [Name(s)]
**Date:** [YYYY-MM-DD]
