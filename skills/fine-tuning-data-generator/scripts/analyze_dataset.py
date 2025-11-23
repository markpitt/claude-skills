#!/usr/bin/env python3
"""
ChatML Dataset Analyzer

Provides detailed analysis and statistics for ChatML JSONL datasets.
Includes distribution analysis, content analysis, and quality metrics.

Usage:
    python analyze_dataset.py <file.jsonl>
    python analyze_dataset.py <file.jsonl> --export stats.json
"""

import json
import sys
from pathlib import Path
from collections import defaultdict, Counter
from typing import Dict, List
import re


class DatasetAnalyzer:
    def __init__(self, filepath: str):
        self.filepath = Path(filepath)
        self.examples = []
        self.stats = {
            'total_examples': 0,
            'message_stats': defaultdict(list),
            'token_estimates': defaultdict(list),
            'conversation_lengths': [],
            'system_prompts': Counter(),
            'user_patterns': defaultdict(int),
            'response_types': defaultdict(int),
        }

    def load_data(self) -> bool:
        """Load JSONL data."""
        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                for line in f:
                    line = line.strip()
                    if line:
                        self.examples.append(json.loads(line))
            self.stats['total_examples'] = len(self.examples)
            return True
        except Exception as e:
            print(f"Error loading file: {e}")
            return False

    def analyze(self):
        """Run all analyses."""
        for idx, example in enumerate(self.examples):
            messages = example.get('messages', [])
            self._analyze_conversation(messages, idx)

    def _analyze_conversation(self, messages: List[dict], idx: int):
        """Analyze a single conversation."""
        self.stats['conversation_lengths'].append(len(messages))

        for message in messages:
            role = message.get('role', '')
            content = message.get('content', '')

            # Content length
            self.stats['message_stats'][f'{role}_length'].append(len(content))

            # Token estimation (rough: ~4 chars per token)
            token_estimate = len(content) // 4
            self.stats['token_estimates'][role].append(token_estimate)

            # Analyze by role
            if role == 'system':
                self.stats['system_prompts'][content] += 1
            elif role == 'user':
                self._analyze_user_message(content)
            elif role == 'assistant':
                self._analyze_assistant_message(content)

    def _analyze_user_message(self, content: str):
        """Analyze user message patterns."""
        # Detect question
        if '?' in content:
            self.stats['user_patterns']['questions'] += 1

        # Detect command/imperative
        imperative_words = ['write', 'create', 'make', 'build', 'generate', 'show', 'explain', 'help']
        if any(content.lower().startswith(word) for word in imperative_words):
            self.stats['user_patterns']['commands'] += 1

        # Detect code mention
        if 'code' in content.lower() or '```' in content:
            self.stats['user_patterns']['code_related'] += 1

        # Detect length category
        if len(content) < 50:
            self.stats['user_patterns']['short_queries'] += 1
        elif len(content) < 200:
            self.stats['user_patterns']['medium_queries'] += 1
        else:
            self.stats['user_patterns']['long_queries'] += 1

    def _analyze_assistant_message(self, content: str):
        """Analyze assistant response patterns."""
        # Detect code blocks
        code_blocks = len(re.findall(r'```', content)) // 2
        if code_blocks > 0:
            self.stats['response_types'][f'with_{code_blocks}_code_block(s)'] += 1

        # Detect lists
        if re.search(r'^\s*[-*\d]+\.?\s', content, re.MULTILINE):
            self.stats['response_types']['with_lists'] += 1

        # Detect structured content
        if '##' in content or '###' in content:
            self.stats['response_types']['with_headers'] += 1

        # Detect length category
        if len(content) < 200:
            self.stats['response_types']['brief'] += 1
        elif len(content) < 800:
            self.stats['response_types']['medium'] += 1
        else:
            self.stats['response_types']['detailed'] += 1

    def print_report(self):
        """Print detailed analysis report."""
        print(f"\n{'='*70}")
        print(f"ChatML Dataset Analysis: {self.filepath.name}")
        print(f"{'='*70}\n")

        # Basic stats
        print("📈 DATASET OVERVIEW:")
        print(f"  Total examples: {self.stats['total_examples']}")

        if self.stats['conversation_lengths']:
            avg_conv_len = sum(self.stats['conversation_lengths']) / len(self.stats['conversation_lengths'])
            print(f"  Average messages per example: {avg_conv_len:.1f}")
            print(f"  Min messages: {min(self.stats['conversation_lengths'])}")
            print(f"  Max messages: {max(self.stats['conversation_lengths'])}")

        # System prompts
        print(f"\n💬 SYSTEM PROMPTS:")
        num_unique = len(self.stats['system_prompts'])
        print(f"  Unique system prompts: {num_unique}")

        if num_unique > 0 and num_unique <= 5:
            print(f"  Distribution:")
            for prompt, count in self.stats['system_prompts'].most_common(5):
                preview = prompt[:60] + "..." if len(prompt) > 60 else prompt
                print(f"    {count:4d}x: {preview}")

        # Message length stats
        print(f"\n📏 MESSAGE LENGTHS (characters):")
        for role in ['system', 'user', 'assistant']:
            lengths = self.stats['message_stats'].get(f'{role}_length', [])
            if lengths:
                avg = sum(lengths) / len(lengths)
                print(f"  {role.capitalize():10s}: avg={avg:6.0f}, min={min(lengths):5d}, max={max(lengths):5d}")

        # Token estimates
        print(f"\n🔢 TOKEN ESTIMATES (approximate):")
        for role in ['system', 'user', 'assistant']:
            tokens = self.stats['token_estimates'].get(role, [])
            if tokens:
                total = sum(tokens)
                avg = total / len(tokens)
                print(f"  {role.capitalize():10s}: avg={avg:6.0f} tokens, total≈{total:,} tokens")

        # Calculate total dataset tokens
        total_tokens = sum(sum(tokens) for tokens in self.stats['token_estimates'].values())
        print(f"\n  Total dataset: ≈{total_tokens:,} tokens")

        # Cost estimation (rough)
        cost_per_1m_tokens = 3.00  # Example cost
        estimated_cost = (total_tokens / 1_000_000) * cost_per_1m_tokens
        print(f"  Est. training cost: ${estimated_cost:.2f} (at ${cost_per_1m_tokens}/1M tokens)")

        # User message patterns
        print(f"\n❓ USER MESSAGE PATTERNS:")
        if self.stats['user_patterns']:
            for pattern, count in sorted(self.stats['user_patterns'].items()):
                pct = (count / self.stats['total_examples']) * 100
                print(f"  {pattern:20s}: {count:5d} ({pct:5.1f}%)")

        # Assistant response patterns
        print(f"\n💡 ASSISTANT RESPONSE PATTERNS:")
        if self.stats['response_types']:
            for resp_type, count in sorted(self.stats['response_types'].items()):
                pct = (count / self.stats['total_examples']) * 100
                print(f"  {resp_type:25s}: {count:5d} ({pct:5.1f}%)")

        # Quality indicators
        print(f"\n✨ QUALITY INDICATORS:")

        # Diversity score (simple heuristic)
        unique_user_lengths = len(set(self.stats['message_stats'].get('user_length', [])))
        diversity_score = (unique_user_lengths / max(self.stats['total_examples'], 1)) * 100
        print(f"  User query diversity: {diversity_score:.1f}% (unique lengths)")

        # Balance score
        multi_turn = sum(1 for l in self.stats['conversation_lengths'] if l > 3)
        single_turn = self.stats['total_examples'] - multi_turn
        if self.stats['total_examples'] > 0:
            balance = min(multi_turn, single_turn) / max(multi_turn, single_turn) if max(multi_turn, single_turn) > 0 else 0
            print(f"  Turn balance: {balance:.2f} (0=imbalanced, 1=balanced)")
            print(f"    Single-turn: {single_turn} ({single_turn/self.stats['total_examples']*100:.1f}%)")
            print(f"    Multi-turn: {multi_turn} ({multi_turn/self.stats['total_examples']*100:.1f}%)")

        print(f"\n{'='*70}\n")

    def export_stats(self, output_path: str):
        """Export statistics to JSON file."""
        # Convert Counter and defaultdict to regular dict for JSON serialization
        export_data = {
            'total_examples': self.stats['total_examples'],
            'conversation_lengths': {
                'average': sum(self.stats['conversation_lengths']) / len(self.stats['conversation_lengths']) if self.stats['conversation_lengths'] else 0,
                'min': min(self.stats['conversation_lengths']) if self.stats['conversation_lengths'] else 0,
                'max': max(self.stats['conversation_lengths']) if self.stats['conversation_lengths'] else 0,
            },
            'system_prompts': dict(self.stats['system_prompts']),
            'user_patterns': dict(self.stats['user_patterns']),
            'response_types': dict(self.stats['response_types']),
            'message_length_stats': {},
            'token_estimates': {},
        }

        # Add length stats
        for role in ['system', 'user', 'assistant']:
            lengths = self.stats['message_stats'].get(f'{role}_length', [])
            if lengths:
                export_data['message_length_stats'][role] = {
                    'average': sum(lengths) / len(lengths),
                    'min': min(lengths),
                    'max': max(lengths),
                    'count': len(lengths)
                }

        # Add token estimates
        for role in ['system', 'user', 'assistant']:
            tokens = self.stats['token_estimates'].get(role, [])
            if tokens:
                export_data['token_estimates'][role] = {
                    'average': sum(tokens) / len(tokens),
                    'total': sum(tokens),
                }

        with open(output_path, 'w') as f:
            json.dump(export_data, f, indent=2)

        print(f"✓ Statistics exported to {output_path}")


def main():
    if len(sys.argv) < 2:
        print("Usage: python analyze_dataset.py <file.jsonl> [--export output.json]")
        sys.exit(1)

    filepath = sys.argv[1]
    export_path = None

    if '--export' in sys.argv:
        export_idx = sys.argv.index('--export')
        if len(sys.argv) > export_idx + 1:
            export_path = sys.argv[export_idx + 1]

    analyzer = DatasetAnalyzer(filepath)

    if not analyzer.load_data():
        sys.exit(1)

    analyzer.analyze()
    analyzer.print_report()

    if export_path:
        analyzer.export_stats(export_path)


if __name__ == "__main__":
    main()
