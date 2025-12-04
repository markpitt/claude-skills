# Quality Validation & Analysis

## Validation Workflow

### Pre-Delivery Validation

Run these checks before delivering a dataset:

#### 1. JSON Validation
```bash
python scripts/validate_chatml.py training_data.jsonl
```

**Checks:**
- Valid JSON on each line
- Required fields present (messages, role, content)
- Valid role values (system, user, assistant)
- Proper message structure
- No empty content fields

#### 2. Dataset Analysis
```bash
python scripts/analyze_dataset.py training_data.jsonl
```

**Provides:**
- Total example count
- Message length statistics
- System prompt variations
- User query patterns
- Assistant response patterns
- Quality metrics and diversity scores

#### 3. Manual Quality Review

**Sample Review (recommended for all datasets):**
1. Read first 5 examples completely
2. Check middle batch (examples 25-35)
3. Review last 5 examples
4. Verify diversity in each batch

**Look for:**
- Natural language (not robotic)
- Accurate and helpful responses
- Proper JSON formatting
- Realistic user queries
- Consistent quality level

#### 4. Duplicate Detection

**Simple duplicate check:**
```bash
# Count unique user messages
grep -o '"role": "user", "content": "[^"]*"' training_data.jsonl | sort | uniq | wc -l
```

**Near-duplicate check:**
Run validation script and review warnings about similar message lengths

### Common Validation Issues

#### Issue: Invalid JSON

**Error Pattern:**
```
Line 42: Invalid JSON - Expecting property name enclosed in double quotes
```

**Root Causes:**
- Unescaped quotes in content: `"She said "hello""` should be `"She said \"hello\""`
- Literal newlines in JSON value (should use `\n`)
- Missing commas between fields
- Trailing commas

**Fix:**
- Ensure all quotes inside content are escaped with `\`
- Use `\n` for newlines, not literal line breaks
- Validate JSON before outputting

#### Issue: Missing Required Fields

**Error Pattern:**
```
Line 15: Missing 'content' field in message
```

**Root Causes:**
- Incomplete message structure
- Null/undefined values in JSON
- Formatting error during generation

**Fix:**
- Always include: role, content
- Verify no null values
- Test JSON generation code

#### Issue: Invalid Role Values

**Error Pattern:**
```
Line 8, Message 2: Invalid role 'Assistant' (should be lowercase 'assistant')
```

**Root Causes:**
- Case sensitivity error (role must be lowercase)
- Typo in role name

**Fix:**
- Ensure roles are exactly: "system", "user", "assistant"
- Check case sensitivity in generation code

#### Issue: Empty Content

**Warning Pattern:**
```
Line 23: Empty content string
```

**Root Causes:**
- Failed to generate content for a message
- Content accidentally set to empty string

**Fix:**
- Add validation to prevent empty content
- Regenerate affected examples

## Diversity Assessment

### Checking Diversity Metrics

Use analysis output to assess diversity:

```
User Message Patterns:
  questions: 450 (90%)
  commands: 480 (96%)
  code_related: 320 (64%)
  short_queries: 150 (30%)
  medium_queries: 280 (56%)
  long_queries: 70 (14%)
```

**Good Diversity Signs:**
- Multiple pattern types represented
- Reasonable distribution (not all same type)
- Length variety across messages
- Different content types

**Poor Diversity Signs:**
- 95%+ of examples are one type
- All queries similar length
- Repetitive patterns
- Limited variation in response types

### Quality Indicators from Analysis

**Diversity Score:**
- Higher % of unique message lengths = better diversity
- Target: 70%+ unique lengths across examples

**Balance Score:**
- Ratio of single-turn to multi-turn
- Well-balanced dataset should be 60-80% single-turn, 20-40% multi-turn
- Depending on task type

**Response Pattern Diversity:**
```
Assistant Response Patterns:
  with_0_code_blocks: 200 (40%)
  with_1_code_blocks: 200 (40%)
  with_2+_code_blocks: 100 (20%)
  with_lists: 280 (56%)
  with_headers: 320 (64%)
  brief: 50 (10%)
  medium: 250 (50%)
  detailed: 200 (40%)
```

**Good Coverage:**
- Multiple response types represented
- Balanced distribution of lengths
- Variety in formatting (code, lists, headers)

## Export & Documentation

### Export Dataset Statistics

Generate exportable statistics report:
```bash
python scripts/analyze_dataset.py training_data.jsonl --export stats.json
```

**Contents:**
- Total examples and message counts
- Conversation length statistics
- System prompt variations
- User pattern distribution
- Response type distribution
- Token estimates

### Create Dataset Documentation

**dataset_info.txt** should include:

```
FINE-TUNING DATASET: Customer Support Training Data
===================================================

Dataset Purpose:
  Training customer support chatbot for technical support domain

Generated: 2024-01-15
Total Examples: 500
  - Training: 450 examples
  - Validation: 50 examples

Quality Assurance:
  ✓ JSON validation: PASSED
  ✓ No duplicates found
  ✓ Diversity check: PASSED
  ✓ All required fields present
  ✓ Format specification compliance: 100%

Dataset Composition:
  Single-turn conversations: 350 (70%)
  Multi-turn conversations: 100 (30%)
  
  Response types:
    With code examples: 0 (0%)
    With structured lists: 180 (36%)
    With headers/sections: 280 (56%)
  
  Response lengths:
    Brief (< 200 chars): 50 (10%)
    Medium (200-800 chars): 250 (50%)
    Detailed (> 800 chars): 200 (40%)

System Prompts:
  Unique variations: 2
  1. "You are a helpful customer support agent..."
  2. "You are a technical support specialist..."

Category Distribution:
  Account/Login Issues: 100 (20%)
  Technical Issues: 180 (36%)
  Billing/Subscription: 120 (24%)
  General Questions: 100 (20%)

Estimated Tokens:
  Total dataset: ~125,000 tokens
  Average per example: ~250 tokens
  Estimated training cost (at $3/1M tokens): $0.38

Instructions for Use:
1. Load with: datasets.load_dataset('json', data_files='training_data.jsonl')
2. Configure training framework for ChatML format
3. Consider token limits for your model
4. Monitor for overfitting with validation split
5. Test sample outputs during training

Generation Notes:
  - Examples crafted to reflect real customer support interactions
  - Includes common edge cases and error scenarios
  - Balanced between technical and non-technical customers
  - Multi-turn examples show conversation flow
```

## Performance Metrics

### Dataset Quality Checklist

Before declaring dataset complete:

- [ ] **Completeness**: All identified scenarios covered
- [ ] **Accuracy**: All factual claims verified as correct
- [ ] **Consistency**: Quality level uniform across examples
- [ ] **Diversity**: Pattern variety measured and adequate
- [ ] **Format**: All JSON valid, all required fields present
- [ ] **No Duplicates**: Verified unique examples
- [ ] **Realistic**: Examples sound like real user interactions
- [ ] **Documented**: Dataset_info.txt created with statistics
- [ ] **Reproducible**: Notes on generation process kept
- [ ] **Size Appropriate**: Meets original requirements

### Success Criteria

A dataset is ready when:

1. **Validation passes** with no errors, minimal warnings
2. **Analysis shows** good diversity metrics
3. **Manual review** finds no quality issues in sample
4. **Token estimate** aligns with available budget
5. **Category coverage** matches requirements
6. **All stakeholders** approve quality level

## Troubleshooting

### Dataset Too Small

**Problem**: Only 250 examples generated, need 500

**Solutions:**
1. Continue generation for additional 250 examples
2. Use batch generation workflow to add more systematically
3. Vary generation parameters to create more examples

### Dataset Quality Declining

**Problem**: First 100 examples excellent, later ones mediocre

**Symptoms:**
- Analysis shows degrading diversity
- Manual review finds repetition
- Later responses less helpful/accurate

**Solutions:**
1. Return to strategy phase - identify what changed
2. Review generation approach for issues
3. Regenerate declining batches with original quality standards
4. Consider fatigue - take breaks between batches

### High Duplication Rate

**Problem**: Validation shows many very similar examples

**Symptoms:**
- Validation warnings about similar message lengths
- Manual review finds paraphrased variations of same content
- Diversity score low

**Solutions:**
1. Identify duplicate patterns
2. Remove near-duplicates
3. Regenerate with focus on true variation
4. Use different generation approach (more creative phrasing)

### Poor Domain Coverage

**Problem**: Most examples about Topic A, few about Topic B

**Symptoms:**
- Category distribution uneven
- Many examples redundant in topic A
- Topic B under-represented

**Solutions:**
1. Analyze current distribution with scripts
2. Generate targeted batch focused on Topic B
3. Manually specify category quotas for additional examples
4. Rebalance final dataset
