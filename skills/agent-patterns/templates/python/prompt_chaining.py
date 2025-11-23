"""
Prompt Chaining Pattern Implementation
Sequential LLM calls with programmatic checkpoints
"""

from typing import Any, Callable, Optional
from dataclasses import dataclass
import anthropic


@dataclass
class ChainStep:
    """Represents a single step in the prompt chain"""
    name: str
    prompt_template: str
    validator: Optional[Callable[[str], bool]] = None
    processor: Optional[Callable[[str], Any]] = None


class PromptChain:
    """
    Executes a sequence of LLM calls with validation and processing between steps.

    Example:
        chain = PromptChain(client=anthropic_client)
        chain.add_step(
            name="outline",
            prompt_template="Create an outline for: {topic}",
            validator=lambda x: len(x.split('\n')) >= 3
        )
        chain.add_step(
            name="expand",
            prompt_template="Expand this outline into a full document:\n{outline}"
        )
        result = chain.execute({"topic": "AI Safety"})
    """

    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-3-5-sonnet-20241022"
    ):
        self.client = client
        self.model = model
        self.steps: list[ChainStep] = []
        self.history: list[dict[str, Any]] = []

    def add_step(
        self,
        name: str,
        prompt_template: str,
        validator: Optional[Callable[[str], bool]] = None,
        processor: Optional[Callable[[str], Any]] = None
    ) -> "PromptChain":
        """Add a step to the chain"""
        self.steps.append(ChainStep(name, prompt_template, validator, processor))
        return self  # Allow chaining

    async def execute(self, initial_context: dict[str, Any]) -> str:
        """Execute the chain with initial context"""
        context = initial_context.copy()
        current_output = ""

        for step in self.steps:
            # Format prompt with current context
            prompt = step.prompt_template.format(**context)

            # Call LLM
            message = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                messages=[{"role": "user", "content": prompt}]
            )

            current_output = message.content[0].text

            # Validate if validator provided
            if step.validator and not step.validator(current_output):
                raise ValueError(
                    f"Step '{step.name}' validation failed. Output: {current_output[:100]}"
                )

            # Process if processor provided
            if step.processor:
                processed = step.processor(current_output)
                context[step.name] = processed
            else:
                context[step.name] = current_output

            # Track history
            self.history.append({
                "step": step.name,
                "prompt": prompt,
                "output": current_output,
                "context": context.copy()
            })

        return current_output


# Example usage
async def example_document_generation():
    """Example: Multi-step document generation"""
    client = anthropic.Anthropic()

    chain = PromptChain(client)

    # Step 1: Generate outline
    chain.add_step(
        name="outline",
        prompt_template="Create a detailed outline for an article about: {topic}",
        validator=lambda x: "1." in x and "2." in x  # Ensure numbered outline
    )

    # Step 2: Expand outline
    chain.add_step(
        name="draft",
        prompt_template="""
        Expand this outline into a full article:
        {outline}

        Write in a professional tone with clear examples.
        """,
        validator=lambda x: len(x.split()) > 200  # Ensure substantial content
    )

    # Step 3: Proofread
    chain.add_step(
        name="final",
        prompt_template="""
        Proofread and polish this article:
        {draft}

        Fix any grammar, improve clarity, and ensure consistent tone.
        """
    )

    result = await chain.execute({"topic": "Building Effective AI Agents"})
    return result


# Example with custom processing
async def example_with_processing():
    """Example: Translation pipeline with processing"""
    client = anthropic.Anthropic()

    def extract_key_terms(text: str) -> list[str]:
        """Simple key term extraction"""
        # In real implementation, use NLP or LLM
        return [word for word in text.split() if len(word) > 10]

    chain = PromptChain(client)

    chain.add_step(
        name="content",
        prompt_template="Write a technical explanation of: {topic}"
    )

    chain.add_step(
        name="terms",
        prompt_template="""
        Extract technical terms from this text and define them:
        {content}
        """,
        processor=extract_key_terms
    )

    chain.add_step(
        name="translation",
        prompt_template="""
        Translate this text to {language}, preserving these key terms: {terms}

        Text:
        {content}
        """
    )

    result = await chain.execute({
        "topic": "Quantum Computing",
        "language": "Spanish"
    })

    return result


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_document_generation())
