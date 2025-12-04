# Framework Integration & Deployment

## Training Framework Compatibility

### Unsloth Integration

Unsloth is optimized for efficient fine-tuning with ChatML format.

**Setup:**
```python
from datasets import load_dataset
from unsloth import FastLanguageModel

# Load your ChatML dataset
dataset = load_dataset('json', data_files='training_data.jsonl')

# Split into train/val
train_val = dataset['train'].train_test_split(test_size=0.1)

model, tokenizer = FastLanguageModel.from_pretrained(
    model_name="unsloth/mistral-7b",
    load_in_4bit=True,
)

# Configure for ChatML
FastLanguageModel.for_training(model)

# Train with your dataset
trainer = SFTTrainer(
    model=model,
    train_dataset=train_val['train'],
    eval_dataset=train_val['test'],
    dataset_text_field="messages",  # Unsloth automatically handles ChatML
    ...
)
```

**Key Features:**
- Automatic ChatML format detection
- Efficient token handling
- Built-in data loading for JSONL

### Axolotl Integration

Axolotl supports multiple chat template formats including ChatML.

**Setup in `config.yaml`:**
```yaml
datasets:
  - path: training_data.jsonl
    type: chat_template
    chat_template: chatml  # Explicitly specify ChatML format
    
model_name_or_path: mistralai/Mistral-7B

chat_template: chatml  # Or auto-detect

training_hyperparameters:
  lr: 2e-4
  num_epochs: 3
  ...
```

**Supported Formats:**
- `chatml`: Standard ChatML (recommended)
- `llama2`: Llama 2 format
- `alpaca`: Alpaca format
- Custom templates supported

### Hugging Face Transformers

Standard ChatML works with Hugging Face's data loading.

**Setup:**
```python
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments

# Load dataset
dataset = load_dataset('json', data_files='training_data.jsonl')

# Tokenize
tokenizer = AutoTokenizer.from_pretrained("meta-llama/Llama-2-7b-hf")

def preprocess_function(examples):
    # Convert messages to text format
    texts = []
    for messages in examples['messages']:
        text = tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        texts.append(text)
    
    tokenized = tokenizer(
        texts, 
        truncation=True, 
        max_length=2048,
        return_tensors="pt"
    )
    return tokenized

tokenized_dataset = dataset.map(preprocess_function, batched=True)

# Train with Trainer
training_args = TrainingArguments(
    output_dir="./fine-tuned-model",
    num_train_epochs=3,
    per_device_train_batch_size=8,
    ...
)

trainer = Trainer(
    model=AutoModelForCausalLM.from_pretrained(...),
    args=training_args,
    train_dataset=tokenized_dataset['train'],
    ...
)

trainer.train()
```

**Important Notes:**
- Chat template must match model expectations
- Tokenizer may need custom chat template configuration
- Ensure context window matches model limits

### Custom Training Loops

For unsupported frameworks:

```python
import json
from torch.utils.data import Dataset, DataLoader

class ChatMLDataset(Dataset):
    def __init__(self, jsonl_file, tokenizer, max_length=2048):
        self.tokenizer = tokenizer
        self.max_length = max_length
        self.examples = []
        
        with open(jsonl_file, 'r') as f:
            for line in f:
                data = json.loads(line)
                self.examples.append(data['messages'])
    
    def __len__(self):
        return len(self.examples)
    
    def __getitem__(self, idx):
        messages = self.examples[idx]
        
        # Convert to text format using your tokenizer's chat template
        text = self.tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False
        )
        
        # Tokenize
        encodings = self.tokenizer(
            text,
            max_length=self.max_length,
            truncation=True,
            return_tensors="pt"
        )
        
        # Create labels (same as input for language modeling)
        return {
            'input_ids': encodings['input_ids'].squeeze(),
            'attention_mask': encodings['attention_mask'].squeeze(),
            'labels': encodings['input_ids'].squeeze(),
        }

# Usage
dataset = ChatMLDataset('training_data.jsonl', tokenizer)
dataloader = DataLoader(dataset, batch_size=8, shuffle=True)
```

## Deployment Workflow

### Pre-Training Checklist

- [ ] Dataset validated with `validate_chatml.py` (no errors)
- [ ] Analysis run with `analyze_dataset.py` (good diversity metrics)
- [ ] Token count estimated (within budget)
- [ ] Validation split prepared (if needed)
- [ ] Framework compatibility verified
- [ ] Training parameters configured
- [ ] Resources allocated (GPU/memory)

### Training Best Practices

**Hyperparameter Tuning:**
- Learning rate: Start with 2e-4 for fine-tuning
- Batch size: 8-16 common, depends on GPU memory
- Epochs: Start with 3, monitor for overfitting
- Warmup steps: 10% of total steps recommended
- Max gradient norm: 1.0 typical

**Monitoring:**
- Track training loss (should decrease)
- Monitor validation loss (watch for overfitting)
- Sample outputs periodically during training
- Save checkpoints at regular intervals
- Log divergence or instability

**Common Issues:**

| Issue | Symptom | Solution |
|-------|---------|----------|
| Overfitting | Val loss increases after initial decrease | Reduce epochs, add regularization |
| Underfitting | Loss plateaus high | Increase epochs, increase dataset size |
| GPU OOM | Out of memory error | Reduce batch size or max sequence length |
| Loss NaN | Training explodes | Reduce learning rate, check for bad data |
| Slow training | Taking much longer than expected | Check batch size, GPU utilization, data loading |

### Post-Training Evaluation

After training completes:

1. **Quantitative Metrics**:
   - Perplexity on validation set
   - Loss improvement from baseline
   - Token accuracy (if applicable)

2. **Qualitative Evaluation**:
   - Generate sample outputs from fine-tuned model
   - Compare against training examples
   - Test on unseen examples similar to training data
   - Check for memorization vs. generalization

3. **Real-World Testing**:
   - Test with actual use cases
   - Compare against base model
   - Get domain expert feedback
   - Measure task-specific metrics (if applicable)

## Model Optimization

### Quantization

Reduce model size for deployment:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig

# 4-bit quantization
bnb_config = BitsAndBytesConfig(
    load_in_4bit=True,
    bnb_4bit_use_double_quant=True,
    bnb_4bit_quant_type="nf4",
    bnb_4bit_compute_dtype=torch.bfloat16
)

model = AutoModelForCausalLM.from_pretrained(
    "fine-tuned-model",
    quantization_config=bnb_config,
    device_map="auto"
)
```

### Knowledge Distillation

Train smaller model to match fine-tuned model:

```python
from transformers import Trainer

# Use fine-tuned model as teacher
# Train smaller student model on same dataset
# Add distillation loss to training objective

teacher_model = AutoModelForCausalLM.from_pretrained("fine-tuned-model")
student_model = AutoModelForCausalLM.from_pretrained("smaller-model")

# Custom trainer with distillation loss
```

## Deployment Scenarios

### Local Deployment

Run fine-tuned model locally:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model = AutoModelForCausalLM.from_pretrained("./fine-tuned-model")
tokenizer = AutoTokenizer.from_pretrained("./fine-tuned-model")

# Generate with your data
messages = [
    {"role": "system", "content": "You are helpful..."},
    {"role": "user", "content": "How do I..."}
]

text = tokenizer.apply_chat_template(messages, tokenize=False)
inputs = tokenizer(text, return_tensors="pt")

outputs = model.generate(**inputs, max_length=512)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)
```

### API Deployment

Deploy via API service:

**Using vLLM (recommended for inference):**
```bash
python -m vllm.entrypoints.openai.api_server \
    --model ./fine-tuned-model \
    --port 8000
```

**Then query:**
```python
import requests

response = requests.post(
    "http://localhost:8000/v1/chat/completions",
    json={
        "model": "fine-tuned-model",
        "messages": [
            {"role": "system", "content": "You are helpful..."},
            {"role": "user", "content": "How do I..."}
        ],
        "temperature": 0.7
    }
)
```

### Cloud Deployment

- **HuggingFace Spaces**: Simple WebUI hosting
- **AWS SageMaker**: Managed training and hosting
- **Azure ML**: Enterprise-grade ML platform
- **Google Cloud Vertex AI**: Integrated ML platform

## Version Control

### Save Training Artifacts

```
fine-tuned-model/
├── pytorch_model.bin        # Model weights
├── config.json              # Model config
├── tokenizer.model          # Tokenizer
├── training_config.yaml     # Training parameters used
├── training_data.jsonl      # Dataset used
├── validation_data.jsonl    # Validation set
├── dataset_info.txt         # Dataset metadata
├── training_logs/           # Training loss logs
│   └── events.out.tfevents
└── generation_notes.md      # How dataset was created
```

### Reproducibility

Document what you did:

**generation_notes.md:**
```markdown
# Dataset Generation Notes

## Parameters Used
- Task Type: Customer Support
- Domain: Technical Support
- Total Examples: 500
- Validation Split: 10%

## Strategy
1. Generated 50 base examples covering core scenarios
2. Expanded with complexity variations (100 examples)
3. Added edge cases and error scenarios (150 examples)
4. Final polish and validation (200 examples)

## Quality Metrics
- Diversity score: 78%
- Multi-turn ratio: 32%
- Total tokens: ~125,000

## Changes Made
- Removed 5 duplicate examples
- Fixed 2 JSON formatting issues
- Added 10 missing error scenario examples

## Model Performance
- Training loss: 2.1 → 0.8
- Validation loss: 2.3 → 0.95
- No sign of overfitting after 3 epochs
```
