# Pattern Combination Examples

This document provides detailed examples of how to chain and combine thinking patterns for complex problem-solving. Each example demonstrates the orchestration process from task analysis through execution.

> **Related Resources**: 
> - For pattern definitions, see: `foundational-patterns.md`, `reasoning-patterns.md`, `creative-patterns.md`, `metacognitive-patterns.md`, `specialized-patterns.md`
> - For neurodivergent patterns: `neurodivergent-strengths.md`
> - For orchestration guidance: Main `SKILL.md`

## Example 1: Debugging a Complex Software Issue

### Task Analysis
- **Type**: Analytical, Exploratory
- **Complexity**: High (multiple interconnected components)
- **Optimal Patterns**: Sequential → Analytical → Abductive → Systems

### Pattern Chain Execution

**Phase 1: Sequential Thinking**
```
1. Reproduce the error
2. Identify error message/symptoms
3. Trace execution flow
4. Identify where behavior diverges from expected
```

**Phase 2: Analytical Thinking**
```
Break down the system:
- Component A: User input handler
- Component B: Data processor
- Component C: Output renderer
- Examine each component's state at failure point
```

**Phase 3: Abductive Reasoning**
```
Observations:
- Error occurs only with specific input patterns
- Data processor shows unexpected intermediate state
- No errors in logs before failure

Hypotheses:
1. Input validation missing edge case
2. Race condition in data processor
3. State corruption from previous operation

Best explanation: Edge case in input validation allows invalid data through,
which data processor can't handle
```

**Phase 4: Systems Thinking**
```
Understand system context:
- Why did validation miss this case?
- What are the feedback loops?
- How do components interact?
- Could fixing this break something else?

Insight: Validation was written before processor was updated.
System lacks feedback loop to ensure validation covers all processor requirements.
```

**Outcome**: Not only fix the immediate bug, but identify systemic issue (validation-processor sync) and implement solution.

---

## Example 2: Developing a New Product Feature

### Task Analysis
- **Type**: Creative, Strategic, User-Centered
- **Complexity**: High (ambiguous requirements, multiple stakeholders)
- **Optimal Patterns**: Design Thinking → Divergent → Convergent → Systems

### Pattern Chain Execution

**Phase 1: Design Thinking - Empathize & Define**
```
Empathize:
- User interviews reveal frustration with current workflow
- Users want faster access to frequently-used items
- Concern about cluttering interface

Define:
"How might we provide quick access to frequent items without adding interface complexity?"
```

**Phase 2: Divergent Thinking - Ideate**
```
Generate many possibilities (suspend judgment):
- Floating action button with recent items
- Customizable quick-access toolbar
- Keyboard shortcuts for top 10 items
- AI-predicted next item popup
- Swipe gestures for frequent actions
- Voice command activation
- Smart menu that learns usage patterns
- Favorites star system
- Recently-used dropdown
- Context-aware suggestions
- (20+ more ideas generated...)
```

**Phase 3: Convergent Thinking - Select**
```
Apply criteria:
- Must not clutter interface
- Should handle variable user needs
- Technically feasible in timeframe
- Fits existing design language

Narrow to top 3:
1. Smart menu that learns usage patterns
2. Customizable quick-access toolbar
3. Context-aware suggestions

Select: Smart menu (best balance of all criteria)
```

**Phase 4: Systems Thinking - Implementation Planning**
```
Consider system implications:
- How does this interact with existing menus?
- What data do we need to collect? (privacy implications?)
- How does this affect performance?
- What happens on new user accounts?
- How do we handle edge cases (all items equal frequency)?
- What's the feedback loop for improvement?

Implementation approach:
- Default to recent items for new users
- Gradually shift to learned patterns
- Provide manual customization option
- Clear privacy policy for data collection
- Performance: calculate patterns server-side, cache locally
```

**Phase 5: Design Thinking - Prototype & Test**
```
Build low-fidelity prototype
Test with 5 users
Iterate based on feedback
```

**Outcome**: Feature that solves user problem while maintaining interface simplicity and system integrity.

---

## Example 3: Learning from a Failed Project

### Task Analysis
- **Type**: Reflective, Learning
- **Complexity**: Medium (requires honest self-assessment)
- **Optimal Patterns**: Reflective → Double-Loop → Metacognitive

### Pattern Chain Execution

**Phase 1: Reflective Thinking**
```
Describe:
Project aimed to deliver X by date Y.
Delivered 3 weeks late with reduced scope.
Team morale was low.

Analyze what happened:
- Underestimated complexity
- Scope creep mid-project
- Communication breakdowns between teams
- Technical debt from rushed early work

Evaluate:
What went well: Team eventually delivered working product, learned new technology
What went poorly: Timeline, team morale, technical quality
```

**Phase 2: Double-Loop Learning**
```
Single-loop questions (process):
- How can we estimate better?
- How can we prevent scope creep?
- How can we improve communication?

Double-loop questions (assumptions):
- Why did we commit to aggressive timeline? (Assumption: speed impresses stakeholders)
- Why did we accept scope changes? (Assumption: saying no damages relationships)
- Why did we rush early work? (Assumption: visible progress more important than quality)

Test assumptions:
- Do stakeholders actually value speed over reliability?
- Would clear boundaries damage or improve relationships?
- Does rushed visible progress lead to better outcomes?

Findings:
- Stakeholders prefer realistic timelines to missed deadlines
- Clear boundaries respected, not resented
- Technical debt from rushing cost more time than it saved

Modified approach:
- Provide realistic estimates with buffers
- Establish change control process
- Prioritize sustainable pace over visible progress
```

**Phase 3: Metacognitive Thinking**
```
Examine my own thinking:
- Why did I believe aggressive timeline was necessary?
  → Fear of appearing uncommitted or slow
- Why did I not question scope changes?
  → Wanted to be seen as flexible and accommodating
- Why did I not speak up about rushed work?
  → Assumed others knew better

Patterns I notice:
- I prioritize others' perceptions over practical reality
- I make assumptions about what others want without asking
- I defer to authority even when I have concerns

Strategies for improvement:
- Practice stating realistic assessments confidently
- Ask stakeholders directly about priorities
- Voice concerns early with proposed solutions
- Monitor tendency to people-please vs. deliver value
```

**Outcome**: Not just process improvements, but deep shift in assumptions and self-awareness for future projects.

---

## Example 4: Innovative Solution to Resource Constraints

### Task Analysis
- **Type**: Creative, Strategic, Innovation
- **Complexity**: High (significant constraints, requires breakthrough)
- **Optimal Patterns**: First Principles → Lateral → Design Thinking

### Pattern Chain Execution

**Problem Statement**:
"We need to serve 10x more users but budget only allows 2x infrastructure increase."

**Phase 1: First Principles Thinking**
```
Current approach: Each user request requires full server computation

Break down to fundamentals:
- What are we actually trying to accomplish?
  → Deliver personalized content to users
- What are the true requirements?
  → Content must be relevant, timely, and accurate
- What assumptions are we making?
  → Each request requires fresh computation
  → All users need real-time personalization
  → Server must do all processing

Question each assumption:
- Do we really need fresh computation each time?
  → No, many requests are similar
- Do all users need real-time?
  → No, some content can be slightly stale
- Must server do all processing?
  → No, client devices are capable
```

**Phase 2: Lateral Thinking**
```
Challenge dominant thinking pattern:
Current: "How do we get more servers?"

Provocations:
- What if we had no servers?
- What if we only had one server?
- What if computation was free but bandwidth wasn't?
- What if old content was better than new?

Explore unexpected angle:
"What if we only had one server?" leads to...
- Must cache aggressively
- Must predict common requests
- Must pre-compute popular queries
- Must distribute workload temporally
```

**Phase 3: Design Thinking - Reimagine Approach**
```
Empathize with users:
- Do they need instant real-time? → Usually no, sub-second is fine
- Do they repeat similar requests? → Yes, high overlap
- What do they really value? → Reliability and speed

Ideate solutions:
- Aggressive caching of common requests
- Pre-computation of likely queries
- Client-side processing where possible
- Progressive enhancement: fast basic → enhanced later
- Edge caching for geographic distribution

Prototype:
- 80% requests served from cache (minimal server load)
- 15% requests use pre-computed results (light server load)
- 5% requests require full computation (heavy server load)
- Client devices handle personalization of cached results
```

**Phase 4: Systems Thinking - Integration**
```
Consider system implications:
- Cache invalidation strategy
- How to identify "common" requests?
- Graceful degradation if cache fails
- Monitoring and adaptation
- Edge case handling

Implementation:
- Machine learning to predict common requests
- Multi-tier caching (memory, disk, edge)
- Client-side personalization using cached base data
- Monitoring to identify emerging patterns
- Automatic scaling of cache vs. computation based on load
```

**Outcome**: Serve 10x users with only 1.5x infrastructure by completely reimagining the approach from first principles.

---

## Example 5: Understanding a Complex Research Paper

### Task Analysis
- **Type**: Analytical, Integrative, Learning
- **Complexity**: High (dense technical content, novel concepts)
- **Optimal Patterns**: Sequential → Analytical → Analogical → Systems → Metacognitive

### Pattern Chain Execution

**Phase 1: Sequential Reading**
```
1. Read abstract
2. Read introduction
3. Examine figures and tables
4. Read methodology
5. Read results
6. Read discussion
7. Read conclusion
```

**Phase 2: Analytical Thinking**
```
Break down the paper:
- Core claim: X
- Evidence presented: Y₁, Y₂, Y₃
- Methodology: Z
- Assumptions: A₁, A₂
- Limitations acknowledged: L₁, L₂

Examine each component:
- Is evidence sufficient for claim?
- Is methodology sound?
- Are assumptions reasonable?
- What limitations aren't acknowledged?
```

**Phase 3: Analogical Reasoning**
```
Find familiar analogue:
- This paper's approach is similar to [previous work I understand]
- The core mechanism is like [familiar concept from different domain]
- The methodology resembles [technique I know]

Map correspondences:
- Their novel technique X ≈ established technique Y
- But adapted for context Z
- The key difference is W

Transfer understanding:
- If Y works because of reason R
- Then X should work because of adapted reason R'
```

**Phase 4: Systems Thinking**
```
Understand in broader context:
- How does this fit into the field?
- What prior work does it build on?
- What are the implications?
- How does it interact with related concepts?
- What feedback loops or emergent properties arise?

Integration:
- This resolves tension between approaches A and B
- But creates new question about C
- Enables future work on D
- Has implications for practical application E
```

**Phase 5: Metacognitive Monitoring**
```
Check my understanding:
- Can I explain the core idea to someone else?
- Can I predict what the authors would say about scenario X?
- What am I still confused about?
- What questions should I investigate further?

Self-assessment:
- Strong understanding: Core mechanism, main results
- Moderate understanding: Methodology details
- Weak understanding: Some mathematical derivations
- Action: Review mathematical appendix, consult supplementary materials
```

**Outcome**: Deep, integrated understanding of paper, clear sense of what I know and don't know, ability to apply concepts.

---

## Example 6: Spatial Design Problem (Leveraging Neurodivergent Patterns)

### Task Analysis
- **Type**: Spatial, Creative, Optimization
- **Complexity**: Medium-High (3D constraints, multiple objectives)
- **Optimal Patterns**: Spatial/Visual (Dyslexia) → Systems → Constraint-Based

### Pattern Chain Execution

**Problem**: Design layout for small office (500 sq ft) to accommodate 6 people, meeting space, and storage while maintaining openness and natural light.

**Phase 1: Spatial/Visual Thinking**
```
Mental visualization:
- Picture the space in 3D
- Mentally "walk through" the space
- Visualize different configurations
- Rotate and manipulate mental model
- Notice spatial relationships and flow
- Identify where natural light enters

Generate spatial solutions:
- Configuration A: Desks along perimeter, meeting in center
- Configuration B: Clustered desk pods, meeting in corner
- Configuration C: Linear desk arrangement, meeting near window
- (Rapidly iterate through mental models)

Visual pattern recognition:
- Configuration A blocks light to interior
- Configuration B creates traffic flow problems
- Configuration C maximizes light while enabling collaboration
```

**Phase 2: Systems Thinking**
```
Consider interactions:
- How do people move through space?
- Where are traffic patterns?
- How does sound travel?
- How does light diffuse?
- What are the feedback loops?
  → Cramped → people leave → empty desks → space underutilized
  → Open → people stay → noise → people leave

Balance competing needs:
- Collaboration ↔ Quiet focus
- Openness ↔ Privacy
- Natural light ↔ Glare control
- Flexibility ↔ Permanence

Emergent properties:
- Certain arrangements encourage impromptu collaboration
- Others create natural quiet zones
- Layout affects team cohesion
```

**Phase 3: Constraint-Based Optimization**
```
Hard constraints:
- 500 sq ft total (immutable)
- 6 desks minimum (requirement)
- Meeting space for 4-6 people
- Fire code egress requirements
- Window locations (fixed)

Soft constraints (optimize):
- Maximize natural light distribution
- Minimize noise interference
- Maximize flexibility
- Optimize storage accessibility

Work within constraints creatively:
- Use transparent partitions (maintain light + add acoustic separation)
- Modular furniture (flexibility)
- Wall-mounted storage (preserve floor space)
- Multi-function meeting table (can separate into desk space)
- Strategic placement of sound-absorbing materials

Final design emerges from constraint optimization:
- Linear desk arrangement along non-window wall
- Meeting area near window (best light, not constant use)
- Transparent partition provides acoustic separation without blocking light
- Rolling storage units double as space dividers
- Results in 15% more usable space than traditional layout
```

**Outcome**: Optimized spatial design that satisfies all requirements and feels more spacious than square footage suggests, leveraging visual-spatial thinking strength.

---

## Example 7: Data Analysis with ADHD and Autism Patterns

### Task Analysis
- **Type**: Analytical, Pattern Recognition
- **Complexity**: High (large dataset, unclear patterns)
- **Optimal Patterns**: Big-Picture (ADHD) → Detail-Oriented (Autism) → Analytical → Inductive

### Pattern Chain Execution

**Problem**: Analyze customer behavior data to identify opportunities for improvement.

**Phase 1: Big-Picture Thinking (ADHD)**
```
Zoom out to widest view:
- What are the major themes in this data?
- What stands out at overview level?
- What's the overall story?

High-level observations:
- Customer engagement peaks Tuesday-Thursday
- Sharp drop-off at specific point in user journey
- Two distinct customer clusters emerging
- Geographic patterns visible
- Seasonal trends present

Strategic insights:
- Focus on the sharp drop-off point (biggest impact opportunity)
- Understand the two clusters (may need different approaches)
- Consider day-of-week in marketing timing
```

**Phase 2: Detail-Oriented Pattern Recognition (Autism)**
```
Systematic deep examination:
- Examine drop-off point with precision
- Look at every field in the data
- Notice subtle patterns others might miss

Detailed findings:
- Drop-off occurs specifically at step 3 of 5
- Not uniform: varies by customer segment
- Correlation with specific browser types
- Time-on-page before drop-off: exactly 47 seconds (median)
- Small subset completes in <20 seconds (no drop-off)
- Error logs show validation message appears at ~45 seconds
- Pattern: validation message → 2 second delay → 90% abandon

Precision discovery:
- The validation message has a 2-second timeout
- Message is unclear ("Error 203")
- Fast completers don't trigger validation
- Slow completers get frustrated by vague error
```

**Phase 3: Analytical Thinking**
```
Break down the mechanism:
- Step 3 has complex validation
- Validation runs client-side
- Timeout is arbitrary (default setting)
- Error message not user-friendly
- No recovery guidance provided

Component analysis:
- Validation logic: Actually correct
- Timeout: Too short for mobile users
- Error messaging: Technical, not user-focused
- UX: No inline validation, only on submit
```

**Phase 4: Inductive Reasoning**
```
From specific observations to general principle:
- Observation: Users abandon when they get vague errors after waiting
- Observation: Fast users succeed, slow users fail
- Observation: Mobile users disproportionately affected
- Observation: No correlation with data validity (valid data still errors)

General principle:
"Users abandon when they invest time but receive unclear negative feedback on a process that feels arbitrary."

Broader application:
- This pattern likely exists elsewhere in our product
- Audit all timeout-based validations
- Review all error messaging
- Consider progressive validation vs. submit-time validation
```

**Outcome**:
- Immediate fix: Remove timeout, improve error message, add inline validation
- Strategic insight: Systematic review of all user feedback mechanisms
- Big win from combining ADHD big-picture (found the drop-off) with autistic detail-orientation (found the exact cause)

---

## Example 8: Parallel Pattern Application for Comprehensive Analysis

### Task Analysis
- **Type**: Complex Decision
- **Complexity**: Very High (multiple stakeholders, high stakes, uncertainty)
- **Optimal Patterns**: System 1 + System 2 + Analytical + Holistic (Parallel)

### Pattern Chain Execution

**Problem**: Should we pivot product strategy or double down on current approach?

**Simultaneous Application of Multiple Patterns:**

**System 1 (Intuitive) Thread:**
```
Gut check:
- Something feels off about current trajectory
- Market seems to be shifting
- Team energy is low
- Competition is moving faster than we are

Pattern matching:
- This feels similar to [previous situation where we pivoted]
- Market dynamics resemble [historical pattern]
- Team behavior reminds me of [other project that struggled]

Immediate intuition: Lean toward pivot, but need rigorous analysis
```

**System 2 (Analytical) Thread:**
```
Deliberate analysis:
- Gather all relevant data
- Define clear decision criteria
- Evaluate options systematically
- Consider long-term implications
- Run financial models
- Assess risks quantitatively

Findings:
- Current trajectory: 60% chance of moderate success
- Pivot option A: 30% chance of high success, 40% chance of failure
- Pivot option B: 50% chance of moderate success, lower variance
```

**Analytical Decomposition Thread:**
```
Break down the decision:
- Market factors: [analysis]
- Financial factors: [analysis]
- Team factors: [analysis]
- Competitive factors: [analysis]
- Technical factors: [analysis]

Each component examined independently
```

**Holistic/Gestalt Thread:**
```
View as complete picture:
- How do all factors interact?
- What's the overall pattern?
- What does this look like when viewed as whole?
- What's the narrative arc?

Holistic insight:
- Parts suggest pivot
- But whole picture shows momentum could shift with targeted changes
- Current approach isn't fundamentally wrong, execution is
```

**Integration of All Threads:**
```
System 1 said: Something's off, consider pivot
System 2 said: Pivot is risky, current approach has better expected value
Analytical said: Multiple components show issues
Holistic said: The pieces can work together better

Synthesis:
- Don't pivot product
- Do pivot execution approach
- Address specific component issues
- Maintain strategic direction but change tactics
- Monitor closely and set decision points for future pivot consideration

This combines:
- Intuitive warning (System 1)
- Rigorous analysis (System 2)
- Component understanding (Analytical)
- Emergent pattern recognition (Holistic)
```

**Outcome**: Decision that leverages multiple thinking modes simultaneously, more robust than any single approach.

---

## Key Principles for Pattern Combination

### 1. Match Patterns to Task Phase
Different phases of problem-solving benefit from different patterns:
- **Understanding**: Analytical, Systems, Holistic
- **Ideation**: Divergent, Lateral, Associative
- **Selection**: Convergent, Critical, Constraint-Based
- **Learning**: Reflective, Metacognitive, Double-Loop

### 2. Chain Complementary Patterns
Some patterns naturally feed into others:
- **Divergent → Convergent**: Generate then select
- **Analytical → Systems**: Understand parts then whole
- **Abductive → Deductive**: Hypothesis then test
- **Reflective → Metacognitive**: Experience then thinking process

### 3. Use Parallel Patterns for Complex Problems
Multiple simultaneous perspectives reveal more:
- **System 1 + System 2**: Intuition validates analysis
- **Analytical + Holistic**: Parts and whole together
- **Big-Picture + Detail-Oriented**: Strategy and precision

### 4. Leverage Neurodivergent Strengths Intentionally
Don't forget these valuable patterns:
- **Hyperfocus**: For deep work on engaging problems
- **Big-Picture**: For strategy and overview
- **Detail-Oriented**: For precision and pattern finding
- **Spatial/Visual**: For spatial problems and visualization
- **Non-Linear Associative**: For creative breakthroughs

### 5. Stay Flexible
If a pattern isn't working:
- Switch patterns mid-process
- Add a complementary pattern
- Try a completely different approach
- Chain to a new pattern

### 6. Validate Before Finalizing
Always include validation step:
- Did I solve the right problem?
- Is the solution complete?
- Does it make logical sense?
- Could another pattern have been better?

---

## Pattern Selection Decision Tree

```
Is problem well-defined?
├─ Yes → Start with Analytical, Sequential, or Deductive
└─ No → Start with Divergent, Abductive, or Design Thinking

Does problem involve complex system?
├─ Yes → Include Systems Thinking
└─ No → Stay focused on direct analysis

Is creativity/innovation needed?
├─ Yes → Use Divergent → Lateral → Convergent chain
└─ No → Use more structured analytical patterns

Is this a learning opportunity?
├─ Yes → Add Reflective → Double-Loop → Metacognitive
└─ No → Focus on solution delivery

Could neurodivergent patterns add value?
├─ Spatial problem → Consider Visual/Spatial thinking
├─ Need precision → Consider Detail-Oriented
├─ Need strategy → Consider Big-Picture
├─ Engaging deep work → Consider Hyperfocus
└─ Creative breakthrough → Consider Non-Linear Associative

Is decision high-stakes?
├─ Yes → Use System 2 + Critical + Counterfactual
└─ No → System 1 may suffice

Multiple valid approaches?
└─ Use Parallel Patterns for comprehensive view
```

---

These examples demonstrate that the most powerful problem-solving often comes from thoughtful orchestration of multiple thinking patterns rather than relying on a single approach.
