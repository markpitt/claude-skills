# Common Root Causes by Domain

This reference guide catalogs frequently encountered root causes across different problem domains to help pattern recognition during root cause analysis.

## Software Engineering

### Code Defects

**Logic Errors**
- Off-by-one errors in loops or array indexing
- Incorrect conditional logic (AND vs OR, negation errors)
- Edge case handling missing (null, empty, boundary values)
- Race conditions in concurrent code
- Integer overflow/underflow
- Floating-point precision issues

**Resource Management**
- Memory leaks (unreleased resources)
- Connection pool exhaustion
- File descriptor leaks
- Thread pool exhaustion
- Deadlocks or livelocks

**Data Handling**
- Incorrect data validation
- SQL injection vulnerabilities
- XSS vulnerabilities
- Deserialization errors
- Character encoding issues (UTF-8, ASCII)
- Timezone handling errors

### Configuration Issues

**Environment Mismatches**
- Development vs production configuration differences
- Missing environment variables
- Incorrect feature flags
- Wrong API endpoints or URLs
- Certificate/credential mismatches

**Resource Limits**
- Insufficient memory allocation
- CPU throttling or limits
- Disk space exhaustion
- Network bandwidth limits
- Connection timeout settings too low/high

### Dependencies

**Version Conflicts**
- Incompatible library versions
- Breaking changes in dependencies
- Transitive dependency conflicts
- Missing dependencies

**External Service Failures**
- Third-party API changes
- Authentication/authorization issues
- Rate limiting
- Network connectivity problems
- DNS resolution failures

### Deployment Issues

**Incomplete Rollouts**
- Database migrations not applied
- Configuration not updated
- Cache not invalidated
- CDN not purged
- Partial deployment (some instances old version)

**Rollback Problems**
- Database schema incompatible with old code
- Data migrations irreversible
- Configuration state not restored

### Process Failures

**Testing Gaps**
- Missing test coverage for specific scenarios
- Tests not running in CI/CD
- Test environment differs from production
- Performance testing not conducted
- Integration testing insufficient

**Review Process**
- Code review checklist incomplete
- Security review skipped
- Performance impact not assessed
- Database changes not reviewed by DBA
- No architecture review for major changes

**Communication Breakdowns**
- Requirements misunderstood
- Assumptions not validated
- Changes not communicated to stakeholders
- Documentation outdated
- Tribal knowledge not shared

## Hardware & Equipment

### Mechanical Failures

**Wear and Tear**
- Normal component end-of-life
- Preventive maintenance schedule not followed
- Lubrication insufficient
- Corrosion from environmental exposure
- Fatigue from cyclic loading

**Material Defects**
- Manufacturing defect
- Substandard materials used
- Material degradation (UV, chemical, thermal)
- Contamination during production

**Installation Errors**
- Incorrect assembly
- Improper torque specifications
- Misalignment
- Missing or wrong components
- Inadequate sealing or fastening

### Electrical/Electronic

**Power Issues**
- Voltage spikes or sags
- Insufficient power supply capacity
- Grounding problems
- EMI/RFI interference
- Power supply component failure

**Thermal Problems**
- Inadequate cooling/ventilation
- Thermal cycling stress
- Overheating due to dust/debris
- Ambient temperature outside specifications

**Connection Failures**
- Loose connections
- Corrosion on contacts
- Cable damage or degradation
- Connector wear
- Improper crimping or soldering

### Operational Issues

**Improper Use**
- Operating outside design parameters
- Overloading
- Wrong operating mode
- Inadequate warm-up or cool-down
- Using wrong consumables (fuel, oil, etc.)

**Maintenance Gaps**
- Scheduled maintenance missed
- Wrong maintenance procedures
- Incorrect parts used in repairs
- Inadequate cleaning
- Calibration not performed

## Process & Operations

### Workflow Failures

**Communication**
- Information not reaching the right people
- Handoff documentation incomplete
- Language or terminology barriers
- Conflicting instructions
- Assumptions not verified

**Training**
- Insufficient initial training
- No refresher training
- Undocumented procedures
- Training materials outdated
- Skills gap not identified

**Documentation**
- Procedures not documented
- Documentation not accessible
- Steps unclear or ambiguous
- Documentation not updated
- Version control issues

### Design Flaws

**Process Design**
- Single points of failure
- No error checking/validation steps
- Manual steps prone to error
- No feedback loops
- Conflicting requirements

**Incentive Misalignment**
- Metrics encourage wrong behaviors
- Pressure to cut corners
- Blame culture discourages reporting
- Speed prioritized over quality
- Individual vs team optimization

### Resource Constraints

**Insufficient Capacity**
- Understaffing
- Equipment capacity inadequate
- Budget limitations
- Time pressure
- Competing priorities

**Resource Quality**
- Inadequate tools
- Substandard materials
- Insufficient expertise
- Outdated equipment
- Poor working conditions

## Personal/Life Issues

### Health & Energy

**Physical Health**
- Insufficient sleep
- Poor nutrition
- Lack of exercise
- Undiagnosed medical condition
- Chronic pain or discomfort
- Medication side effects

**Mental Health**
- Chronic stress
- Anxiety or depression
- Burnout
- Cognitive overload
- Emotional exhaustion

### Habits & Behaviors

**Time Management**
- No prioritization system
- Overcommitment
- Procrastination patterns
- Interruption-driven work
- No boundaries between work/life

**Decision Making**
- Analysis paralysis
- Impulsive decisions
- Avoiding difficult choices
- Following others' priorities
- Not saying "no"

### Environment & Context

**Physical Environment**
- Cluttered workspace
- Poor ergonomics
- Noise and distractions
- Inadequate tools/equipment
- Uncomfortable temperature/lighting

**Social Environment**
- Toxic relationships
- Lack of support system
- Negative peer influence
- Isolation
- Communication issues

**Systems & Structure**
- No routines or systems
- Conflicting commitments
- Lack of automation
- No tracking mechanisms
- Poor organization

### Knowledge & Skills

**Information Gaps**
- Missing key information
- Don't know what you don't know
- Misinformation or outdated knowledge
- No access to expertise
- Learning resources unavailable

**Skill Deficits**
- Never learned the skill
- Skill degradation from disuse
- Technology/field evolved
- No opportunity to practice
- Insufficient feedback

## Red Flag "Root Causes" (Go Deeper!)

If your analysis ends with any of these, you haven't reached the root cause yet:

❌ **"Human error"** → Why did the human make that error? What in the system allowed it?

❌ **"User made a mistake"** → Why was the mistake possible? What prevented detection?

❌ **"Someone forgot"** → Why wasn't there a reminder/checklist/automation?

❌ **"Bad luck"** → What made the system vulnerable to this "luck"?

❌ **"It just broke"** → What caused the failure? Why did it fail now?

❌ **"Not enough time"** → Why was time insufficient? What prioritization led to this?

❌ **"Lack of communication"** → What process or tool failure enabled miscommunication?

❌ **"Budget constraints"** → What drove budget allocation? Why was this not funded?

❌ **"That's just how it is"** → What systemic issue perpetuates this?

❌ **"Third-party failure"** → Why are we vulnerable to this failure? What's missing?

## Pattern Recognition

### Recurring Theme: Missing Safeguards

When you see:
- No validation
- No testing
- No monitoring
- No redundancy
- No fallback

**Common root cause:** Process doesn't include defensive measures

### Recurring Theme: Knowledge Gaps

When you see:
- Didn't know
- Assumed
- Misunderstood
- Not documented
- First time

**Common root cause:** Learning/knowledge sharing system failure

### Recurring Theme: Resource/Capacity

When you see:
- Exhausted
- Overwhelmed
- Insufficient
- Too slow
- Overloaded

**Common root cause:** Capacity planning or scaling issue

### Recurring Theme: Change Management

When you see:
- After deployment
- After update
- After migration
- Recent change
- New version

**Common root cause:** Change control or testing process gap

## Using This Reference

1. **During Analysis:** Review relevant categories for ideas
2. **Pattern Matching:** Compare your problem to common causes
3. **Verification:** Check if identified cause matches known patterns
4. **Prevention:** Use to identify similar vulnerabilities in your systems
5. **Training:** Share with teams for collective knowledge

## Contributing to This List

As you encounter new root causes:
1. Document the pattern
2. Categorize appropriately
3. Note distinctive characteristics
4. Share with the team
5. Update this reference

This living document improves with use and sharing.
