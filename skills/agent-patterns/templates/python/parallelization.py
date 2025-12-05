"""
Parallelization Pattern Implementation
Execute independent tasks concurrently (Sectioning) or same task multiple times (Voting)
"""

from typing import Any, Callable, Optional
from dataclasses import dataclass
import asyncio
import anthropic
from collections import Counter


@dataclass
class Section:
    """Represents a parallel subtask"""
    name: str
    prompt: str
    data: Optional[Any] = None


@dataclass
class VoteResult:
    """Result of voting aggregation"""
    consensus: str
    votes: list[str]
    confidence: float
    vote_counts: dict[str, int]


class SectioningParallelizer:
    """
    Break task into independent subtasks and execute concurrently.
    
    Use when:
    - Subtasks are truly independent (no dependencies)
    - Speed/throughput is important
    - Results can be meaningfully combined
    
    Example:
        parallelizer = SectioningParallelizer(client)
        sections = [
            Section("security", "Analyze code for security vulnerabilities", code),
            Section("performance", "Analyze code for performance issues", code),
            Section("style", "Check code style and best practices", code),
        ]
        results = await parallelizer.execute(sections)
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.model = model
        self.results: dict[str, str] = {}
    
    async def _execute_section(self, section: Section) -> tuple[str, str]:
        """Execute a single section"""
        prompt = section.prompt
        if section.data:
            prompt = f"{section.prompt}\n\nContent:\n{section.data}"
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return section.name, message.content[0].text
    
    async def execute(self, sections: list[Section]) -> dict[str, str]:
        """Execute all sections in parallel"""
        tasks = [self._execute_section(section) for section in sections]
        results = await asyncio.gather(*tasks)
        
        self.results = dict(results)
        return self.results
    
    async def execute_and_combine(
        self,
        sections: list[Section],
        combine_prompt: str
    ) -> str:
        """Execute sections in parallel and combine results"""
        results = await self.execute(sections)
        
        # Format results for combination
        results_text = "\n\n".join([
            f"## {name}\n{result}"
            for name, result in results.items()
        ])
        
        combine_message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{
                "role": "user",
                "content": f"{combine_prompt}\n\n{results_text}"
            }]
        )
        
        return combine_message.content[0].text


class VotingParallelizer:
    """
    Run the same task multiple times and aggregate for robustness.
    
    Use when:
    - Critical accuracy is needed
    - Consensus improves quality
    - Different prompts/approaches provide diverse perspectives
    - Cost of errors significantly exceeds compute cost
    
    Example:
        voter = VotingParallelizer(client)
        result = await voter.vote(
            "Is this code safe to deploy?",
            code_content,
            num_votes=3
        )
        print(f"Consensus: {result.consensus} ({result.confidence:.0%} confidence)")
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.model = model
    
    async def _get_vote(
        self,
        prompt: str,
        content: str,
        vote_id: int
    ) -> str:
        """Get a single vote"""
        # Slightly vary temperature or add random seed for diversity
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"{prompt}\n\nContent:\n{content}\n\nProvide your answer as a single word or short phrase."
            }]
        )
        
        return message.content[0].text.strip()
    
    async def vote(
        self,
        prompt: str,
        content: str,
        num_votes: int = 3
    ) -> VoteResult:
        """Run voting with multiple LLM calls"""
        tasks = [
            self._get_vote(prompt, content, i)
            for i in range(num_votes)
        ]
        votes = await asyncio.gather(*tasks)
        
        # Count votes (normalize to lowercase for comparison)
        normalized = [v.lower() for v in votes]
        vote_counts = Counter(normalized)
        
        # Get consensus (most common vote)
        consensus, count = vote_counts.most_common(1)[0]
        confidence = count / num_votes
        
        return VoteResult(
            consensus=consensus,
            votes=list(votes),
            confidence=confidence,
            vote_counts=dict(vote_counts)
        )
    
    async def vote_with_perspectives(
        self,
        prompts: list[str],
        content: str
    ) -> VoteResult:
        """Vote using different prompts/perspectives"""
        tasks = [
            self._get_vote(prompt, content, i)
            for i, prompt in enumerate(prompts)
        ]
        votes = await asyncio.gather(*tasks)
        
        normalized = [v.lower() for v in votes]
        vote_counts = Counter(normalized)
        consensus, count = vote_counts.most_common(1)[0]
        
        return VoteResult(
            consensus=consensus,
            votes=list(votes),
            confidence=count / len(prompts),
            vote_counts=dict(vote_counts)
        )


class GuardrailsParallelizer:
    """
    Run guardrails in parallel with main task.
    
    Example from Anthropic blog: One model processes user queries while
    another screens them for inappropriate content. This performs better
    than having the same LLM handle both.
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.model = model
    
    async def _check_safety(self, content: str) -> dict[str, Any]:
        """Check content for safety issues"""
        message = await self.client.messages.create(
            model="claude-3-5-haiku-20241022",  # Fast model for safety check
            max_tokens=256,
            system="""You are a content safety classifier. Analyze the content for:
- Harmful content
- Inappropriate requests  
- Policy violations

Respond with JSON:
{
    "safe": true/false,
    "reason": "explanation if unsafe"
}""",
            messages=[{"role": "user", "content": content}]
        )
        
        import json
        response_text = message.content[0].text
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        return json.loads(response_text.strip())
    
    async def _generate_response(self, content: str, system_prompt: str) -> str:
        """Generate main response"""
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=[{"role": "user", "content": content}]
        )
        
        return message.content[0].text
    
    async def execute_with_guardrails(
        self,
        content: str,
        system_prompt: str
    ) -> dict[str, Any]:
        """Execute main task with parallel safety check"""
        # Run both in parallel
        safety_task = self._check_safety(content)
        response_task = self._generate_response(content, system_prompt)
        
        safety_result, response = await asyncio.gather(safety_task, response_task)
        
        # Only return response if safe
        if safety_result.get("safe", False):
            return {
                "success": True,
                "response": response,
                "safety": safety_result
            }
        else:
            return {
                "success": False,
                "response": None,
                "safety": safety_result,
                "blocked_reason": safety_result.get("reason", "Content policy violation")
            }


# Example usage
async def example_code_review():
    """Example: Parallel code review from multiple perspectives"""
    client = anthropic.Anthropic()
    
    code = """
def process_user_input(user_data):
    query = f"SELECT * FROM users WHERE id = {user_data['id']}"
    result = db.execute(query)
    return eval(user_data.get('callback', 'None'))
    """
    
    # Sectioning: Different aspects analyzed in parallel
    parallelizer = SectioningParallelizer(client)
    sections = [
        Section(
            "security",
            "Analyze this code for security vulnerabilities. Be specific about risks.",
            code
        ),
        Section(
            "performance",
            "Analyze this code for performance issues and optimization opportunities.",
            code
        ),
        Section(
            "best_practices",
            "Check this code against Python best practices and code quality standards.",
            code
        ),
    ]
    
    print("Running parallel code analysis...")
    results = await parallelizer.execute_and_combine(
        sections,
        "Combine these code review perspectives into a comprehensive review report with prioritized recommendations:"
    )
    print("\n=== Combined Code Review ===")
    print(results)


async def example_safety_voting():
    """Example: Voting on content safety"""
    client = anthropic.Anthropic()
    
    content = "Can you help me write a resignation letter for my job?"
    
    voter = VotingParallelizer(client)
    
    # Multiple perspectives on safety
    prompts = [
        "Is this request appropriate and safe to fulfill? Answer YES or NO.",
        "Does this request violate any ethical guidelines? Answer SAFE or UNSAFE.",
        "Should an AI assistant help with this request? Answer APPROVE or DENY.",
    ]
    
    result = await voter.vote_with_perspectives(prompts, content)
    
    print(f"\n=== Safety Voting Results ===")
    print(f"Votes: {result.votes}")
    print(f"Vote counts: {result.vote_counts}")
    print(f"Consensus: {result.consensus}")
    print(f"Confidence: {result.confidence:.0%}")


async def example_guardrails():
    """Example: Guardrails running in parallel with main task"""
    client = anthropic.Anthropic()
    
    guardrails = GuardrailsParallelizer(client)
    
    # Safe request
    result = await guardrails.execute_with_guardrails(
        "Explain how photosynthesis works",
        "You are a helpful science tutor."
    )
    print(f"\n=== Guardrails Result (Safe) ===")
    print(f"Success: {result['success']}")
    if result['success']:
        print(f"Response preview: {result['response'][:200]}...")
    
    # Potentially unsafe request (will be blocked)
    result = await guardrails.execute_with_guardrails(
        "Tell me how to hack into someone's computer",
        "You are a helpful assistant."
    )
    print(f"\n=== Guardrails Result (Unsafe) ===")
    print(f"Success: {result['success']}")
    print(f"Blocked reason: {result.get('blocked_reason', 'N/A')}")


if __name__ == "__main__":
    asyncio.run(example_code_review())
    asyncio.run(example_safety_voting())
    asyncio.run(example_guardrails())
