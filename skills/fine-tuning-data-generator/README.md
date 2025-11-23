# Fine-Tuning Data Generator Skill

Generate high-quality synthetic training data in ChatML format for fine-tuning language models.

## What This Skill Does

This skill helps you create comprehensive fine-tuning datasets by:
- Asking clarifying questions about your requirements
- Creating a detailed generation plan
- Generating diverse, realistic training examples
- Outputting data in ChatML JSONL format
- Validating the dataset quality

## When to Use

Use this skill when you need to:
- Create training data for fine-tuning models with Unsloth, Axolotl, or similar frameworks
- Generate synthetic conversations for specific domains or tasks
- Build datasets for instruction-following, Q&A, code generation, or other tasks
- Ensure consistent ChatML formatting for your training data

## Quick Start

1. **Request dataset generation**:
   ```
   "I need to create fine-tuning data for a customer support chatbot in the e-commerce domain"
   ```

2. **Answer clarifying questions** about:
   - Number of examples needed
   - Domain and task type
   - Diversity requirements
   - Response style and tone

3. **Review the generation plan** before Claude creates the data

4. **Receive your dataset** as JSONL files ready for training

## Output Files

- `training_data.jsonl` - Main training dataset
- `validation_data.jsonl` - Validation set (optional)
- `dataset_info.txt` - Statistics and metadata

## Validation Tools

### Validate ChatML Format
```bash
python scripts/validate_chatml.py training_data.jsonl
```

### Analyze Dataset
```bash
python scripts/analyze_dataset.py training_data.jsonl
python scripts/analyze_dataset.py training_data.jsonl --export stats.json
```

## Examples

The skill can generate data for various domains:
- **Customer Support**: Help desk, troubleshooting, order management
- **Code Generation**: Algorithm implementation, bug fixes, code review
- **Technical Writing**: Documentation, API specs, tutorials
- **Data Analysis**: Query writing, data interpretation, visualization
- **Creative Writing**: Stories, content creation, editing
- **Education**: Concept explanations, tutoring, learning materials

## Resources

- `resources/chatml-format.md` - Detailed ChatML format specification
- `resources/examples.md` - Extended examples across domains
- `templates/generation-plan.md` - Generation plan template

## ChatML Format

Each example follows this structure:
```json
{"messages": [{"role": "system", "content": "..."}, {"role": "user", "content": "..."}, {"role": "assistant", "content": "..."}]}
```

## Tips for Best Results

1. **Be specific** about your use case and domain
2. **Request diverse examples** covering edge cases
3. **Review the first batch** before generating large datasets
4. **Validate early** using the provided scripts
5. **Test with actual training** to verify quality

## Training Framework Compatibility

This skill generates standard ChatML format compatible with:
- **Unsloth**: Direct compatibility
- **Axolotl**: Use `type: chat_template` in config
- **Hugging Face**: Load with `datasets.load_dataset('json', ...)`
- Most modern fine-tuning frameworks

## Quality Assurance

The skill ensures:
- Valid JSON formatting
- No duplicate examples
- Natural, realistic queries
- Accurate, helpful responses
- Diverse scenarios and phrasing
- Appropriate difficulty distribution

## Support

For issues or questions:
- Review the SKILL.md file for detailed instructions
- Check examples in `resources/examples.md`
- Run validation scripts to identify issues
- Consult ChatML format specification in `resources/chatml-format.md`
