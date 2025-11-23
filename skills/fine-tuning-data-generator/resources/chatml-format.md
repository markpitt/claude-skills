# ChatML Format Specification

## Overview

ChatML (Chat Markup Language) is a standardized format for representing conversational data in language model fine-tuning. It's widely supported by training frameworks like Unsloth, Axolotl, and others.

## File Format

ChatML datasets are typically stored as **JSONL** (JSON Lines) files, where each line is a valid JSON object representing one training example.

## Structure

### Basic Structure

Each line in the JSONL file represents one conversation example:

```json
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

### Required Fields

- **messages**: Array of message objects representing the conversation
  - Each message object contains:
    - **role**: One of "system", "user", or "assistant"
    - **content**: The message text (string)

### Role Types

1. **system**: Sets the behavior/context for the assistant (optional but recommended)
2. **user**: Represents the user's input/query
3. **assistant**: Represents the model's expected response

## Conversation Patterns

### Single-Turn (Simple Q&A)

```json
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is the capital of France?"}, {"role": "assistant", "content": "The capital of France is Paris."}]}
```

### Multi-Turn (Dialogue)

```json
{"messages": [{"role": "system", "content": "You are a helpful assistant."}, {"role": "user", "content": "What is the capital of France?"}, {"role": "assistant", "content": "The capital of France is Paris."}, {"role": "user", "content": "What's the population?"}, {"role": "assistant", "content": "Paris has a population of approximately 2.2 million people in the city proper, and about 12 million in the metropolitan area."}]}
```

### Without System Prompt

```json
{"messages": [{"role": "user", "content": "Translate 'hello' to Spanish"}, {"role": "assistant", "content": "The Spanish translation of 'hello' is 'hola'."}]}
```

## Best Practices

### System Prompts

**Consistent System Prompt** (Recommended for most cases):
- Use the same system prompt across all examples
- Defines consistent behavior for the model
- Example: "You are a helpful, harmless, and honest assistant."

**Varied System Prompts** (Advanced use cases):
- Different system prompts for different task types
- Useful for multi-task models
- Ensure sufficient examples per system prompt variation

### Content Guidelines

1. **Escape Special Characters**: Properly escape quotes, newlines, etc.
   ```json
   {"role": "user", "content": "She said \"hello\" to me\nWhat should I say back?"}
   ```

2. **Preserve Formatting**: Maintain code blocks, lists, and structure
   ```json
   {"role": "assistant", "content": "Here's the code:\n\n```python\nprint('hello')\n```\n\nThis prints hello to the console."}
   ```

3. **Handle Empty Content**: Avoid empty content strings
   ```json
   // BAD
   {"role": "user", "content": ""}

   // GOOD
   {"role": "user", "content": "Hello"}
   ```

## Complete Example File

**training_data.jsonl**:
```json
{"messages": [{"role": "system", "content": "You are a Python expert."}, {"role": "user", "content": "How do I reverse a string?"}, {"role": "assistant", "content": "You can reverse a string in Python using slicing: `reversed_string = my_string[::-1]`"}]}
{"messages": [{"role": "system", "content": "You are a Python expert."}, {"role": "user", "content": "What's the difference between a list and a tuple?"}, {"role": "assistant", "content": "Lists are mutable (can be changed) and use square brackets []. Tuples are immutable (cannot be changed) and use parentheses (). Example:\n- List: `my_list = [1, 2, 3]`\n- Tuple: `my_tuple = (1, 2, 3)`"}]}
{"messages": [{"role": "system", "content": "You are a Python expert."}, {"role": "user", "content": "Show me how to read a file"}, {"role": "assistant", "content": "Here's the recommended way to read a file in Python:\n\n```python\nwith open('file.txt', 'r') as f:\n    content = f.read()\n    print(content)\n```\n\nUsing `with` ensures the file is properly closed even if an error occurs."}]}
```

## Validation

### Valid JSON Check

Each line must be valid JSON:
```bash
# Check if file is valid JSONL
while IFS= read -r line; do
  echo "$line" | jq . > /dev/null || echo "Invalid JSON"
done < training_data.jsonl
```

### Required Fields Check

```python
import json

with open('training_data.jsonl', 'r') as f:
    for i, line in enumerate(f, 1):
        data = json.loads(line)
        assert 'messages' in data, f"Line {i}: missing 'messages'"
        assert isinstance(data['messages'], list), f"Line {i}: 'messages' must be array"
        for msg in data['messages']:
            assert 'role' in msg, f"Line {i}: message missing 'role'"
            assert 'content' in msg, f"Line {i}: message missing 'content'"
            assert msg['role'] in ['system', 'user', 'assistant'], f"Line {i}: invalid role"
```

## Common Issues

### Issue 1: Invalid JSON
```json
// BAD - Missing quotes around property names
{messages: [{role: "user", content: "test"}]}

// GOOD
{"messages": [{"role": "user", "content": "test"}]}
```

### Issue 2: Incorrect Nesting
```json
// BAD - messages should be an array
{"messages": {"role": "user", "content": "test"}}

// GOOD
{"messages": [{"role": "user", "content": "test"}]}
```

### Issue 3: Newline Characters
```json
// BAD - Literal newlines break JSONL format
{"messages": [{"role": "user",
"content": "test"}]}

// GOOD - One line per example
{"messages": [{"role": "user", "content": "test"}]}
```

### Issue 4: Unescaped Characters
```json
// BAD
{"messages": [{"role": "user", "content": "She said "hello""}]}

// GOOD
{"messages": [{"role": "user", "content": "She said \"hello\""}]}
```

## Framework-Specific Notes

### Unsloth
- Supports standard ChatML format
- Can specify chat template in training config
- Handles tokenization automatically

### Axolotl
- Use `type: chat_template` in dataset config
- Supports various chat templates (chatml, llama2, etc.)
- Can specify custom template if needed

### Hugging Face
- Load with `datasets` library:
  ```python
  from datasets import load_dataset
  dataset = load_dataset('json', data_files='training_data.jsonl')
  ```

## Token Counting

Different models tokenize differently. Example lengths:

- Short user query: ~10-20 tokens
- Medium assistant response: ~50-150 tokens
- Long detailed response: ~200-500 tokens
- Code examples: Varies widely (100-1000+ tokens)

Plan your dataset size accounting for context window limits of your target model.

## Dataset Size Recommendations

- **Small tasks**: 100-500 examples
- **Medium tasks**: 500-2,000 examples
- **Complex tasks**: 2,000-10,000+ examples
- **Domain adaptation**: 1,000-5,000 examples

Quality > Quantity. Better to have 500 diverse, high-quality examples than 5,000 repetitive ones.
