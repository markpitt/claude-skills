# Dataset Strategy & Planning

## Gathering Requirements

### Essential Questions

When a user requests fine-tuning data generation, gather these requirements:

#### Task Definition
- **Task Type**: What is the model being trained to do?
  - Examples: customer support, code generation, creative writing, technical Q&A, instruction following, classification, summarization
- **Domain/Topic**: What specific domain or subject matter?
  - Examples: legal, medical, e-commerce, software development, finance
- **Number of Examples**: How many training examples are needed?
  - Recommendation: minimum 100 for simple tasks, 500-1000+ for complex tasks

#### Quality & Diversity
- **Complexity Range**: Simple to complex mix, or focus on specific difficulty level?
- **Diversity Requirements**:
  - Edge cases, error handling, unusual scenarios?
  - Variation in query phrasing and response styles?
  - Multi-turn conversations or single-turn only?
- **Tone/Style**: What tone should the assistant use?
  - Examples: professional, friendly, concise, detailed, technical
- **Response Length**: Preferred length for assistant responses?
  - Examples: brief answers, detailed explanations, step-by-step guides
- **Special Formats**: Specific formats to include?
  - Examples: code blocks, lists, tables, JSON

#### Dataset Composition
- **Distribution**: Evenly distributed across subtopics or weighted toward specific areas?
- **Include Negatives**: Examples of what NOT to do or incorrect approaches?
- **Validation Split**: Need separate validation set? (Recommend 10-20% of total)

### Creating a Generation Plan

After gathering requirements, present a comprehensive plan:

**Plan Components:**
- Number of examples and distribution across categories
- Key topics/scenarios to cover
- Diversity strategies (phrasing variations, complexity levels, edge cases)
- System prompt approach (consistent vs. varied)
- Quality assurance approach

**Get user approval before generating.**

## Generation Principles

### Quality Standards

- **Realistic Scenarios**: Reflect real-world use cases
- **Natural Language**: Varied phrasing, different formality levels, human-like queries
- **Accurate Responses**: Correct, helpful, aligned with desired behavior
- **Consistent Formatting**: Proper ChatML structure throughout
- **Balanced Difficulty**: Mix of simple and complex (unless specified)
- **Avoid Repetition**: Each example meaningfully different
- **Include Edge Cases**: Boundary conditions, ambiguous queries, error scenarios

### Diversity Techniques

- Vary query phrasing (questions, commands, statements)
- Include different user expertise levels (beginner, intermediate, expert)
- Cover positive and negative examples
- Mix short and long-form responses
- Include multi-step reasoning when appropriate
- Add context variations (different scenarios, parameters, constraints)

## Batch Generation Strategy

For large datasets (500+ examples):
- Generate 50-100 examples at a time
- Review distribution and diversity after each batch
- Adjust generation strategy based on gaps or over-representation
- Prevents repetition and maintains creativity

## Quality Control Checklist

Before delivering the dataset:

- [ ] All examples are valid JSON
- [ ] No duplicate or near-duplicate examples
- [ ] System prompts are appropriate and consistent (or intentionally varied)
- [ ] User queries are natural and realistic
- [ ] Assistant responses are accurate and helpful
- [ ] Distribution across categories is balanced (or as specified)
- [ ] Edge cases and error scenarios are included
- [ ] Multi-turn examples flow naturally
- [ ] Dataset statistics are documented
- [ ] Validation script passes

## Common Pitfalls to Avoid

- **Over-templating**: Rigid templates create repetitive patterns
- **Unrealistic Queries**: Overly formal or robotic user inputs
- **Inconsistent Quality**: Maintain consistent response quality
- **Narrow Coverage**: Ensure sufficient diversity in scenarios
- **JSON Errors**: Always validate JSON formatting
- **Missing Context**: Include necessary context in system prompts
- **Response Mismatch**: Ensure responses actually address queries

## Dataset Size Recommendations

| Task Complexity | Recommended Size | Notes |
|---|---|---|
| Simple tasks | 100-500 | Well-defined, limited variation |
| Medium tasks | 500-2,000 | Multiple scenarios, moderate complexity |
| Complex tasks | 2,000-10,000+ | Many edge cases, high variability |
| Domain adaptation | 1,000-5,000 | Specialized knowledge required |

**Quality > Quantity**: Better to have 500 diverse, high-quality examples than 5,000 repetitive ones.

## Tips for Best Results

1. **Start Small**: Generate 10-20 examples first, review, then scale
2. **Iterate**: Refine generation approach based on initial batch
3. **Use Real Data**: If available, use real examples as inspiration (generate synthetic variations)
4. **Test Early**: Test dataset with actual training to validate quality
5. **Version Control**: Save different versions as you refine approach
6. **Document Decisions**: Keep track of generation parameters and strategies

## Output Organization

### File Structure

- **Primary Output**: `training_data.jsonl` (main training set)
- **Optional**: `validation_data.jsonl` (eval set if requested)
- **Metadata**: `dataset_info.txt` (composition, statistics)

### Dataset Statistics to Include

- Total number of examples
- Distribution across categories/topics
- Average user query length
- Average assistant response length
- System prompts used (number of variations)
- Multi-turn vs single-turn ratio
- Estimated token counts

### Dataset Info Template

```
Generated Fine-Tuning Dataset Summary
=====================================

Files Created:
- training_data.jsonl (X examples)
- validation_data.jsonl (Y examples) [if requested]
- dataset_info.txt (metadata)

Dataset Statistics:
- Total training examples: X
- Total validation examples: Y
- Average user query length: Z tokens
- Average assistant response length: W tokens
- System prompts: [number] variation(s)
- Multi-turn conversations: N%
- Single-turn conversations: M%

Category Distribution:
- Category 1: X examples (Y%)
- Category 2: X examples (Y%)
- ...

Next Steps:
1. Review sample examples in training_data.jsonl
2. Load dataset into training framework
3. Adjust hyperparameters based on dataset size
4. Monitor training metrics
```
