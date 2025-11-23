---
name: fine-tuning-data-generator
description: Generates comprehensive synthetic fine-tuning datasets in ChatML format (JSONL) for use with Unsloth, Axolotl, and similar training frameworks. Asks clarifying questions about domain, task type, diversity requirements, and quality standards, then creates balanced, high-quality training examples with system prompts, user inputs, and assistant responses.
version: 1.0
allowed-tools: Read, Write, Edit, Bash
---

# Fine-Tuning Data Generator

This skill generates high-quality synthetic training data in ChatML format for fine-tuning language models using frameworks like Unsloth, Axolotl, or similar tools.

## Workflow

### 1. Gather Requirements

When the user requests fine-tuning data generation, ALWAYS ask these clarifying questions (unless already provided):

#### Essential Questions:
- **Task Type**: What is the model being trained to do? (e.g., customer support, code generation, creative writing, technical Q&A, instruction following, classification, summarization)
- **Domain/Topic**: What specific domain or subject matter? (e.g., legal, medical, e-commerce, software development, finance)
- **Number of Examples**: How many training examples are needed? (Recommend: minimum 100 for simple tasks, 500-1000+ for complex tasks)
- **Output Format**: JSONL with ChatML format (confirm this is correct for their framework)

#### Quality & Diversity Questions:
- **Complexity Range**: Should examples range from simple to complex, or focus on a specific difficulty level?
- **Diversity Requirements**:
  - Should examples cover edge cases, error handling, and unusual scenarios?
  - Do you want variation in query phrasing and response styles?
  - Should examples include multi-turn conversations or single-turn only?
- **Tone/Style**: What tone should the assistant use? (e.g., professional, friendly, concise, detailed, technical)
- **Response Length**: Preferred length for assistant responses? (e.g., brief answers, detailed explanations, step-by-step guides)
- **Special Requirements**:
  - Any specific formats to include? (e.g., code blocks, lists, tables, JSON)
  - Any constraints or forbidden content?
  - Should system prompts be varied or consistent?

#### Dataset Composition Questions:
- **Distribution**: Should examples be evenly distributed across subtopics, or weighted toward specific areas?
- **Include Negatives**: Should the dataset include examples of what NOT to do or incorrect approaches?
- **Validation Split**: Do you need a separate validation set? (Recommend 10-20% of total)

### 2. Create Data Generation Plan

After gathering requirements, present a plan including:
- Number of examples and their distribution across categories
- Key topics/scenarios to cover
- Diversity strategies (phrasing variations, complexity levels, edge cases)
- System prompt approach (single consistent prompt vs. varied prompts)
- Quality assurance approach

**Get user approval before generating.**

### 3. Generate Synthetic Data

Create diverse, high-quality examples following these principles:

#### Quality Standards:
- **Realistic Scenarios**: Examples should reflect real-world use cases
- **Natural Language**: User inputs should sound like actual human queries (varied phrasing, typos optional, different formality levels)
- **Accurate Responses**: Assistant responses should be correct, helpful, and aligned with the desired behavior
- **Consistent Formatting**: Use proper ChatML structure throughout
- **Balanced Difficulty**: Mix of simple and complex examples (unless specified otherwise)
- **Avoid Repetition**: Each example should be meaningfully different
- **Include Edge Cases**: Cover boundary conditions, ambiguous queries, error scenarios

#### Diversity Techniques:
- Vary query phrasing (questions, commands, statements)
- Include different user expertise levels (beginner, intermediate, expert)
- Cover positive and negative examples
- Mix short and long-form responses
- Include multi-step reasoning when appropriate
- Add context variations (different scenarios, parameters, constraints)

#### ChatML Format Structure:

Each example should follow this JSONL structure:

```json
{"messages": [{"role": "system", "content": "System prompt describing the assistant's role and behavior"}, {"role": "user", "content": "User's input or question"}, {"role": "assistant", "content": "Assistant's response"}]}
```

For multi-turn conversations:
```json
{"messages": [{"role": "system", "content": "System prompt"}, {"role": "user", "content": "First user message"}, {"role": "assistant", "content": "First assistant response"}, {"role": "user", "content": "Follow-up user message"}, {"role": "assistant", "content": "Follow-up assistant response"}]}
```

### 4. Organization and Output

#### File Structure:
- **Primary Output**: `training_data.jsonl` (main training set)
- **Optional**: `validation_data.jsonl` (validation/eval set if requested)
- **Metadata**: `dataset_info.txt` (description of dataset composition, statistics)
- **Reference**: See `resources/chatml-format.md` for detailed format specifications

#### Dataset Statistics to Include:
- Total number of examples
- Distribution across categories/topics
- Average user query length
- Average assistant response length
- System prompts used (number of variations)
- Multi-turn vs single-turn ratio

### 5. Validation

After generation:
- Verify JSON formatting is valid
- Check for duplicate or near-duplicate examples
- Confirm diversity across examples
- Validate all required fields are present
- Run validation script: `python scripts/validate_chatml.py training_data.jsonl`

## Examples

### Customer Support Example:
```json
{"messages": [{"role": "system", "content": "You are a helpful customer support agent for an e-commerce platform. Provide clear, friendly assistance to customers."}, {"role": "user", "content": "I ordered a blue sweater but received a red one. What should I do?"}, {"role": "assistant", "content": "I apologize for the mix-up with your order! Here's how we can resolve this:\n\n1. You can initiate a free return through your account under 'My Orders'\n2. Select 'Wrong item received' as the reason\n3. You'll get a prepaid shipping label via email within 24 hours\n4. Once we receive the incorrect item, we'll ship the blue sweater to you immediately\n\nAlternatively, if you'd prefer to keep the red sweater, I can offer you a 20% discount. Would either of these options work for you?"}]}
```

### Code Generation Example:
```json
{"messages": [{"role": "system", "content": "You are an expert Python programmer. Provide clean, efficient, well-documented code solutions."}, {"role": "user", "content": "Write a function to find the longest palindromic substring in a string."}, {"role": "assistant", "content": "Here's an efficient solution using the expand-around-center approach:\n\n```python\ndef longest_palindrome(s: str) -> str:\n    \"\"\"\n    Find the longest palindromic substring.\n    \n    Args:\n        s: Input string\n    \n    Returns:\n        Longest palindromic substring\n    \"\"\"\n    if not s:\n        return \"\"\n    \n    def expand_around_center(left: int, right: int) -> int:\n        while left >= 0 and right < len(s) and s[left] == s[right]:\n            left -= 1\n            right += 1\n        return right - left - 1\n    \n    start = 0\n    max_length = 0\n    \n    for i in range(len(s)):\n        # Check for odd-length palindromes\n        length1 = expand_around_center(i, i)\n        # Check for even-length palindromes\n        length2 = expand_around_center(i, i + 1)\n        \n        length = max(length1, length2)\n        \n        if length > max_length:\n            max_length = length\n            start = i - (length - 1) // 2\n    \n    return s[start:start + max_length]\n```\n\nTime complexity: O(n²), Space complexity: O(1)\n\nExample usage:\n```python\nprint(longest_palindrome(\"babad\"))  # \"bab\" or \"aba\"\nprint(longest_palindrome(\"cbbd\"))   # \"bb\"\n```"}]}
```

## Advanced Features

### Batch Generation Strategy

For large datasets (500+ examples), generate in batches:
- Create 50-100 examples at a time
- Review distribution and diversity after each batch
- Adjust generation strategy based on gaps or over-representation
- Prevents repetition and maintains creativity

### Quality Control Checklist

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

### Common Pitfalls to Avoid

- **Over-templating**: Don't use rigid templates that create repetitive patterns
- **Unrealistic Queries**: Avoid overly formal or robotic user inputs
- **Inconsistent Quality**: Maintain consistent response quality across all examples
- **Narrow Coverage**: Ensure sufficient diversity in scenarios and phrasing
- **JSON Errors**: Always validate JSON formatting
- **Missing Context**: Include necessary context in system prompts
- **Response Mismatch**: Ensure assistant responses actually address user queries

## Integration with Training Frameworks

### Unsloth
This ChatML format is directly compatible with Unsloth's dataset expectations:
```python
from datasets import load_dataset

dataset = load_dataset('json', data_files='training_data.jsonl')
```

### Axolotl
Compatible with Axolotl's chat template format. Use in config:
```yaml
datasets:
  - path: training_data.jsonl
    type: chat_template
```

### General Use
Standard ChatML format works with most modern fine-tuning frameworks that support conversational formats.

## Additional Resources

- `resources/chatml-format.md` - Detailed ChatML format specification
- `resources/examples.md` - Extended examples across various domains
- `templates/generation-plan.md` - Template for creating generation plans
- `scripts/validate_chatml.py` - Validation script for ChatML JSONL files
- `scripts/analyze_dataset.py` - Dataset statistics and analysis tool

## Tips for Best Results

1. **Start Small**: Generate 10-20 examples first, review them, then scale up
2. **Iterate**: Refine generation approach based on initial batch quality
3. **Use Real Data**: If available, use real examples as inspiration (but generate synthetic variations)
4. **Test Early**: Test the dataset with actual training to validate quality
5. **Version Control**: Save different versions as you refine the generation approach
6. **Document Decisions**: Keep track of generation parameters and strategies used

## Output Template

When generation is complete, provide:

```
Generated Fine-Tuning Dataset Summary
=====================================

Files Created:
- training_data.jsonl (X examples)
- validation_data.jsonl (Y examples) [if requested]
- dataset_info.txt (metadata and statistics)

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

Quality Assurance:
✓ JSON validation passed
✓ No duplicate examples found
✓ Diversity check passed
✓ All required fields present

Next Steps:
1. Review sample examples in training_data.jsonl
2. Load dataset into your training framework
3. Adjust hyperparameters based on dataset size
4. Monitor training metrics for quality validation
```
