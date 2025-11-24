---
name: root-cause-analysis
description: Conducts systematic root cause analysis using proven methodologies including Toyota's 5 Whys, Ishikawa fishbone diagrams, Pareto analysis, and fault tree analysis. Use when investigating bugs, debugging code, troubleshooting systems, diagnosing equipment failures, analyzing life problems, or identifying underlying causes of any issue across software engineering, hardware maintenance, process failures, or personal challenges.
version: 1.0
---

# Root Cause Analysis Skill

This skill helps you systematically identify the root cause of any problem using proven methodologies from the Toyota Production System and other industry-standard techniques.

## When to Use This Skill

Use this skill when you need to:
- Debug software issues and identify underlying causes
- Troubleshoot system failures or performance problems
- Diagnose equipment or vehicle maintenance issues
- Analyze process failures or inefficiencies
- Investigate incidents or recurring problems
- Solve personal or life challenges systematically
- Prevent problems from recurring by addressing root causes

## Core Principle

**Do not treat symptoms—find and fix the root cause.** As Taiichi Ohno, architect of the Toyota Production System, said: "By repeating why five times, the nature of the problem as well as its solution becomes clear."

## RCA Methodologies

### 1. The 5 Whys (Primary Method)

The 5 Whys is the foundation of systematic root cause analysis, developed by Sakichi Toyoda for the Toyota Production System.

**Process:**
1. State the problem clearly
2. Ask "Why did this happen?" and answer with facts
3. For each answer, ask "Why?" again
4. Continue until you reach the root cause (usually 5 iterations)
5. Verify the root cause leads back to the problem

**Key Principles:**
- **Go and See**: Base answers on direct observation, not assumptions
- **Data Validation**: Support each cause-effect link with evidence
- **People Over Blame**: Focus on process failures, not individual fault
- **Actionable Root Cause**: Stop when you reach a cause you can fix

**Example (Software Bug):**
```
Problem: Production API is returning 500 errors

Why #1: Why is the API returning 500 errors?
→ The database connection pool is exhausted

Why #2: Why is the connection pool exhausted?
→ Connections are not being released after queries

Why #3: Why aren't connections being released?
→ The connection timeout is set too high and queries are hanging

Why #4: Why are queries hanging?
→ A recent code change added an unindexed query on a large table

Why #5: Why was the unindexed query added?
→ Code review process doesn't include database performance checks

Root Cause: Missing database performance validation in code review
Solution: Add DB query analysis to CI/CD pipeline and update review checklist
```

### 2. Fishbone Diagram (Ishikawa)

Created by Kaoru Ishikawa, this visual tool organizes potential causes into categories for comprehensive analysis.

**Structure:**
```
                    Methods          Machines
                      /                 /
                     /                 /
        ___________/_________________/__________ PROBLEM/EFFECT
                   \                 \
                    \                 \
                  Materials      Measurements
                  (+ Manpower, Mother Nature/Environment)
```

**The 6 M's Categories:**
- **Manpower/People**: Skills, training, staffing, communication
- **Methods/Process**: Procedures, workflows, documentation
- **Machines/Equipment**: Tools, hardware, software systems
- **Materials**: Inputs, dependencies, data quality
- **Measurements**: Metrics, monitoring, detection
- **Mother Nature/Environment**: External factors, conditions, context

**When to Use:**
- Complex problems with multiple potential causes
- Brainstorming sessions with teams
- Problems where category analysis adds clarity

**Process:**
1. Draw the fishbone with the problem at the head
2. Add category branches (6 M's or custom)
3. Brainstorm causes for each category
4. Add sub-causes as smaller bones
5. Identify most likely root causes for investigation
6. Use 5 Whys to drill deeper into top candidates

### 3. Pareto Analysis (80/20 Rule)

Prioritize problems by identifying which causes contribute most to the effect.

**Process:**
1. List all potential causes
2. Measure or estimate the frequency/impact of each
3. Sort by impact (highest to lowest)
4. Calculate cumulative percentage
5. Focus on the vital few (typically 20% of causes = 80% of problems)

**When to Use:**
- Multiple problems competing for attention
- Need to prioritize limited resources
- Data-driven decision making

### 4. Fault Tree Analysis

Top-down deductive approach using Boolean logic to analyze failure modes.

**When to Use:**
- Safety-critical systems
- High-cost failures
- Complex systems with multiple failure paths
- Regulatory or compliance requirements

### 5. Barrier Analysis

Examines what controls failed to prevent or detect the problem.

**Questions:**
- What barriers existed to prevent this problem?
- Which barriers failed?
- Why did they fail?
- What barriers were missing?

## Structured RCA Process

### Phase 1: Define the Problem

**Create a clear problem statement:**
- **What** happened? (Observable symptom)
- **Where** did it happen? (Location, system, component)
- **When** did it happen? (Timeline, frequency, pattern)
- **Impact**: What is affected? How severe?

**Good Problem Statement:**
"Users in the EU region experience 3-5 second delays when loading the dashboard during peak hours (9-11 AM UTC), affecting approximately 2,000 daily active users. This started on November 18th after the v2.4 deployment."

**Poor Problem Statement:**
"The app is slow."

### Phase 2: Gather Evidence

Follow the Toyota "Go and See" principle—collect facts, not opinions.

**Evidence to Collect:**
- Logs, metrics, and monitoring data
- Timeline of events
- Recent changes (code, configuration, environment)
- Environmental factors
- User reports and reproduction steps
- System state before/during/after the problem

**Tools:**
- For software: logs, traces, profiling data, error reports
- For hardware: sensor data, maintenance records, inspection results
- For processes: documentation, workflow records, timestamps
- For personal issues: journal entries, timelines, patterns

### Phase 3: Apply RCA Methodology

**Choose your approach:**

| Problem Type | Recommended Method | Why |
|--------------|-------------------|-----|
| Single clear failure | 5 Whys | Fast, focused, iterative |
| Complex/unknown causes | Fishbone → 5 Whys | Comprehensive brainstorming then drill down |
| Multiple concurrent issues | Pareto → 5 Whys | Prioritize impact first |
| Safety/high-stakes | Fault Tree Analysis | Rigorous, formal analysis |
| Process breakdown | Barrier Analysis | Identifies control failures |

**Conduct the analysis:**
- Use the selected methodology systematically
- Document each step and the reasoning
- Validate assumptions with evidence
- Involve relevant stakeholders or experts
- Consider multiple perspectives

### Phase 4: Verify the Root Cause

**Test your conclusion:**

1. **Forward Test**: If this root cause occurred, would it create the observed problem?
2. **Backward Test**: Does eliminating this root cause prevent the problem?
3. **Evidence Test**: Do we have data supporting this causal chain?
4. **Scope Test**: Does this explain all instances of the problem?

**Red Flags (Not a Root Cause):**
- "Human error" (dig deeper into why the error occurred)
- "Bad luck" (identify the underlying vulnerability)
- Can't be controlled or influenced
- Doesn't clearly lead to the observed problem
- Blames individuals rather than systems

### Phase 5: Develop Solutions

**Solution Criteria:**
- Addresses the root cause, not symptoms
- Preventive, not just corrective
- Feasible and actionable
- Measurable effectiveness
- Considers side effects

**Types of Solutions:**
- **Eliminate**: Remove the root cause entirely
- **Control**: Add safeguards to prevent occurrence
- **Detect**: Improve monitoring to catch early
- **Mitigate**: Reduce impact when it occurs

**Create an action plan:**
- Immediate fixes (stop the bleeding)
- Root cause fixes (prevent recurrence)
- Systemic improvements (strengthen the system)
- Monitoring (verify effectiveness)

### Phase 6: Implement and Verify

**Implementation:**
1. Execute the solution
2. Monitor for side effects
3. Measure effectiveness
4. Document the fix and lessons learned
5. Share knowledge to prevent similar issues

**Follow-up:**
- Has the problem recurred?
- Did the solution have unexpected consequences?
- What did we learn for future problems?

## Domain-Specific Guidance

### Software Debugging

**Common Root Cause Categories:**
- Code defects (logic errors, race conditions, null handling)
- Configuration issues (environment differences, missing settings)
- Dependencies (library versions, API changes, breaking changes)
- Resource constraints (memory, CPU, connections, disk space)
- Data issues (invalid inputs, edge cases, data corruption)
- Deployment problems (incomplete rollout, migration failures)

**5 Whys Focus Areas:**
- Why did the code allow this condition?
- Why wasn't this caught in testing?
- Why didn't monitoring detect it earlier?
- Why didn't the code review catch it?
- Why doesn't our process prevent this class of error?

### Hardware/Vehicle Maintenance

**Fishbone Categories (Custom for Mechanical):**
- **Design**: Engineering flaws, tolerances, specifications
- **Materials**: Quality, wear, fatigue, corrosion
- **Assembly**: Installation errors, alignment, torque
- **Operation**: Usage patterns, load, stress
- **Maintenance**: Schedules, procedures, parts quality
- **Environment**: Temperature, humidity, contamination

**5 Whys Example (Car Won't Start):**
```
Why #1: Why won't the car start?
→ Battery voltage is too low

Why #2: Why is the battery voltage low?
→ Battery wasn't charging while driving

Why #3: Why wasn't the battery charging?
→ Alternator belt is broken

Why #4: Why did the alternator belt break?
→ Belt was worn beyond service life

Why #5: Why was the belt not replaced?
→ Regular maintenance schedule wasn't followed

Root Cause: Lack of preventive maintenance adherence
Solution: Implement maintenance tracking and reminders
```

### Process/System Failures

**Barrier Analysis Questions:**
- What steps should have prevented this?
- Which checkpoints failed?
- Why did reviews/approvals not catch it?
- What documentation was missing or ignored?

**Focus on:**
- Communication breakdowns
- Missing procedures
- Inadequate training
- Poorly designed workflows
- Conflicting incentives

### Life/Personal Problems

**Adapted Fishbone Categories:**
- **Physical**: Health, energy, sleep, exercise
- **Mental**: Stress, focus, decision-making, emotions
- **Social**: Relationships, support, communication
- **Environmental**: Living space, work environment, routine
- **Resources**: Time, money, tools, information
- **Habits**: Patterns, behaviors, decisions

**5 Whys for Personal Issues:**
- Focus on patterns, not isolated incidents
- Look for systemic causes (habits, environment)
- Identify controllable factors
- Be honest and non-judgmental
- Consider external vs. internal factors

## Best Practices

### Do's
✓ Base analysis on facts and evidence, not assumptions
✓ Use "Go and See"—observe the problem directly
✓ Focus on process and system failures, not blame
✓ Document the analysis for future reference
✓ Verify root causes before implementing solutions
✓ Involve people with direct knowledge of the problem
✓ Consider multiple perspectives and hypotheses
✓ Stop when you reach an actionable root cause
✓ Share learnings to prevent similar issues

### Don'ts
✗ Don't stop at symptoms or proximate causes
✗ Don't accept "human error" as a root cause
✗ Don't skip evidence gathering
✗ Don't blame individuals—fix systems
✗ Don't implement solutions without verification
✗ Don't rush to solutions before understanding causes
✗ Don't ignore contradictory evidence
✗ Don't forget to follow up on effectiveness

## Templates

### 5 Whys Template

```
PROBLEM STATEMENT:
[Clear description of what, where, when, impact]

WHY #1: Why did [problem] occur?
Answer: [Evidence-based answer]
Supporting Evidence: [Data, logs, observations]

WHY #2: Why did [answer #1] occur?
Answer: [Evidence-based answer]
Supporting Evidence: [Data, logs, observations]

WHY #3: Why did [answer #2] occur?
Answer: [Evidence-based answer]
Supporting Evidence: [Data, logs, observations]

WHY #4: Why did [answer #3] occur?
Answer: [Evidence-based answer]
Supporting Evidence: [Data, logs, observations]

WHY #5: Why did [answer #4] occur?
Answer: [Evidence-based answer]
Supporting Evidence: [Data, logs, observations]

ROOT CAUSE:
[The deepest actionable cause identified]

VERIFICATION:
- Forward test: [Would this cause create the problem?]
- Backward test: [Would fixing this prevent the problem?]
- Evidence: [What supports this conclusion?]

SOLUTION:
- Immediate: [Stop the current problem]
- Root cause fix: [Prevent recurrence]
- Systemic: [Strengthen the system]
- Monitoring: [Detect if it recurs]
```

### Fishbone Template

```
PROBLEM/EFFECT: [The problem to analyze]

MANPOWER/PEOPLE:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

METHODS/PROCESS:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

MACHINES/EQUIPMENT:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

MATERIALS/INPUTS:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

MEASUREMENTS/MONITORING:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

ENVIRONMENT:
- [Potential cause]
  - [Sub-cause]
- [Potential cause]

TOP CANDIDATES FOR ROOT CAUSE:
1. [Most likely cause based on analysis]
2. [Second most likely cause]
3. [Third most likely cause]

NEXT STEPS:
[Apply 5 Whys to top candidates]
```

## How This Skill Works

When you request root cause analysis:

1. **I'll ask clarifying questions** to understand:
   - The problem domain (software, hardware, process, personal)
   - What you've already observed
   - Available evidence and data
   - Time constraints and urgency

2. **I'll recommend an approach** based on:
   - Problem complexity
   - Available information
   - Domain and context
   - Your goals (quick fix vs. deep analysis)

3. **I'll guide you through the process**:
   - Help craft a clear problem statement
   - Identify evidence to gather
   - Apply the appropriate methodology
   - Ask probing questions to dig deeper
   - Verify conclusions before solutions
   - Develop actionable solutions

4. **I'll deliver structured output**:
   - Documented analysis
   - Clear root cause identification
   - Prioritized solutions
   - Implementation recommendations
   - Prevention strategies

## Example Interaction Flows

### Quick Debugging Session
```
User: "My Python script crashes with a KeyError"
Skill: [Applies 5 Whys focused on code/data]
Outcome: Root cause + fix in minutes
```

### Complex System Failure
```
User: "Our production system has degraded performance"
Skill: [Starts with Fishbone to explore categories]
      → [Identifies top 3 likely causes]
      → [Applies 5 Whys to each]
      → [Verifies with data]
Outcome: Comprehensive analysis with prioritized solutions
```

### Personal Problem
```
User: "I'm constantly behind on my work"
Skill: [Uses adapted Fishbone for life categories]
      → [Identifies patterns]
      → [Applies 5 Whys to habits/environment]
Outcome: Actionable insights into systemic causes
```

## Continuous Improvement

After solving the immediate problem, consider:

1. **Pattern Recognition**: Is this part of a larger pattern?
2. **Process Improvement**: How can we prevent this class of problems?
3. **Knowledge Sharing**: Who else should learn from this?
4. **Monitoring Enhancement**: Can we detect this earlier next time?
5. **Documentation**: Is the solution captured for the future?

This embodies the Toyota Way philosophy of continuous improvement (Kaizen).

---

**Remember**: The goal isn't to ask "Why?" exactly five times—it's to keep asking until you reach a root cause you can actually fix. Sometimes that's three whys, sometimes it's seven. The number matters less than the discipline of systematic investigation.
