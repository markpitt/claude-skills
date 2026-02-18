# Workflow Patterns for Skills

Five proven patterns for MCP-enhanced and automated workflow skills. These emerged from early adopters and internal teams—use them as starting points, not rigid templates.

---

## Pattern 1: Sequential Workflow Orchestration

**Use when:** Users need multi-step processes executed in a specific order with dependencies between steps.

```markdown
## Workflow: Onboard New Customer

### Step 1: Create Account
Call MCP tool: `create_customer`
Parameters: name, email, company

### Step 2: Setup Payment
Call MCP tool: `setup_payment_method`
Wait for: payment method verification

### Step 3: Create Subscription
Call MCP tool: `create_subscription`
Parameters: plan_id, customer_id (from Step 1)

### Step 4: Send Welcome Email
Call MCP tool: `send_email`
Template: welcome_email_template
```

**Key techniques:**
- Explicit step ordering with numbered steps
- Document dependencies between steps (e.g., "customer_id from Step 1")
- Validation at each stage before proceeding
- Rollback instructions for failures

---

## Pattern 2: Multi-MCP Coordination

**Use when:** Workflows span multiple services and data must flow between them.

**Example: Design-to-development handoff**

```markdown
## Phase 1: Design Export (Figma MCP)
1. Export design assets from Figma
2. Generate design specifications
3. Create asset manifest

## Phase 2: Asset Storage (Drive MCP)
1. Create project folder in Drive
2. Upload all assets
3. Generate shareable links

## Phase 3: Task Creation (Linear MCP)
1. Create development tasks
2. Attach asset links to tasks
3. Assign to engineering team

## Phase 4: Notification (Slack MCP)
1. Post handoff summary to #engineering
2. Include asset links and task references
```

**Key techniques:**
- Clear phase separation by service
- Explicit data passing between MCPs (store IDs/links from each phase)
- Validate outputs before moving to next phase
- Centralized error handling with clear recovery steps

---

## Pattern 3: Iterative Refinement

**Use when:** Output quality improves with multiple rounds of generation and validation.

**Example: Report generation**

```markdown
## Iterative Report Creation

### Initial Draft
1. Fetch data via MCP
2. Generate first draft report
3. Save to temporary file

### Quality Check
1. Run validation script: `scripts/check_report.py`
2. Identify issues:
   - Missing sections
   - Inconsistent formatting
   - Data validation errors

### Refinement Loop
1. Address each identified issue
2. Regenerate affected sections
3. Re-validate
4. Repeat until quality threshold met

### Finalization
1. Apply final formatting
2. Generate summary
3. Save final version
```

**Key techniques:**
- Explicit quality criteria defined upfront
- Validation scripts for objective checks
- Clear stopping condition (quality threshold, max iterations)
- Separate draft storage from final output

---

## Pattern 4: Context-Aware Tool Selection

**Use when:** The same outcome is achieved with different tools depending on input type, size, or context.

**Example: Smart file storage**

```markdown
## Smart File Storage

### Decision Tree
1. Check file type and size
2. Determine best storage location:
   - Large files (>10MB): Use cloud storage MCP
   - Collaborative docs: Use Notion/Docs MCP
   - Code files: Use GitHub MCP
   - Temporary files: Use local storage

### Execute Storage
Based on decision:
- Call the appropriate MCP tool
- Apply service-specific metadata
- Generate access link

### Provide Context to User
Explain which storage was chosen and why
```

**Key techniques:**
- Clear, unambiguous decision criteria
- Fallback options for each branch
- Transparency about choices made
- Consistent output format regardless of path taken

---

## Pattern 5: Domain-Specific Intelligence

**Use when:** The skill's value is specialized knowledge embedded in logic, not just tool access.

**Example: Payment processing with compliance**

```markdown
## Payment Processing with Compliance

### Before Processing (Compliance Check)
1. Fetch transaction details via MCP
2. Apply compliance rules:
   - Check sanctions lists
   - Verify jurisdiction allowances
   - Assess risk level
3. Document compliance decision

### Processing
IF compliance passed:
  - Call payment processing MCP tool
  - Apply appropriate fraud checks
  - Process transaction
ELSE:
  - Flag for review
  - Create compliance case

### Audit Trail
- Log all compliance checks
- Record processing decisions
- Generate audit report
```

**Key techniques:**
- Domain expertise is embedded in the decision logic, not just in the prompt
- Compliance/validation happens *before* action
- Comprehensive documentation and audit trails
- Clear governance for failure/exception cases
- Store domain rules in `references/` for easy updating (e.g., `references/compliance-rules.md`)

---

## Choosing a Pattern

| Situation | Recommended Pattern |
|---|---|
| Fixed sequence of dependent steps | Sequential Orchestration |
| Workflow touches Notion + Linear + Slack | Multi-MCP Coordination |
| Quality improves with retries | Iterative Refinement |
| Different tools for different inputs | Context-Aware Tool Selection |
| Business rules / compliance logic | Domain-Specific Intelligence |

Most real-world skills combine two or more patterns. Start with the dominant pattern for your primary workflow, then layer in others as needed.
