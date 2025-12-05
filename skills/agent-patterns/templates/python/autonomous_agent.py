"""
Autonomous Agent Pattern Implementation
Open-ended exploration with tool usage and environment feedback
"""

from typing import Any, Callable, Optional
from dataclasses import dataclass, field
from enum import Enum
import anthropic
import json


class ActionType(Enum):
    """Types of actions an agent can take"""
    TOOL_CALL = "tool_call"
    THINK = "think"
    RESPOND = "respond"
    FINISH = "finish"


@dataclass
class Tool:
    """Definition of a tool the agent can use"""
    name: str
    description: str
    parameters: dict[str, Any]
    handler: Callable[[dict], Any]


@dataclass
class AgentAction:
    """An action decided by the agent"""
    action_type: ActionType
    tool_name: Optional[str] = None
    tool_args: Optional[dict] = None
    thought: Optional[str] = None
    response: Optional[str] = None


@dataclass
class AgentState:
    """Current state of the agent"""
    goal: str
    history: list[dict[str, Any]] = field(default_factory=list)
    step_count: int = 0
    completed: bool = False
    result: Optional[str] = None


@dataclass
class StoppingCondition:
    """Conditions for stopping agent execution"""
    max_steps: int = 50
    max_tool_errors: int = 3
    timeout_seconds: Optional[int] = None
    

class AutonomousAgent:
    """
    Autonomous agent that handles open-ended problems with tool usage.
    
    From Anthropic blog: "Agents begin their work with either a command from, 
    or interactive discussion with, the human user. Once the task is clear, 
    agents plan and operate independently, potentially returning to the human 
    for further information or judgement."
    
    Critical requirements:
    1. Environment Feedback - Agent must see results of actions
    2. Stopping Conditions - Prevent infinite loops
    3. Sandboxing - Contain potential damage
    4. Monitoring - Track agent behavior
    5. Human Oversight - Ability to intervene
    
    Example:
        agent = AutonomousAgent(client)
        agent.register_tool(search_tool)
        agent.register_tool(read_file_tool)
        agent.register_tool(write_file_tool)
        
        result = await agent.run("Fix the bug in the authentication module")
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514",
        system_prompt: Optional[str] = None
    ):
        self.client = client
        self.model = model
        self.tools: dict[str, Tool] = {}
        self.state: Optional[AgentState] = None
        self.stopping_condition = StoppingCondition()
        self.tool_error_count = 0
        
        self.system_prompt = system_prompt or """You are an autonomous agent that accomplishes goals by taking actions step by step.

For each step:
1. Analyze the current state and what you've learned
2. Decide on the next action to take
3. Use tools to interact with the environment
4. Learn from the results

Always think before acting. If you're unsure, ask for clarification.
When the goal is achieved, use the 'finish' action with your final result."""
    
    def register_tool(self, tool: Tool) -> "AutonomousAgent":
        """Register a tool the agent can use"""
        self.tools[tool.name] = tool
        return self
    
    def set_stopping_condition(
        self,
        max_steps: int = 50,
        max_tool_errors: int = 3,
        timeout_seconds: Optional[int] = None
    ) -> "AutonomousAgent":
        """Configure stopping conditions"""
        self.stopping_condition = StoppingCondition(
            max_steps=max_steps,
            max_tool_errors=max_tool_errors,
            timeout_seconds=timeout_seconds
        )
        return self
    
    def _build_tools_schema(self) -> list[dict]:
        """Build tool schemas for Claude API"""
        return [
            {
                "name": tool.name,
                "description": tool.description,
                "input_schema": tool.parameters
            }
            for tool in self.tools.values()
        ]
    
    async def _decide_action(self) -> AgentAction:
        """Have the agent decide the next action"""
        # Build context from history
        messages = []
        
        # Add goal
        messages.append({
            "role": "user",
            "content": f"Goal: {self.state.goal}\n\nProceed step by step to accomplish this goal."
        })
        
        # Add history as conversation
        for entry in self.state.history:
            if entry["type"] == "action":
                if entry["action_type"] == ActionType.TOOL_CALL.value:
                    messages.append({
                        "role": "assistant",
                        "content": [
                            {
                                "type": "tool_use",
                                "id": entry.get("tool_use_id", "tool_1"),
                                "name": entry["tool_name"],
                                "input": entry["tool_args"]
                            }
                        ]
                    })
                elif entry["action_type"] == ActionType.THINK.value:
                    messages.append({
                        "role": "assistant",
                        "content": entry["thought"]
                    })
            elif entry["type"] == "tool_result":
                messages.append({
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": entry.get("tool_use_id", "tool_1"),
                            "content": str(entry["result"])
                        }
                    ]
                })
            elif entry["type"] == "observation":
                messages.append({
                    "role": "user",
                    "content": f"Observation: {entry['content']}"
                })
        
        # If no history yet, or last message was from user, that's fine
        # Otherwise add a prompt
        if not messages or messages[-1]["role"] == "assistant":
            messages.append({
                "role": "user",
                "content": "Continue with the next step."
            })
        
        # Get next action from model
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=self.system_prompt,
            tools=self._build_tools_schema() + [
                {
                    "name": "finish",
                    "description": "Call this when the goal has been achieved. Provide the final result.",
                    "input_schema": {
                        "type": "object",
                        "properties": {
                            "result": {
                                "type": "string",
                                "description": "The final result or answer"
                            }
                        },
                        "required": ["result"]
                    }
                }
            ],
            messages=messages
        )
        
        # Parse response into action
        for content in response.content:
            if content.type == "tool_use":
                if content.name == "finish":
                    return AgentAction(
                        action_type=ActionType.FINISH,
                        response=content.input.get("result", "")
                    )
                return AgentAction(
                    action_type=ActionType.TOOL_CALL,
                    tool_name=content.name,
                    tool_args=content.input
                )
            elif content.type == "text":
                return AgentAction(
                    action_type=ActionType.THINK,
                    thought=content.text
                )
        
        # Default to thinking if nothing clear
        return AgentAction(
            action_type=ActionType.THINK,
            thought="Analyzing the situation..."
        )
    
    async def _execute_tool(self, tool_name: str, tool_args: dict) -> Any:
        """Execute a tool and return the result"""
        if tool_name not in self.tools:
            self.tool_error_count += 1
            return {"error": f"Unknown tool: {tool_name}"}
        
        tool = self.tools[tool_name]
        try:
            result = await tool.handler(tool_args)
            return result
        except Exception as e:
            self.tool_error_count += 1
            return {"error": str(e)}
    
    def _should_stop(self) -> tuple[bool, str]:
        """Check if any stopping condition is met"""
        if self.state.completed:
            return True, "Goal completed"
        
        if self.state.step_count >= self.stopping_condition.max_steps:
            return True, f"Max steps ({self.stopping_condition.max_steps}) reached"
        
        if self.tool_error_count >= self.stopping_condition.max_tool_errors:
            return True, f"Max tool errors ({self.stopping_condition.max_tool_errors}) reached"
        
        return False, ""
    
    async def run(
        self,
        goal: str,
        initial_context: Optional[str] = None
    ) -> dict[str, Any]:
        """Run the agent to accomplish a goal"""
        self.state = AgentState(goal=goal)
        self.tool_error_count = 0
        
        # Add initial context if provided
        if initial_context:
            self.state.history.append({
                "type": "observation",
                "content": initial_context
            })
        
        while True:
            # Check stopping conditions
            should_stop, reason = self._should_stop()
            if should_stop:
                break
            
            # Decide next action
            action = await self._decide_action()
            self.state.step_count += 1
            
            # Log action
            print(f"[Step {self.state.step_count}] {action.action_type.value}")
            
            if action.action_type == ActionType.FINISH:
                self.state.completed = True
                self.state.result = action.response
                self.state.history.append({
                    "type": "action",
                    "action_type": action.action_type.value,
                    "response": action.response
                })
                break
            
            elif action.action_type == ActionType.TOOL_CALL:
                # Record the action
                tool_use_id = f"tool_{self.state.step_count}"
                self.state.history.append({
                    "type": "action",
                    "action_type": action.action_type.value,
                    "tool_name": action.tool_name,
                    "tool_args": action.tool_args,
                    "tool_use_id": tool_use_id
                })
                
                # Execute and record result
                result = await self._execute_tool(action.tool_name, action.tool_args)
                print(f"  Tool: {action.tool_name}")
                print(f"  Result: {str(result)[:200]}...")
                
                self.state.history.append({
                    "type": "tool_result",
                    "tool_use_id": tool_use_id,
                    "result": result
                })
            
            elif action.action_type == ActionType.THINK:
                self.state.history.append({
                    "type": "action",
                    "action_type": action.action_type.value,
                    "thought": action.thought
                })
                print(f"  Thought: {action.thought[:200]}...")
        
        return {
            "completed": self.state.completed,
            "result": self.state.result,
            "steps": self.state.step_count,
            "history": self.state.history,
            "stop_reason": reason if not self.state.completed else "Goal achieved"
        }


# Example tools
def create_search_tool(client: anthropic.Anthropic) -> Tool:
    """Create a mock search tool"""
    async def search_handler(args: dict) -> dict:
        # In production, this would call a real search API
        query = args.get("query", "")
        return {
            "results": [
                {"title": f"Result 1 for '{query}'", "snippet": "...relevant content..."},
                {"title": f"Result 2 for '{query}'", "snippet": "...more content..."},
            ]
        }
    
    return Tool(
        name="search",
        description="Search for information. Use this to find relevant data.",
        parameters={
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query"
                }
            },
            "required": ["query"]
        },
        handler=search_handler
    )


def create_read_file_tool() -> Tool:
    """Create a file reading tool"""
    async def read_file_handler(args: dict) -> dict:
        file_path = args.get("file_path", "")
        try:
            with open(file_path, "r") as f:
                content = f.read()
            return {"content": content}
        except Exception as e:
            return {"error": str(e)}
    
    return Tool(
        name="read_file",
        description="Read the contents of a file. Always use absolute paths.",
        parameters={
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Absolute path to the file to read"
                }
            },
            "required": ["file_path"]
        },
        handler=read_file_handler
    )


def create_write_file_tool() -> Tool:
    """Create a file writing tool"""
    async def write_file_handler(args: dict) -> dict:
        file_path = args.get("file_path", "")
        content = args.get("content", "")
        try:
            with open(file_path, "w") as f:
                f.write(content)
            return {"success": True, "message": f"Written to {file_path}"}
        except Exception as e:
            return {"error": str(e)}
    
    return Tool(
        name="write_file",
        description="Write content to a file. Always use absolute paths.",
        parameters={
            "type": "object",
            "properties": {
                "file_path": {
                    "type": "string",
                    "description": "Absolute path to the file to write"
                },
                "content": {
                    "type": "string",
                    "description": "Content to write to the file"
                }
            },
            "required": ["file_path", "content"]
        },
        handler=write_file_handler
    )


def create_run_command_tool() -> Tool:
    """Create a command execution tool (sandboxed)"""
    import subprocess
    
    ALLOWED_COMMANDS = ["ls", "cat", "grep", "find", "wc", "head", "tail"]
    
    async def run_command_handler(args: dict) -> dict:
        command = args.get("command", "")
        
        # Basic sandboxing - only allow certain commands
        cmd_parts = command.split()
        if not cmd_parts:
            return {"error": "Empty command"}
        
        base_cmd = cmd_parts[0]
        if base_cmd not in ALLOWED_COMMANDS:
            return {"error": f"Command '{base_cmd}' not allowed. Allowed: {ALLOWED_COMMANDS}"}
        
        try:
            result = subprocess.run(
                command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=30  # 30 second timeout
            )
            return {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "return_code": result.returncode
            }
        except subprocess.TimeoutExpired:
            return {"error": "Command timed out"}
        except Exception as e:
            return {"error": str(e)}
    
    return Tool(
        name="run_command",
        description=f"Run a shell command. Only allowed commands: {ALLOWED_COMMANDS}",
        parameters={
            "type": "object",
            "properties": {
                "command": {
                    "type": "string",
                    "description": "The shell command to run"
                }
            },
            "required": ["command"]
        },
        handler=run_command_handler
    )


# Example usage
async def example_research_agent():
    """Example: Research agent that gathers information"""
    client = anthropic.Anthropic()
    
    agent = AutonomousAgent(
        client,
        system_prompt="""You are a research agent. Your job is to find information 
        and synthesize it into a clear answer. Use the search tool to find 
        relevant information. When you have enough information, use finish 
        to provide your final answer."""
    )
    
    agent.register_tool(create_search_tool(client))
    agent.set_stopping_condition(max_steps=10)
    
    result = await agent.run(
        "What are the key benefits of using agent patterns in AI applications?"
    )
    
    print("\n=== Research Agent Results ===")
    print(f"Completed: {result['completed']}")
    print(f"Steps: {result['steps']}")
    print(f"Stop reason: {result['stop_reason']}")
    print(f"\nResult:\n{result['result']}")


async def example_file_agent():
    """Example: File manipulation agent"""
    client = anthropic.Anthropic()
    
    agent = AutonomousAgent(
        client,
        system_prompt="""You are a file management agent. You can read and write files,
        and run safe shell commands. Always use absolute paths. Think carefully
        before modifying files."""
    )
    
    agent.register_tool(create_read_file_tool())
    agent.register_tool(create_write_file_tool())
    agent.register_tool(create_run_command_tool())
    agent.set_stopping_condition(max_steps=20, max_tool_errors=5)
    
    result = await agent.run(
        "List the Python files in /tmp and read any that contain 'test' in the name",
        initial_context="Working directory: /tmp"
    )
    
    print("\n=== File Agent Results ===")
    print(f"Completed: {result['completed']}")
    print(f"Steps: {result['steps']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_research_agent())
