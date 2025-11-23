# Root Cause Analysis Examples

This document contains complete RCA examples across different domains to illustrate the methodologies in practice.

## Example 1: Software Bug (5 Whys)

### Problem Statement
**What:** User authentication fails intermittently with "Invalid token" error
**Where:** Production API, /auth/verify endpoint
**When:** Started November 20, 2024, around 14:00 UTC
**Impact:** ~15% of authentication attempts failing, affecting 500+ users per hour

### Evidence Gathered
- Error logs show "JWT signature verification failed"
- Only affects users authenticated after 14:00 UTC
- Code deployment occurred at 13:45 UTC
- Environment variable `JWT_SECRET` unchanged
- Multiple API instances running (scaled to 5 instances at 13:50 UTC)

### 5 Whys Analysis

**WHY #1:** Why are JWT signature verifications failing?
- **Answer:** Different instances use different signing keys
- **Evidence:** Logged the key fingerprints—2 different values across instances
- **Verified by:** Connected to each instance and checked environment

**WHY #2:** Why do different instances have different signing keys?
- **Answer:** New instances generated a new random secret on startup
- **Evidence:** Code review shows `JWT_SECRET = os.environ.get('JWT_SECRET', generate_random_secret())`
- **Verified by:** Checked application code in auth/config.py:23

**WHY #3:** Why did new instances generate a random secret instead of using the configured one?
- **Answer:** Environment variable JWT_SECRET wasn't set in the container orchestration
- **Evidence:** Kubernetes deployment YAML missing JWT_SECRET in env section
- **Verified by:** Checked deployment.yaml in k8s/production/

**WHY #4:** Why wasn't JWT_SECRET in the deployment configuration?
- **Answer:** When we migrated from Docker Compose to Kubernetes, secrets weren't migrated
- **Evidence:** Docker Compose file has JWT_SECRET, Kubernetes manifests don't
- **Verified by:** Git history shows K8s migration commit didn't include secrets

**WHY #5:** Why weren't secrets migrated during the Kubernetes migration?
- **Answer:** Migration checklist didn't include environment variable audit
- **Evidence:** Migration guide document doesn't mention checking all env vars
- **Verified by:** Reviewed docs/kubernetes-migration.md

### Root Cause
**Migration checklist incomplete—doesn't include environment variable verification**

### Solutions

**Immediate Fix:**
- Manually added JWT_SECRET to Kubernetes secrets and deployment
- Restarted all pods to load the correct secret
- Verified all instances now use same key
- **Status:** ✅ Deployed and verified in 20 minutes

**Root Cause Fix:**
- Update Kubernetes migration checklist to include env var audit
- **Status:** ✅ Completed

**Systemic Improvements:**
1. **Pre-deployment validation:** Add startup check that fails if critical env vars missing
   - Implementation: auth/config.py validates all required vars or exits
   - **Status:** ✅ Implemented

2. **Configuration parity tests:** CI/CD checks Docker Compose and K8s configs match
   - Implementation: Script compares env vars across config files
   - **Status:** ✅ Added to CI pipeline

3. **Monitoring:** Alert if multiple instances have different key fingerprints
   - Implementation: Health check endpoint reports key fingerprint, monitor checks consistency
   - **Status:** 🔄 In progress

### Lessons Learned
- Migration checklists are critical and must be comprehensive
- Fallback defaults (random secret generation) can mask configuration problems
- Multi-instance deployments need consistency validation
- Early detection (startup validation) prevents runtime failures

---

## Example 2: Car Maintenance (5 Whys)

### Problem Statement
**What:** Car engine overheating
**Where:** 2018 Honda Civic, occurred during highway driving
**When:** Started last week, happens after 30 minutes of driving
**Impact:** Unsafe to drive, risk of engine damage

### Evidence Gathered
- Temperature gauge rises to red zone after 30 min
- Coolant level appears normal when cold
- No visible leaks under the car
- Recent oil change 2 weeks ago
- No warning lights before overheating started

### 5 Whys Analysis

**WHY #1:** Why is the engine overheating?
- **Answer:** Coolant isn't circulating properly
- **Evidence:** Lower radiator hose stays cool while upper hose gets very hot
- **Verified by:** Touched both hoses (carefully) while engine running

**WHY #2:** Why isn't coolant circulating properly?
- **Answer:** Water pump isn't functioning
- **Evidence:** Removed belt and tested pump—no resistance when spinning pulley
- **Verified by:** Mechanic inspection confirmed internal pump failure

**WHY #3:** Why did the water pump fail?
- **Answer:** Pump bearings seized due to contaminated coolant
- **Evidence:** Drained coolant—looks rusty and contains debris
- **Verified by:** Coolant test shows high contamination, wrong type mixed in

**WHY #4:** Why was the coolant contaminated with the wrong type?
- **Answer:** During recent oil change, shop topped off coolant with wrong type
- **Evidence:** Receipt shows "fluids topped off," shop confirmed they used universal coolant mixed with OEM coolant
- **Verified by:** Called shop, they acknowledged mixing coolant types

**WHY #5:** Why did the shop use the wrong coolant type?
- **Answer:** Shop policy is to use universal coolant for all vehicles to save costs
- **Evidence:** Shop manager confirmed this is standard practice
- **Verified by:** Discussion with shop manager

### Root Cause
**Shop's cost-saving policy of using universal coolant instead of manufacturer-specified coolant, which led to chemical incompatibility and contamination**

### Solutions

**Immediate Fix:**
- Replaced water pump
- Flushed entire cooling system
- Filled with correct Honda OEM coolant
- **Status:** ✅ Completed, car running normally

**Root Cause Fix:**
- Switch to a shop that uses manufacturer-specified fluids
- **Status:** ✅ Found new shop with better practices

**Preventive Measures:**
1. **Service verification:** Always verify fluids used match manufacturer specs
2. **Regular inspection:** Check coolant condition during oil changes
3. **Documentation:** Keep records of all fluids used and brands
4. **Awareness:** Learned that "universal" doesn't mean "compatible with anything"

### Lessons Learned
- Cheap service can be expensive in the long run
- Trust but verify—even reputable shops make poor choices
- Manufacturer specifications exist for good reasons
- Small maintenance decisions can have large consequences

---

## Example 3: Production System Failure (Fishbone + 5 Whys)

### Problem Statement
**What:** E-commerce site experiencing 60% increase in checkout failures
**Where:** Production payment processing service
**When:** Started Friday 3 PM, coinciding with Black Friday traffic spike
**Impact:** ~$50K revenue loss per hour, customer complaints surging

### Fishbone Analysis

**METHODS/PROCESS:**
- Retry logic insufficient
- Error handling incomplete
- Circuit breaker not implemented

**MACHINES/EQUIPMENT:**
- Payment gateway API
- Database connection pool
- Load balancer configuration

**MATERIALS/INPUTS:**
- Traffic volume (3x normal)
- Payment data validation
- Third-party API responses

**MEASUREMENTS/MONITORING:**
- Limited observability into payment flow
- No alerting on payment gateway errors
- Missing SLA monitoring

**MANPOWER:**
- On-call engineer unfamiliar with payment code
- Payment processor contact info outdated
- No runbook for payment failures

**ENVIRONMENT:**
- Black Friday traffic surge
- Third-party payment gateway under load
- Database experiencing high connection count

### Top Candidates from Fishbone
1. Database connection pool exhausted (Equipment)
2. Payment gateway timeout during high load (Environment + Measurement)
3. No circuit breaker causing retry storms (Methods)

### 5 Whys Analysis (for top candidate)

**WHY #1:** Why are payment requests failing?
- **Answer:** Payment service timing out waiting for database responses
- **Evidence:** Logs show "connection timeout" errors, P95 latency 30s (normally <1s)
- **Verified by:** Database monitoring shows all connections in use

**WHY #2:** Why is the database connection pool exhausted?
- **Answer:** Payment queries are taking 30+ seconds instead of <1 second
- **Evidence:** Query logs show full table scans on `transactions` table
- **Verified by:** EXPLAIN shows query not using indexes

**WHY #3:** Why is the query doing full table scans?
- **Answer:** New query joins on `customer_id` but column isn't indexed
- **Evidence:** Schema shows index on `transaction_id` but not `customer_id`
- **Verified by:** Checked database schema and query plan

**WHY #4:** Why was the query added without an index?
- **Answer:** Recent feature added customer transaction history, didn't anticipate load
- **Evidence:** Git history shows feature added Nov 15, tested with <1000 records
- **Verified by:** Code review of commit ab3c92f, load tests done with small dataset

**WHY #5:** Why didn't load testing catch this?
- **Answer:** Load tests use synthetic data (1000 customers), production has 500K+ customers
- **Evidence:** Load test configuration shows DATA_SIZE=small
- **Verified by:** Reviewed CI/CD test configuration

### Root Cause
**Load testing performed with non-representative dataset size, failing to identify performance issues that manifest only at production scale**

### Solutions

**Immediate Fix (5:30 PM):**
- Added index on `transactions.customer_id`
- Increased connection pool from 20 to 50
- Restarted payment service instances
- **Result:** Failure rate dropped to <1%, latency normalized

**Root Cause Fix:**
1. **Production-scale load testing:**
   - Update load tests to use production-representative data volumes
   - Test with 1M+ customer records
   - **Status:** ✅ Implemented

2. **Query performance review:**
   - Add database query analysis to code review checklist
   - Require EXPLAIN plans for new queries
   - **Status:** ✅ Added to PR template

**Systemic Improvements:**
1. **Observability:**
   - Add query performance monitoring
   - Alert on slow queries (>1s)
   - Dashboard showing connection pool utilization
   - **Status:** ✅ Deployed

2. **Resilience:**
   - Implement circuit breaker for database calls
   - Add graceful degradation (show cached transaction history)
   - **Status:** 🔄 In progress

3. **Capacity planning:**
   - Regular review of query performance as data grows
   - Automated index suggestions based on query patterns
   - **Status:** 📋 Planned

### Lessons Learned
- Load tests must use production-representative data volumes
- Performance characteristics change non-linearly with scale
- Circuit breakers are essential for preventing cascade failures
- Observability gaps delayed identification by 2+ hours
- Business events (Black Friday) are high-risk deployment periods

---

## Example 4: Personal Productivity (Fishbone + 5 Whys)

### Problem Statement
**What:** Consistently missing project deadlines despite working long hours
**Where:** Work projects and personal goals
**When:** Ongoing for 3+ months
**Impact:** Stress, poor work quality, work-life imbalance, reputation damage

### Fishbone Analysis

**PHYSICAL:**
- Sleeping 5-6 hours (need 7-8)
- Skipping meals
- No exercise routine
- Afternoon energy crashes

**MENTAL:**
- Difficulty focusing for >30 minutes
- Decision fatigue by mid-day
- Anxiety about deadlines
- Procrastination on difficult tasks

**SOCIAL:**
- Saying yes to every request
- Helping others at expense of own work
- Checking Slack constantly
- Unscheduled interruptions

**ENVIRONMENTAL:**
- Open office environment (noisy)
- Notifications always on
- Cluttered workspace
- No designated deep work time

**RESOURCES:**
- Calendar overbooked
- No time for planning
- Limited tools for task management
- Unclear priorities from management

**HABITS:**
- Multitasking constantly
- No morning routine
- Working on whatever seems urgent
- Not blocking time for focused work
- Checking email first thing

### Top Candidates from Fishbone
1. No protected time for focused work (Resources + Environment)
2. Saying yes to every request (Social + Habits)
3. Poor sleep affecting focus and decision-making (Physical + Mental)

### 5 Whys Analysis (for top candidate)

**WHY #1:** Why am I missing deadlines?
- **Answer:** Not making meaningful progress on important projects
- **Evidence:** Time tracking shows <2 hours/day on priority projects
- **Verified by:** Reviewed last 2 weeks of time logs

**WHY #2:** Why am I only spending 2 hours/day on priority projects?
- **Answer:** Constantly interrupted by meetings, messages, and requests
- **Evidence:** Calendar shows 25+ meetings/week, Slack shows 100+ messages/day
- **Verified by:** Counted calendar events and Slack analytics

**WHY #3:** Why do I accept so many meetings and requests?
- **Answer:** Don't want to disappoint people or seem unhelpful
- **Evidence:** Journal entries show guilt when saying no, people-pleasing pattern
- **Verified by:** Self-reflection and discussion with therapist

**WHY #4:** Why is saying no associated with guilt?
- **Answer:** Belief that my value comes from being available and helpful
- **Evidence:** Identified pattern of self-worth tied to others' approval
- **Verified by:** Therapy sessions revealed this core belief

**WHY #5:** Why do I tie self-worth to being available for others?
- **Answer:** Learned pattern from childhood—approval came from being helpful
- **Evidence:** Family dynamics rewarded being the "helpful one"
- **Verified by:** Therapy exploration of family patterns

### Root Cause
**Core belief that self-worth depends on availability and helping others, leading to inability to protect time for own priorities**

### Solutions

**Immediate Changes:**
1. **Calendar blocking:**
   - Blocked 9-11 AM daily for deep work (no meetings)
   - Set Slack to DND during deep work blocks
   - **Status:** ✅ Implemented, following for 3 weeks

2. **Response templates:**
   - Created polite ways to say no or defer
   - "I'm at capacity but can help next week"
   - **Status:** ✅ Using regularly

**Root Cause Work:**
1. **Therapy:**
   - Working on separating self-worth from productivity/helping
   - Building healthier boundaries
   - **Status:** 🔄 Ongoing

2. **Values clarification:**
   - Identified core values beyond being helpful
   - Using values to prioritize decisions
   - **Status:** 🔄 In progress

**Systemic Changes:**
1. **Weekly planning:**
   - Sunday evening: review priorities for week
   - Identify top 3 must-do items
   - **Status:** ✅ Habit established

2. **Communication:**
   - Discussed boundaries with manager
   - Got explicit permission to decline certain requests
   - **Status:** ✅ Completed

3. **Health foundations:**
   - Sleep: 7 hours minimum, tracked
   - Exercise: 3x/week scheduled
   - **Status:** ✅ Following for 1 month

### Results After 6 Weeks
- Deep work time increased from 2 hrs/day to 5 hrs/day
- Met last 4 deadlines successfully
- Sleep improved to 7+ hours
- Reduced stress and anxiety
- Better work quality with focused time

### Lessons Learned
- Personal issues often have deep psychological roots
- Systemic change requires both external (calendar) and internal (beliefs) work
- Saying no is a skill that can be learned
- Self-awareness is the first step to change
- Small habit changes compound over time

---

## Key Takeaways Across Examples

### Common Patterns

1. **Cascade Effects:**
   - Small issues (wrong coolant, missing index) cascade to large problems
   - Prevention at the earliest point is most effective

2. **Process Gaps:**
   - Missing checklists, incomplete tests, inadequate review
   - Process improvements prevent entire classes of problems

3. **Measurement Matters:**
   - What gets measured gets managed
   - Observability gaps delay problem identification

4. **Root Causes Are Often Systemic:**
   - Not just technical failures but process, culture, beliefs
   - Sustainable fixes require system-level changes

### Methodology Selection

- **Simple/linear problems:** 5 Whys is fast and effective
- **Complex/unclear problems:** Fishbone first to explore, then 5 Whys to drill down
- **Multiple concurrent issues:** Pareto analysis to prioritize
- **High-stakes problems:** Multiple methods + formal documentation

### Documentation Value

All examples show value of:
- Clear problem statements
- Evidence-based reasoning
- Verification of assumptions
- Systematic solution implementation
- Lessons learned capture

## Using These Examples

1. **Learning:** Study the methodology application
2. **Templates:** Use as starting points for your own RCA
3. **Pattern matching:** Compare your problems to these examples
4. **Teaching:** Share with team to build RCA skills
5. **Reference:** Consult when conducting your own analyses

Each problem domain has unique characteristics, but the systematic approach applies universally.
