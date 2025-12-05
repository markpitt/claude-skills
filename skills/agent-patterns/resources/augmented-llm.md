````markdown
# The Augmented LLM

The foundational building block for all agent patterns.

## Overview

From Anthropic's "Building Effective Agents" guide:

> "The basic building block of agentic systems is an LLM enhanced with augmentations such as retrieval, tools, and memory. Our current models can actively use these capabilities—generating their own search queries, selecting appropriate tools, and determining what information to retain."

Before implementing any complex agent pattern, ensure your LLM is properly augmented with the capabilities it needs.

## Core Augmentations

### 1. Retrieval (RAG)

**Purpose:** Give the model access to external knowledge beyond its training data.

**Implementation Approaches:**
- Vector databases for semantic search (Pinecone, Weaviate, Chroma)
- Traditional search engines for keyword matching
- Hybrid approaches combining both

**Best Practices:**
- Chunk documents appropriately for your use case
- Include metadata for filtering and context
- Implement reranking for better relevance
- Monitor retrieval quality metrics

**Example Integration:**
```python
async def augmented_llm_with_retrieval(query: str, client: Anthropic):
    # Retrieve relevant context
    relevant_docs = await vector_store.search(query, top_k=5)
    
    context = "\n\n".join([
        f"Document {i+1}:\n{doc.content}"
        for i, doc in enumerate(relevant_docs)
    ])
    
    # Generate response with context
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=4096,
        system="You are a helpful assistant. Use the provided context to answer questions accurately.",
        messages=[{
            "role": "user",
            "content": f"Context:\n{context}\n\nQuestion: {query}"
        }]
    )
    
    return response.content[0].text
```

---

### 2. Tools

**Purpose:** Allow the model to take actions and interact with external systems.

**Types of Tools:**
- **Information retrieval:** Search, database queries, API calls
- **Actions:** File operations, sending messages, creating records
- **Computation:** Calculations, data transformations
- **External services:** Third-party APIs, web services

**Best Practices:**
- Design clear, unambiguous tool interfaces
- Include examples in tool descriptions
- Provide comprehensive error messages
- Validate inputs before execution
- Use absolute paths for file operations (SWE-bench insight)

**Example Integration:**
```python
tools = [
    {
        "name": "search_knowledge_base",
        "description": "Search the company knowledge base for relevant information. Use this when you need to find specific policies, procedures, or documentation.",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "The search query (e.g., 'vacation policy', 'expense report procedure')"
                },
                "department": {
                    "type": "string",
                    "enum": ["HR", "Finance", "Engineering", "All"],
                    "description": "Filter by department"
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "send_email",
        "description": "Send an email to a recipient. Use this to communicate with users or escalate issues.",
        "input_schema": {
            "type": "object",
            "properties": {
                "to": {"type": "string", "description": "Recipient email address"},
                "subject": {"type": "string", "description": "Email subject line"},
                "body": {"type": "string", "description": "Email body content"}
            },
            "required": ["to", "subject", "body"]
        }
    }
]

response = await client.messages.create(
    model="claude-sonnet-4-20250514",
    max_tokens=4096,
    tools=tools,
    messages=[{"role": "user", "content": user_query}]
)
```

---

### 3. Memory

**Purpose:** Enable the model to retain and recall information across interactions.

**Types of Memory:**

**Short-term (Conversation) Memory:**
- Maintained within conversation context
- Automatically handled by message history
- Limited by context window

**Long-term Memory:**
- Persisted across sessions
- Requires external storage
- Needs retrieval mechanism

**Working Memory:**
- Structured notes about current task
- Updated during execution
- Helps maintain focus

**Implementation Approaches:**

```python
class AgentMemory:
    def __init__(self, vector_store, key_value_store):
        self.vector_store = vector_store  # For semantic search
        self.kv_store = key_value_store   # For structured facts
        self.working_memory = []           # Current task context
    
    async def remember(self, content: str, metadata: dict):
        """Store a memory with metadata"""
        # Store in vector DB for semantic retrieval
        await self.vector_store.insert(content, metadata)
        
        # If it's a fact, also store in key-value
        if metadata.get("type") == "fact":
            key = metadata.get("key")
            await self.kv_store.set(key, content)
    
    async def recall(self, query: str, filters: dict = None) -> list[str]:
        """Retrieve relevant memories"""
        results = await self.vector_store.search(query, filters=filters)
        return [r.content for r in results]
    
    async def get_fact(self, key: str) -> str:
        """Retrieve a specific fact"""
        return await self.kv_store.get(key)
    
    def update_working_memory(self, note: str):
        """Add to working memory for current task"""
        self.working_memory.append(note)
    
    def get_working_context(self) -> str:
        """Get current working memory as context"""
        return "\n".join(self.working_memory)
```

---

## Model Context Protocol (MCP)

The recommended way to integrate augmentations is through [Model Context Protocol](https://modelcontextprotocol.io/):

> "One approach [to implementing augmentations] is through our recently released Model Context Protocol, which allows developers to integrate with a growing ecosystem of third-party tools with a simple client implementation."

**Benefits of MCP:**
- Standardized interface for tools and resources
- Growing ecosystem of pre-built integrations
- Consistent error handling and response formats
- Easy to swap implementations

**Example MCP Client Setup:**
```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// Connect to an MCP server
const transport = new StdioClientTransport({
  command: "node",
  args: ["./my-mcp-server.js"]
});

const client = new Client({
  name: "my-agent",
  version: "1.0.0"
}, {
  capabilities: {}
});

await client.connect(transport);

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool({
  name: "search",
  arguments: { query: "user question" }
});
```

---

## Building Your Augmented LLM

### Step 1: Identify Required Capabilities

Before building, ask:
- What information does the model need access to? → Retrieval
- What actions should it be able to take? → Tools
- What does it need to remember? → Memory
- What external systems does it need? → Integrations

### Step 2: Design Tool Interfaces

Follow [tool-design.md](tool-design.md) principles:
- Clear, semantic names
- Comprehensive descriptions with examples
- Explicit parameters with types
- Error handling guidance
- Edge case documentation

### Step 3: Implement Retrieval

If your use case needs external knowledge:
- Choose appropriate chunking strategy
- Set up vector database
- Implement search and ranking
- Add metadata for filtering

### Step 4: Add Memory (If Needed)

For tasks requiring persistent context:
- Implement conversation history management
- Add long-term memory storage
- Consider working memory for complex tasks

### Step 5: Test and Iterate

- Test each augmentation independently
- Verify tool reliability
- Monitor retrieval quality
- Check memory recall accuracy

---

## Complete Example: Augmented Customer Support Agent

```python
import anthropic
from dataclasses import dataclass


@dataclass
class AugmentedLLM:
    """A fully augmented LLM with retrieval, tools, and memory"""
    
    client: anthropic.Anthropic
    model: str = "claude-sonnet-4-20250514"
    
    # Augmentations
    knowledge_base: "VectorStore" = None
    tools: list[dict] = None
    memory: "AgentMemory" = None
    
    async def respond(
        self,
        user_message: str,
        conversation_history: list[dict] = None
    ) -> str:
        """Generate a response using all available augmentations"""
        
        # 1. Retrieve relevant context
        context = ""
        if self.knowledge_base:
            docs = await self.knowledge_base.search(user_message, top_k=3)
            context = "\n\n".join([doc.content for doc in docs])
        
        # 2. Get memory context
        memory_context = ""
        if self.memory:
            relevant_memories = await self.memory.recall(user_message)
            if relevant_memories:
                memory_context = "Relevant past interactions:\n" + "\n".join(relevant_memories)
        
        # 3. Build system prompt with context
        system_prompt = f"""You are a helpful customer support agent.

Available Knowledge:
{context}

{memory_context}

Use the tools available to help the customer. Be friendly and professional."""
        
        # 4. Build messages
        messages = conversation_history or []
        messages.append({"role": "user", "content": user_message})
        
        # 5. Generate response with tools
        response = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            tools=self.tools or [],
            messages=messages
        )
        
        # 6. Handle tool use if needed
        while response.stop_reason == "tool_use":
            tool_results = await self._execute_tools(response.content)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": tool_results})
            
            response = await self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                tools=self.tools,
                messages=messages
            )
        
        # 7. Extract and return text response
        assistant_response = ""
        for block in response.content:
            if block.type == "text":
                assistant_response = block.text
                break
        
        # 8. Store interaction in memory
        if self.memory:
            await self.memory.remember(
                f"User: {user_message}\nAssistant: {assistant_response}",
                {"type": "interaction", "timestamp": datetime.now().isoformat()}
            )
        
        return assistant_response
    
    async def _execute_tools(self, content: list) -> list[dict]:
        """Execute tool calls and return results"""
        tool_results = []
        
        for block in content:
            if block.type == "tool_use":
                result = await self._call_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": str(result)
                })
        
        return tool_results
```

---

## When to Add Augmentations

| Need | Augmentation | Complexity |
|------|-------------|------------|
| Answer questions about specific documents | Retrieval | Medium |
| Take actions in external systems | Tools | Low-Medium |
| Remember user preferences | Long-term Memory | Medium |
| Handle multi-step tasks | Working Memory | Low |
| Access real-time data | Tools + APIs | Medium |
| Personalized responses | Memory + Retrieval | High |

---

## Key Principles

1. **Start Simple** - Add augmentations only when needed
2. **Test Each Independently** - Verify augmentations work before combining
3. **Design Good Interfaces** - Tool quality is more important than prompt engineering
4. **Monitor Performance** - Track retrieval accuracy, tool reliability, memory recall
5. **Consider MCP** - Use standardized protocols when possible

---

## Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [Tool Design Guidelines](tool-design.md)
- [Anthropic Building Effective Agents](https://www.anthropic.com/engineering/building-effective-agents)
- [Claude API Tool Use Documentation](https://docs.anthropic.com/en/docs/build-with-claude/tool-use)

````