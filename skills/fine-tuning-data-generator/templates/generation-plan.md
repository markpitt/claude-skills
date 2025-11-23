# Fine-Tuning Data Generation Plan

## Project Overview
- **Task Type**: [e.g., customer support, code generation, Q&A]
- **Domain**: [e.g., e-commerce, healthcare, finance]
- **Total Examples**: [number]
- **Training/Validation Split**: [e.g., 80/20]

## Dataset Composition

### Categories and Distribution
| Category | Count | Percentage | Description |
|----------|-------|------------|-------------|
| [Category 1] | [#] | [%] | [Brief description] |
| [Category 2] | [#] | [%] | [Brief description] |
| [Category 3] | [#] | [%] | [Brief description] |
| **Total** | **[#]** | **100%** | |

### Complexity Breakdown
- **Simple/Basic**: [#] examples ([%])
  - Description: [What qualifies as simple]
- **Medium**: [#] examples ([%])
  - Description: [What qualifies as medium]
- **Complex/Advanced**: [#] examples ([%])
  - Description: [What qualifies as complex]

## Content Strategy

### System Prompt Approach
- [ ] Single consistent system prompt across all examples
- [ ] Multiple system prompts (specify variations below)

**System Prompt(s)**:
```
[Insert system prompt(s) here]
```

### User Query Characteristics
- **Phrasing Variations**: [How queries will be varied]
- **Formality Levels**: [Formal, casual, technical, etc.]
- **Query Types**: [Questions, commands, statements, etc.]
- **Length Range**: [Short: X tokens, Long: Y tokens]

### Assistant Response Characteristics
- **Tone**: [Professional, friendly, technical, etc.]
- **Style**: [Concise, detailed, step-by-step, etc.]
- **Average Length**: [X-Y tokens]
- **Special Formatting**: [Code blocks, lists, tables, JSON, etc.]

## Diversity Requirements

### Scenario Coverage
- [ ] Common/expected scenarios
- [ ] Edge cases
- [ ] Error handling situations
- [ ] Multi-step interactions
- [ ] Ambiguous queries
- [ ] Follow-up questions

### Variation Strategies
1. **Phrasing**: [Strategy for varying how users ask things]
2. **Context**: [Different scenarios/settings for same topic]
3. **Expertise Levels**: [Beginner, intermediate, expert users]
4. **Response Depth**: [When to be brief vs. detailed]

## Quality Standards

### Required Qualities
- [ ] Factually accurate responses
- [ ] Natural, realistic user queries
- [ ] Appropriate response length for query
- [ ] Consistent formatting
- [ ] Proper grammar and spelling
- [ ] No repetitive patterns
- [ ] Diverse vocabulary

### Validation Criteria
- [ ] JSON validity
- [ ] No duplicate examples
- [ ] All required fields present
- [ ] System/user/assistant roles correct
- [ ] Content appropriate for domain
- [ ] Responses actually address queries

## Example Breakdown by Category

### Category 1: [Name]
**Sample Topics**:
- [Topic 1]
- [Topic 2]
- [Topic 3]

**Example Query Types**:
- [Example query type 1]
- [Example query type 2]

**Expected Response Pattern**:
- [Description of how responses should look]

---

### Category 2: [Name]
**Sample Topics**:
- [Topic 1]
- [Topic 2]
- [Topic 3]

**Example Query Types**:
- [Example query type 1]
- [Example query type 2]

**Expected Response Pattern**:
- [Description of how responses should look]

---

## Edge Cases and Special Scenarios

### Edge Cases to Include ([#] examples)
1. [Edge case 1]: [Description]
2. [Edge case 2]: [Description]
3. [Edge case 3]: [Description]

### Error Scenarios ([#] examples)
1. [Error scenario 1]: [How to handle]
2. [Error scenario 2]: [How to handle]

### Multi-Turn Conversations ([#] examples)
- [Description of conversation flow types to include]

## Generation Approach

### Batch Strategy
- **Batch Size**: [#] examples per batch
- **Batches**: [#] total batches
- **Review Points**: After each batch

### Iteration Plan
1. Generate first batch ([#] examples)
2. Review for quality and diversity
3. Adjust approach based on findings
4. Generate subsequent batches
5. Final validation and deduplication

## Output Files

- `training_data.jsonl` - [#] examples
- `validation_data.jsonl` - [#] examples (optional)
- `dataset_info.txt` - Metadata and statistics
- `generation_notes.md` - Process notes and decisions (optional)

## Success Metrics

- [ ] Target number of examples reached
- [ ] No duplicate examples
- [ ] Distribution matches plan
- [ ] All quality criteria met
- [ ] JSON validation passes
- [ ] Diversity check passes

## Timeline

- **Planning**: [Completed]
- **First Batch**: [Status]
- **Subsequent Batches**: [Status]
- **Review & Refinement**: [Status]
- **Final Validation**: [Status]
- **Delivery**: [Status]

## Notes and Considerations

[Any additional notes, special requirements, or considerations for this dataset]

---

**Plan Status**: [ ] Draft [ ] Approved [ ] In Progress [ ] Complete
**Last Updated**: [Date]
