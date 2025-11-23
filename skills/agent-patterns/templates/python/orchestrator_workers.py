"""
Orchestrator-Workers Pattern Implementation
Dynamic task decomposition with specialized workers
"""

from typing import Any, Protocol
from dataclasses import dataclass
import asyncio
import anthropic
import json


@dataclass
class Subtask:
    """Represents a subtask assigned to a worker"""
    id: str
    description: str
    context: dict[str, Any]
    worker_type: str


class Worker(Protocol):
    """Protocol for worker implementations"""
    async def execute(self, subtask: Subtask) -> Any:
        ...


class LLMWorker:
    """Generic LLM worker for various tasks"""

    def __init__(
        self,
        client: anthropic.Anthropic,
        worker_type: str,
        system_prompt: str,
        model: str = "claude-3-5-sonnet-20241022"
    ):
        self.client = client
        self.worker_type = worker_type
        self.system_prompt = system_prompt
        self.model = model

    async def execute(self, subtask: Subtask) -> str:
        """Execute the subtask"""
        prompt = f"""
        Task: {subtask.description}

        Context:
        {json.dumps(subtask.context, indent=2)}

        Please complete this task following the instructions above.
        """

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.system_prompt,
            messages=[{"role": "user", "content": prompt}]
        )

        return message.content[0].text


class Orchestrator:
    """
    Coordinates task decomposition and worker execution.

    Example:
        orchestrator = Orchestrator(client)
        orchestrator.register_worker("analyzer", analysis_worker)
        orchestrator.register_worker("writer", writing_worker)

        result = await orchestrator.execute({
            "goal": "Create a comprehensive report on AI safety"
        })
    """

    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-3-5-sonnet-20241022"
    ):
        self.client = client
        self.model = model
        self.workers: dict[str, Worker] = {}
        self.execution_history: list[dict[str, Any]] = []

    def register_worker(self, worker_type: str, worker: Worker) -> None:
        """Register a worker for a specific type of task"""
        self.workers[worker_type] = worker

    async def _plan_subtasks(self, goal: dict[str, Any]) -> list[Subtask]:
        """Orchestrator plans the subtasks"""
        planning_prompt = f"""
        Break down this goal into concrete subtasks that can be executed in parallel
        or sequence by specialized workers.

        Goal: {json.dumps(goal, indent=2)}

        Available worker types: {', '.join(self.workers.keys())}

        Return a JSON array of subtasks with this structure:
        [
          {{
            "id": "unique_id",
            "description": "what the worker should do",
            "context": {{"key": "relevant context"}},
            "worker_type": "type of worker to use"
          }}
        ]

        Only use worker types from the available list above.
        """

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": planning_prompt}]
        )

        # Parse JSON response
        response_text = message.content[0].text
        # Extract JSON from markdown code blocks if present
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        subtasks_data = json.loads(response_text.strip())

        return [Subtask(**st) for st in subtasks_data]

    async def _execute_workers(self, subtasks: list[Subtask]) -> dict[str, Any]:
        """Execute workers in parallel"""
        tasks = []
        for subtask in subtasks:
            if subtask.worker_type not in self.workers:
                raise ValueError(f"No worker registered for type: {subtask.worker_type}")

            worker = self.workers[subtask.worker_type]
            tasks.append(worker.execute(subtask))

        results = await asyncio.gather(*tasks)

        return {
            subtask.id: result
            for subtask, result in zip(subtasks, results)
        }

    async def _synthesize_results(
        self,
        goal: dict[str, Any],
        subtasks: list[Subtask],
        results: dict[str, Any]
    ) -> str:
        """Orchestrator synthesizes worker results"""
        synthesis_prompt = f"""
        Original goal:
        {json.dumps(goal, indent=2)}

        Subtasks executed:
        {json.dumps([{"id": st.id, "description": st.description} for st in subtasks], indent=2)}

        Results from workers:
        {json.dumps(results, indent=2)}

        Please synthesize these results into a coherent final output that
        achieves the original goal.
        """

        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": synthesis_prompt}]
        )

        return message.content[0].text

    async def execute(self, goal: dict[str, Any]) -> str:
        """Execute the full orchestrator-workers workflow"""
        # Step 1: Plan subtasks
        subtasks = await self._plan_subtasks(goal)

        self.execution_history.append({
            "phase": "planning",
            "subtasks": [{"id": st.id, "description": st.description} for st in subtasks]
        })

        # Step 2: Execute workers
        results = await self._execute_workers(subtasks)

        self.execution_history.append({
            "phase": "execution",
            "results": results
        })

        # Step 3: Synthesize
        final_output = await self._synthesize_results(goal, subtasks, results)

        self.execution_history.append({
            "phase": "synthesis",
            "output": final_output
        })

        return final_output


# Example usage
async def example_research_task():
    """Example: Complex research task with multiple workers"""
    client = anthropic.Anthropic()

    # Create specialized workers
    research_worker = LLMWorker(
        client=client,
        worker_type="research",
        system_prompt="""
        You are a research specialist. When given a research question,
        provide comprehensive, well-sourced information with key findings.
        """
    )

    analysis_worker = LLMWorker(
        client=client,
        worker_type="analysis",
        system_prompt="""
        You are a data analyst. When given information, identify patterns,
        trends, and insights. Provide clear analytical conclusions.
        """
    )

    writing_worker = LLMWorker(
        client=client,
        worker_type="writing",
        system_prompt="""
        You are a technical writer. Transform research and analysis into
        clear, well-structured prose for a professional audience.
        """
    )

    # Create orchestrator and register workers
    orchestrator = Orchestrator(client)
    orchestrator.register_worker("research", research_worker)
    orchestrator.register_worker("analysis", analysis_worker)
    orchestrator.register_worker("writing", writing_worker)

    # Execute complex task
    result = await orchestrator.execute({
        "goal": "Create a comprehensive report on the current state of AI agent architectures",
        "requirements": [
            "Survey recent developments",
            "Analyze trade-offs between approaches",
            "Write clear recommendations"
        ]
    })

    print("Final Report:")
    print(result)

    print("\n\nExecution History:")
    for entry in orchestrator.execution_history:
        print(f"\nPhase: {entry['phase']}")
        print(json.dumps(entry, indent=2))


if __name__ == "__main__":
    asyncio.run(example_research_task())
