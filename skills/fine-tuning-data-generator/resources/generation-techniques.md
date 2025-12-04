# Data Generation Techniques

## Generation Methods

### Diverse Scenario Generation

Create variety by generating across multiple dimensions:

#### 1. Query Phrasing Variations
- **Questions**: Direct questions, rhetorical questions
- **Commands**: Imperative statements, requests
- **Statements**: Declarative with embedded request
- **Mixed**: Combine multiple forms in longer queries

Example variations for the same task:
```
Q: How do I reverse a string in Python?
C: Write code to reverse a string in Python
S: I'm working with strings and need to reverse them. What's the best approach?
```

#### 2. User Expertise Levels
- **Beginner**: Simple concepts, basic syntax, no assumed knowledge
- **Intermediate**: Familiar with fundamentals, wants efficiency
- **Expert**: Looking for advanced techniques, edge cases, performance

Example variations:
```
Beginner: What is a list in Python?
Intermediate: What's the difference between list and tuple?
Expert: When should I use tuple unpacking vs. destructuring, and what are the performance implications?
```

#### 3. Context Variations
- **Minimal Context**: Just the core request
- **Rich Context**: Include constraints, parameters, examples
- **Error Context**: Include what failed and why

Example variations:
```
Minimal: Sort a list of numbers
Rich: Sort a list of 1M numbers in Python with O(n log n) complexity, minimizing memory use
Error: I tried sorting with .sort() but got a TypeError. My list has mixed types.
```

#### 4. Response Complexity Levels
- **Brief**: 1-2 sentences, direct answer
- **Standard**: Full explanation with example
- **Detailed**: Comprehensive with multiple approaches, trade-offs, best practices

Example variations:
```
Brief: Use sorted() to sort a list.

Standard: Use sorted() or .sort() method:
- sorted() returns new list
- .sort() modifies in place

Detailed: Python offers three sorting approaches:
1. sorted() - creates new list, good for immutable results
2. .sort() - modifies in place, memory efficient
3. Custom key - for complex sorting criteria
[includes examples and performance notes]
```

#### 5. Edge Cases & Error Scenarios
- **Happy Path**: Normal, expected usage
- **Boundary Cases**: Empty input, single item, maximum size
- **Error Cases**: Invalid input, conflicting parameters, resource limits
- **Special Cases**: Null values, special characters, type mismatches

Example edge cases:
```
Happy: Sort [3, 1, 2] → [1, 2, 3]
Boundary: Sort [] → []
Error: Sort "not a list" → TypeError
Special: Sort [None, 1, 2] → Type error or special handling
```

### Domain-Specific Generation

Tailor examples to your specific domain:

#### Technical/Programming Domains
- **Language-specific patterns**: Python syntax differs from JavaScript
- **Library/framework concepts**: React hooks vs. class components
- **Performance considerations**: Algorithm complexity, memory usage
- **Error patterns**: Common mistakes in the domain

#### Business/Support Domains
- **Customer scenarios**: Common support requests
- **Resolution workflows**: Typical solution paths
- **Tone matching**: Professional, empathetic, solution-oriented
- **Policy constraints**: Refund limits, warranty coverage

#### Academic/Educational Domains
- **Explanation depth**: Balance rigor with accessibility
- **Prerequisite knowledge**: What should be assumed?
- **Worked examples**: Step-by-step walkthroughs
- **Assessment questions**: Test understanding

### Systematic Variation Template

For comprehensive coverage, use this template:

```
For each core scenario:
  For each user expertise level:
    For each query phrasing type:
      For each response complexity level:
        Generate 1 example

        Total: 1 scenario × 3 levels × 3 phrasings × 3 complexities = 27 variations
```

**Benefits**:
- Ensures systematic coverage
- Reduces gaps and redundancy
- Maintains consistency across examples
- Scales efficiently for multiple scenarios

## Format-Specific Guidance

### Code Generation Examples

**Key Elements:**
- Clean, well-commented code
- Proper error handling
- Performance considerations
- Best practices for the language/framework
- Documentation strings

**Diversity:**
- Different programming paradigms (OOP, functional, procedural)
- Various complexity levels (simple functions to complex systems)
- Multiple approaches to same problem
- Both complete programs and code snippets

### Creative Writing Examples

**Key Elements:**
- Vivid, sensory-rich descriptions
- Compelling narrative voice
- Character development
- Dialogue that feels natural
- Consistent tone and style

**Diversity:**
- Different genres and subgenres
- Various narrative perspectives (first, third person)
- Pacing variations (fast-paced to contemplative)
- Multiple writing styles (minimalist to ornate)

### Data Analysis Examples

**Key Elements:**
- Clear problem definition
- Step-by-step analytical approach
- Relevant visualizations or summaries
- Actionable insights
- Code for reproducibility

**Diversity:**
- Different data types (structured, time-series, text)
- Various analytical methods (descriptive, predictive, exploratory)
- Multiple business contexts
- Different data scales and complexities

### Technical Documentation Examples

**Key Elements:**
- Clear structure (overview, details, examples)
- Precise technical terminology
- Practical examples
- Clear parameter descriptions
- Error conditions and handling

**Diversity:**
- API documentation
- User guides and tutorials
- Architecture and design docs
- Troubleshooting guides
- Reference material

## Multi-Turn Conversation Generation

### Structure Patterns

**Support Conversation Pattern:**
```
1. User presents problem
2. Assistant asks clarifying questions OR provides initial solution
3. User provides more detail OR accepts solution
4. Assistant refines response
5. Conversation reaches resolution
```

**Debugging Conversation Pattern:**
```
1. User describes error
2. Assistant asks for context (error message, code)
3. User provides information
4. Assistant proposes solution
5. User tests, reports result
6. Assistant refines or confirms success
```

**Learning Conversation Pattern:**
```
1. User asks conceptual question
2. Assistant explains with analogies
3. User asks follow-up about specific aspect
4. Assistant provides detailed example
5. User asks how to apply knowledge
6. Assistant gives practical application example
```

### Conversation Quality Checklist

- [ ] Each turn feels natural and conversational
- [ ] Questions are specific and show understanding
- [ ] Responses build on previous context
- [ ] Complexity escalates appropriately
- [ ] Dialogue feels like real interaction, not templated
- [ ] Both parties demonstrate active listening
- [ ] Resolution or conclusion is clear

## Batch Generation Workflow

### Batch 1: Foundation Examples (5-10 examples)
- Core scenarios without complexity
- Establish baseline for quality
- Define system prompts and tone
- Get user feedback

### Batch 2: Complexity Expansion (20-30 examples)
- Add edge cases and error scenarios
- Vary query formulations
- Include advanced use cases
- Target specific gaps identified in Batch 1

### Batch 3: Coverage Filling (30-50 examples)
- Fill identified gaps in coverage
- Ensure good distribution across categories
- Add contextual variations
- Validate diversity metrics

### Batch 4: Polish & Validation (10-20 examples)
- Fill any remaining gaps
- Ensure quality consistency
- Validate edge case coverage
- Run full validation suite

## Avoiding Common Generation Pitfalls

### Problem: Over-Templating

**Bad Approach:**
```json
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, 
  {"role": "user", "content": "[TEMPLATE: I want to {VERB} {NOUN}"}, 
  {"role": "assistant", "content": "Here's how to {VERB} {NOUN}: ..."}]}
```

**Better Approach:**
- Write examples naturally without templates
- Vary phrasing and structure genuinely
- Let different user intents drive different response structures

### Problem: Narrow Scenario Coverage

**Bad Approach:**
- All examples are basic use cases
- No error scenarios or edge cases
- Limited domain diversity

**Better Approach:**
- Include 20-30% edge cases
- Cover error conditions
- Vary domains and contexts
- Test with real-world variations

### Problem: Inconsistent Quality

**Bad Approach:**
- Early examples are high quality, later ones degrade
- Inconsistent accuracy across examples
- Varying response depths without good reason

**Better Approach:**
- Maintain consistent quality standards throughout
- Use a checklist for each batch
- Review for consistency before finalizing
- Keep quality bar visible

### Problem: Too Much Repetition

**Bad Approach:**
- Many examples say slightly different versions of same thing
- Similar queries with nearly identical responses
- Redundant information

**Better Approach:**
- Ensure each example teaches something new
- Vary not just the query but the concept/approach
- Check for duplicates after generation
- Use analyze_dataset.py to check diversity metrics
