"""
Routing Pattern Implementation
Classify input and route to specialized handlers
"""

from typing import Any, Callable, Optional
from dataclasses import dataclass
from enum import Enum
import anthropic


class RouteType(Enum):
    """Define your route categories"""
    GENERAL = "general"
    REFUND = "refund"
    TECHNICAL = "technical"
    COMPLAINT = "complaint"
    UNKNOWN = "unknown"


@dataclass
class RouteResult:
    """Result of classification"""
    route: RouteType
    confidence: float
    reasoning: str


@dataclass
class RouteHandler:
    """Handler for a specific route"""
    route: RouteType
    handler: Callable[[str], Any]
    description: str


class Router:
    """
    Classifies input and routes to specialized handlers.

    Example:
        router = Router(client=anthropic_client)
        router.register_handler(
            RouteType.REFUND,
            handle_refund_request,
            "Handles refund and return requests"
        )
        router.register_handler(
            RouteType.TECHNICAL,
            handle_technical_issue,
            "Handles technical problems and bugs"
        )
        result = await router.route(user_input)
    """

    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.model = model
        self.handlers: dict[RouteType, RouteHandler] = {}
        self.fallback_handler: Optional[Callable[[str], Any]] = None

    def register_handler(
        self,
        route: RouteType,
        handler: Callable[[str], Any],
        description: str
    ) -> "Router":
        """Register a handler for a specific route"""
        self.handlers[route] = RouteHandler(route, handler, description)
        return self

    def set_fallback(self, handler: Callable[[str], Any]) -> "Router":
        """Set fallback handler for unclassified inputs"""
        self.fallback_handler = handler
        return self

    async def classify(self, input_text: str) -> RouteResult:
        """Classify input into a route category"""
        # Build route descriptions for the classifier
        route_descriptions = "\n".join([
            f"- {route.value}: {handler.description}"
            for route, handler in self.handlers.items()
        ])

        classification_prompt = f"""Classify this input into exactly one category.

Available categories:
{route_descriptions}
- unknown: Input doesn't fit any category

Input to classify:
{input_text}

Respond with JSON:
{{
    "category": "category_name",
    "confidence": 0.0 to 1.0,
    "reasoning": "brief explanation"
}}"""

        message = self.client.messages.create(
            model=self.model,
            max_tokens=256,
            messages=[{"role": "user", "content": classification_prompt}]
        )

        response_text = message.content[0].text

        # Parse JSON response
        import json
        # Handle markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]

        result = json.loads(response_text.strip())

        # Map to RouteType enum
        try:
            route_type = RouteType(result["category"])
        except ValueError:
            route_type = RouteType.UNKNOWN

        return RouteResult(
            route=route_type,
            confidence=result.get("confidence", 0.5),
            reasoning=result.get("reasoning", "")
        )

    async def route(self, input_text: str) -> Any:
        """Classify input and route to appropriate handler"""
        classification = await self.classify(input_text)

        # Get handler for classified route
        if classification.route in self.handlers:
            handler = self.handlers[classification.route]
            return await handler.handler(input_text)

        # Use fallback if available
        if self.fallback_handler:
            return await self.fallback_handler(input_text)

        raise ValueError(f"No handler for route: {classification.route}")


# Example: Model-based routing (route to different models)
class ModelRouter:
    """
    Routes queries to appropriate model based on complexity.
    Simple queries → Fast/cheap model (Haiku)
    Complex queries → Capable/expensive model (Sonnet)
    """

    def __init__(self, client: anthropic.Anthropic):
        self.client = client

    async def assess_complexity(self, input_text: str) -> str:
        """Assess query complexity"""
        prompt = f"""Assess the complexity of this query.

Query: {input_text}

Categories:
- SIMPLE: Basic factual questions, simple lookups, short answers
- MEDIUM: Requires some analysis or explanation
- COMPLEX: Requires deep analysis, multi-step reasoning, or expertise

Respond with just the category name: SIMPLE, MEDIUM, or COMPLEX"""

        message = self.client.messages.create(
            model="claude-3-5-haiku-20241022",  # Use cheap model for classification
            max_tokens=10,
            messages=[{"role": "user", "content": prompt}]
        )

        return message.content[0].text.strip().upper()

    async def route_and_respond(self, input_text: str) -> str:
        """Route query to appropriate model and get response"""
        complexity = await self.assess_complexity(input_text)

        # Select model based on complexity
        if complexity == "SIMPLE":
            model = "claude-3-5-haiku-20241022"
        elif complexity == "MEDIUM":
            model = "claude-sonnet-4-20250514"
        else:  # COMPLEX
            model = "claude-sonnet-4-20250514"  # or opus for most complex

        message = self.client.messages.create(
            model=model,
            max_tokens=4096,
            messages=[{"role": "user", "content": input_text}]
        )

        return message.content[0].text


# Example usage
async def example_customer_service():
    """Example: Customer service routing"""
    client = anthropic.Anthropic()

    # Define handlers
    async def handle_general(input_text: str) -> str:
        """Handle general inquiries"""
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=1024,
            system="You are a helpful customer service agent answering general inquiries.",
            messages=[{"role": "user", "content": input_text}]
        )
        return message.content[0].text

    async def handle_refund(input_text: str) -> str:
        """Handle refund requests"""
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system="""You are a customer service agent specializing in refunds.
            
Policy:
- Full refund within 30 days
- 50% refund within 60 days
- No refund after 60 days
- Always verify purchase details first""",
            messages=[{"role": "user", "content": input_text}]
        )
        return message.content[0].text

    async def handle_technical(input_text: str) -> str:
        """Handle technical issues"""
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system="""You are a technical support specialist.
            
Process:
1. Identify the specific issue
2. Ask clarifying questions if needed
3. Provide step-by-step troubleshooting
4. Escalate to engineering if unresolved""",
            messages=[{"role": "user", "content": input_text}]
        )
        return message.content[0].text

    async def handle_complaint(input_text: str) -> str:
        """Handle complaints - escalate to human"""
        return "Thank you for your feedback. Your complaint has been logged and a supervisor will contact you within 24 hours."

    async def handle_unknown(input_text: str) -> str:
        """Fallback handler"""
        return "I'm not sure how to help with that. Could you please provide more details or rephrase your question?"

    # Set up router
    router = Router(client)
    router.register_handler(RouteType.GENERAL, handle_general, "General questions and information requests")
    router.register_handler(RouteType.REFUND, handle_refund, "Refund and return requests")
    router.register_handler(RouteType.TECHNICAL, handle_technical, "Technical problems, bugs, and issues")
    router.register_handler(RouteType.COMPLAINT, handle_complaint, "Complaints and negative feedback")
    router.set_fallback(handle_unknown)

    # Test routing
    test_inputs = [
        "What are your business hours?",
        "I want a refund for my order #12345",
        "The app crashes when I click the settings button",
        "This is the worst service I've ever experienced!",
    ]

    for input_text in test_inputs:
        print(f"\nInput: {input_text}")
        classification = await router.classify(input_text)
        print(f"Route: {classification.route.value} (confidence: {classification.confidence:.2f})")
        print(f"Reasoning: {classification.reasoning}")
        response = await router.route(input_text)
        print(f"Response: {response[:200]}...")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_customer_service())
