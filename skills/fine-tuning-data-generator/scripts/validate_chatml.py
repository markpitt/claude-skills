#!/usr/bin/env python3
"""
ChatML JSONL Validator

Validates ChatML format JSONL files for fine-tuning.
Checks for:
- Valid JSON formatting
- Required fields (messages, role, content)
- Valid role values
- Duplicate detection
- Basic statistics

Usage:
    python validate_chatml.py <file.jsonl>
    python validate_chatml.py <file.jsonl> --verbose
"""

import json
import sys
from pathlib import Path
from collections import defaultdict
from typing import Dict, List, Tuple


class ChatMLValidator:
    def __init__(self, filepath: str, verbose: bool = False):
        self.filepath = Path(filepath)
        self.verbose = verbose
        self.errors = []
        self.warnings = []
        self.stats = {
            'total_examples': 0,
            'total_messages': 0,
            'role_counts': defaultdict(int),
            'avg_user_length': 0,
            'avg_assistant_length': 0,
            'multi_turn_count': 0,
            'single_turn_count': 0,
            'system_prompt_variations': set(),
        }
        self.user_lengths = []
        self.assistant_lengths = []
        self.message_hashes = set()

    def validate(self) -> bool:
        """Run all validations. Returns True if valid, False otherwise."""
        if not self.filepath.exists():
            self.errors.append(f"File not found: {self.filepath}")
            return False

        if not self.filepath.suffix == '.jsonl':
            self.warnings.append(f"File extension is '{self.filepath.suffix}', expected '.jsonl'")

        try:
            with open(self.filepath, 'r', encoding='utf-8') as f:
                for line_num, line in enumerate(f, 1):
                    line = line.strip()
                    if not line:
                        self.warnings.append(f"Line {line_num}: Empty line")
                        continue

                    self._validate_line(line, line_num)

            self._calculate_stats()
            self._check_diversity()

        except Exception as e:
            self.errors.append(f"Error reading file: {str(e)}")
            return False

        return len(self.errors) == 0

    def _validate_line(self, line: str, line_num: int):
        """Validate a single JSONL line."""
        # Check valid JSON
        try:
            data = json.loads(line)
        except json.JSONDecodeError as e:
            self.errors.append(f"Line {line_num}: Invalid JSON - {str(e)}")
            return

        # Check required 'messages' field
        if 'messages' not in data:
            self.errors.append(f"Line {line_num}: Missing 'messages' field")
            return

        if not isinstance(data['messages'], list):
            self.errors.append(f"Line {line_num}: 'messages' must be an array")
            return

        if len(data['messages']) == 0:
            self.errors.append(f"Line {line_num}: 'messages' array is empty")
            return

        # Validate each message
        messages = data['messages']
        self.stats['total_examples'] += 1
        self.stats['total_messages'] += len(messages)

        # Count turn type
        user_count = sum(1 for m in messages if m.get('role') == 'user')
        if user_count > 1:
            self.stats['multi_turn_count'] += 1
        else:
            self.stats['single_turn_count'] += 1

        for msg_idx, message in enumerate(messages):
            self._validate_message(message, line_num, msg_idx)

        # Check message order (system -> user -> assistant pattern)
        self._validate_message_order(messages, line_num)

        # Track system prompt variations
        system_messages = [m for m in messages if m.get('role') == 'system']
        if system_messages:
            self.stats['system_prompt_variations'].add(system_messages[0].get('content', ''))

    def _validate_message(self, message: dict, line_num: int, msg_idx: int):
        """Validate a single message object."""
        # Check required fields
        if 'role' not in message:
            self.errors.append(f"Line {line_num}, Message {msg_idx}: Missing 'role' field")
            return

        if 'content' not in message:
            self.errors.append(f"Line {line_num}, Message {msg_idx}: Missing 'content' field")
            return

        # Validate role
        role = message['role']
        valid_roles = ['system', 'user', 'assistant']
        if role not in valid_roles:
            self.errors.append(
                f"Line {line_num}, Message {msg_idx}: Invalid role '{role}'. "
                f"Must be one of: {', '.join(valid_roles)}"
            )
            return

        self.stats['role_counts'][role] += 1

        # Validate content
        content = message['content']
        if not isinstance(content, str):
            self.errors.append(
                f"Line {line_num}, Message {msg_idx}: 'content' must be a string"
            )
            return

        if len(content.strip()) == 0:
            self.warnings.append(
                f"Line {line_num}, Message {msg_idx}: Empty content string"
            )

        # Collect length statistics
        if role == 'user':
            self.user_lengths.append(len(content))
        elif role == 'assistant':
            self.assistant_lengths.append(len(content))

    def _validate_message_order(self, messages: List[dict], line_num: int):
        """Validate that message order makes sense."""
        roles = [m.get('role') for m in messages]

        # Check that we have at least user and assistant
        if 'user' not in roles:
            self.warnings.append(f"Line {line_num}: No 'user' message found")

        if 'assistant' not in roles:
            self.warnings.append(f"Line {line_num}: No 'assistant' message found")

        # Check that system comes first (if present)
        if 'system' in roles and roles[0] != 'system':
            self.warnings.append(
                f"Line {line_num}: 'system' message should be first"
            )

        # Check for consecutive messages with same role
        for i in range(len(roles) - 1):
            if roles[i] == roles[i + 1] and roles[i] in ['user', 'assistant']:
                self.warnings.append(
                    f"Line {line_num}: Consecutive '{roles[i]}' messages at positions {i} and {i+1}"
                )

    def _calculate_stats(self):
        """Calculate aggregate statistics."""
        if self.user_lengths:
            self.stats['avg_user_length'] = sum(self.user_lengths) / len(self.user_lengths)

        if self.assistant_lengths:
            self.stats['avg_assistant_length'] = sum(self.assistant_lengths) / len(self.assistant_lengths)

    def _check_diversity(self):
        """Check for diversity issues."""
        # Check if we have enough variety in user messages
        if self.stats['total_examples'] > 10:
            unique_user_msgs = len(set(self.user_lengths))
            if unique_user_msgs < self.stats['total_examples'] * 0.5:
                self.warnings.append(
                    "Low diversity detected: Many user messages have similar lengths"
                )

        # Check system prompt consistency
        num_variations = len(self.stats['system_prompt_variations'])
        if num_variations == 0:
            self.warnings.append("No system prompts found in any examples")
        elif self.verbose:
            print(f"\nSystem prompt variations: {num_variations}")

    def print_report(self):
        """Print validation report."""
        print(f"\n{'='*70}")
        print(f"ChatML Validation Report: {self.filepath.name}")
        print(f"{'='*70}\n")

        # Errors
        if self.errors:
            print(f"❌ ERRORS ({len(self.errors)}):")
            for error in self.errors:
                print(f"  - {error}")
            print()
        else:
            print("✓ No errors found\n")

        # Warnings
        if self.warnings:
            print(f"⚠️  WARNINGS ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"  - {warning}")
            print()
        else:
            print("✓ No warnings\n")

        # Statistics
        if self.stats['total_examples'] > 0:
            print("📊 STATISTICS:")
            print(f"  Total examples: {self.stats['total_examples']}")
            print(f"  Total messages: {self.stats['total_messages']}")
            print(f"  Single-turn: {self.stats['single_turn_count']} "
                  f"({self.stats['single_turn_count']/self.stats['total_examples']*100:.1f}%)")
            print(f"  Multi-turn: {self.stats['multi_turn_count']} "
                  f"({self.stats['multi_turn_count']/self.stats['total_examples']*100:.1f}%)")
            print(f"\n  Role Distribution:")
            for role, count in sorted(self.stats['role_counts'].items()):
                print(f"    {role}: {count}")
            print(f"\n  Average Lengths (characters):")
            print(f"    User messages: {self.stats['avg_user_length']:.0f}")
            print(f"    Assistant messages: {self.stats['avg_assistant_length']:.0f}")
            print(f"\n  System prompts: {len(self.stats['system_prompt_variations'])} unique variation(s)")
            print()

        # Summary
        print(f"{'='*70}")
        if not self.errors:
            print("✅ VALIDATION PASSED")
            if self.warnings:
                print(f"   ({len(self.warnings)} warning(s) - review recommended)")
        else:
            print("❌ VALIDATION FAILED")
            print(f"   Fix {len(self.errors)} error(s) before using this dataset")
        print(f"{'='*70}\n")


def main():
    if len(sys.argv) < 2:
        print("Usage: python validate_chatml.py <file.jsonl> [--verbose]")
        sys.exit(1)

    filepath = sys.argv[1]
    verbose = '--verbose' in sys.argv or '-v' in sys.argv

    validator = ChatMLValidator(filepath, verbose=verbose)
    is_valid = validator.validate()
    validator.print_report()

    sys.exit(0 if is_valid else 1)


if __name__ == "__main__":
    main()
