"""
Evaluator-Optimizer Pattern Implementation
One LLM generates while another evaluates and provides feedback for iterative refinement
"""

from typing import Any, Callable, Optional
from dataclasses import dataclass
import anthropic


@dataclass
class EvaluationCriteria:
    """A single evaluation criterion"""
    name: str
    description: str
    weight: float = 1.0  # 0-1
    threshold: float = 7.0  # Minimum acceptable score (out of 10)


@dataclass
class EvaluationResult:
    """Result of an evaluation"""
    scores: dict[str, float]  # criterion_name -> score
    overall_score: float
    feedback: str
    acceptable: bool
    needs_improvement: list[str]


@dataclass
class RefinementResult:
    """Result of the full refinement process"""
    final_output: str
    iterations: int
    initial_score: float
    final_score: float
    history: list[dict[str, Any]]


class EvaluatorOptimizer:
    """
    Iterative refinement with separate generator and evaluator.
    
    From Anthropic blog: "This workflow is particularly effective when we have
    clear evaluation criteria, and when iterative refinement provides measurable value."
    
    Example:
        eo = EvaluatorOptimizer(client)
        eo.add_criterion("clarity", "Is the writing clear and easy to understand?")
        eo.add_criterion("accuracy", "Is the information accurate and well-sourced?")
        eo.add_criterion("engagement", "Is the content engaging and interesting?")
        
        result = await eo.refine(
            "Write an article about quantum computing",
            max_iterations=3
        )
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        generator_model: str = "claude-sonnet-4-20250514",
        evaluator_model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.generator_model = generator_model
        self.evaluator_model = evaluator_model
        self.criteria: list[EvaluationCriteria] = []
        self.history: list[dict[str, Any]] = []
    
    def add_criterion(
        self,
        name: str,
        description: str,
        weight: float = 1.0,
        threshold: float = 7.0
    ) -> "EvaluatorOptimizer":
        """Add an evaluation criterion"""
        self.criteria.append(EvaluationCriteria(name, description, weight, threshold))
        return self
    
    async def generate(
        self,
        prompt: str,
        context: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> str:
        """Generate or improve content"""
        if feedback:
            full_prompt = f"""Improve this content based on the feedback provided.

Original prompt: {prompt}

Previous version:
{context}

Feedback for improvement:
{feedback}

Generate an improved version that addresses all feedback points."""
        else:
            full_prompt = f"""Generate high-quality content for the following:

{prompt}

Focus on quality, clarity, and accuracy."""
        
        message = await self.client.messages.create(
            model=self.generator_model,
            max_tokens=4096,
            messages=[{"role": "user", "content": full_prompt}]
        )
        
        return message.content[0].text
    
    async def evaluate(self, content: str, original_prompt: str) -> EvaluationResult:
        """Evaluate content against criteria"""
        criteria_text = "\n".join([
            f"- {c.name}: {c.description} (threshold: {c.threshold}/10, weight: {c.weight})"
            for c in self.criteria
        ])
        
        eval_prompt = f"""Evaluate the following content against these criteria:

{criteria_text}

Original task:
{original_prompt}

Content to evaluate:
{content}

Provide your evaluation as JSON:
{{
    "scores": {{
        "criterion_name": score_out_of_10,
        ...
    }},
    "feedback": "Specific, actionable feedback on how to improve",
    "strengths": ["List of strengths"],
    "weaknesses": ["List of areas needing improvement"]
}}"""
        
        message = await self.client.messages.create(
            model=self.evaluator_model,
            max_tokens=2048,
            messages=[{"role": "user", "content": eval_prompt}]
        )
        
        import json
        response_text = message.content[0].text
        
        # Handle markdown code blocks
        if "```json" in response_text:
            response_text = response_text.split("```json")[1].split("```")[0]
        elif "```" in response_text:
            response_text = response_text.split("```")[1].split("```")[0]
        
        result = json.loads(response_text.strip())
        
        # Calculate overall score (weighted average)
        total_weight = sum(c.weight for c in self.criteria)
        overall_score = sum(
            result["scores"].get(c.name, 0) * c.weight
            for c in self.criteria
        ) / total_weight
        
        # Determine which criteria need improvement
        needs_improvement = [
            c.name for c in self.criteria
            if result["scores"].get(c.name, 0) < c.threshold
        ]
        
        return EvaluationResult(
            scores=result["scores"],
            overall_score=overall_score,
            feedback=result["feedback"],
            acceptable=len(needs_improvement) == 0,
            needs_improvement=needs_improvement
        )
    
    async def refine(
        self,
        prompt: str,
        max_iterations: int = 3,
        target_score: float = 8.0,
        stop_on_no_improvement: bool = True
    ) -> RefinementResult:
        """Run the full refinement loop"""
        self.history = []
        
        # Initial generation
        output = await self.generate(prompt)
        evaluation = await self.evaluate(output, prompt)
        
        initial_score = evaluation.overall_score
        previous_score = initial_score
        
        self.history.append({
            "iteration": 0,
            "output": output,
            "evaluation": {
                "scores": evaluation.scores,
                "overall_score": evaluation.overall_score,
                "feedback": evaluation.feedback
            }
        })
        
        iteration = 0
        while iteration < max_iterations:
            # Check if we've reached target score
            if evaluation.overall_score >= target_score:
                break
            
            # Check if acceptable
            if evaluation.acceptable:
                break
            
            # Generate improved version
            output = await self.generate(
                prompt,
                context=output,
                feedback=evaluation.feedback
            )
            
            # Evaluate new version
            evaluation = await self.evaluate(output, prompt)
            
            iteration += 1
            
            self.history.append({
                "iteration": iteration,
                "output": output,
                "evaluation": {
                    "scores": evaluation.scores,
                    "overall_score": evaluation.overall_score,
                    "feedback": evaluation.feedback
                }
            })
            
            # Check for improvement stagnation
            if stop_on_no_improvement:
                improvement = evaluation.overall_score - previous_score
                if improvement < 0.1:  # Less than 0.1 point improvement
                    break
            
            previous_score = evaluation.overall_score
        
        return RefinementResult(
            final_output=output,
            iterations=iteration + 1,
            initial_score=initial_score,
            final_score=evaluation.overall_score,
            history=self.history
        )


class ConfidenceBasedOptimizer:
    """
    Alternative evaluator-optimizer that uses confidence scores.
    
    Continues refinement until confidence threshold is met.
    """
    
    def __init__(
        self,
        client: anthropic.Anthropic,
        model: str = "claude-sonnet-4-20250514"
    ):
        self.client = client
        self.model = model
    
    async def generate_with_confidence(
        self,
        prompt: str,
        previous: Optional[str] = None,
        feedback: Optional[str] = None
    ) -> tuple[str, float]:
        """Generate content and self-assess confidence"""
        if feedback:
            full_prompt = f"""Improve based on feedback:
{feedback}

Previous: {previous}

Original task: {prompt}

After generating, rate your confidence (0.0-1.0) that this fully addresses the task."""
        else:
            full_prompt = f"""{prompt}

After generating, rate your confidence (0.0-1.0) that this fully addresses the task.

Format:
[Your response here]

CONFIDENCE: [0.0-1.0]"""
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": full_prompt}]
        )
        
        response = message.content[0].text
        
        # Extract confidence score
        confidence = 0.5  # default
        if "CONFIDENCE:" in response:
            try:
                conf_str = response.split("CONFIDENCE:")[-1].strip()
                confidence = float(conf_str.split()[0])
            except:
                pass
            response = response.split("CONFIDENCE:")[0].strip()
        
        return response, confidence
    
    async def evaluate(self, content: str, prompt: str) -> tuple[float, str]:
        """External evaluation"""
        eval_prompt = f"""Evaluate this content for the task: {prompt}

Content:
{content}

Provide:
1. Confidence score (0.0-1.0) that this is a high-quality response
2. Specific feedback for improvement

Format:
SCORE: [0.0-1.0]
FEEDBACK: [Your feedback]"""
        
        message = await self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[{"role": "user", "content": eval_prompt}]
        )
        
        response = message.content[0].text
        
        score = 0.5
        feedback = ""
        
        if "SCORE:" in response:
            try:
                score_str = response.split("SCORE:")[-1].split("\n")[0].strip()
                score = float(score_str)
            except:
                pass
        
        if "FEEDBACK:" in response:
            feedback = response.split("FEEDBACK:")[-1].strip()
        
        return score, feedback
    
    async def refine_until_confident(
        self,
        prompt: str,
        target_confidence: float = 0.85,
        max_iterations: int = 5
    ) -> dict[str, Any]:
        """Refine until confidence threshold met"""
        output, self_confidence = await self.generate_with_confidence(prompt)
        score, feedback = await self.evaluate(output, prompt)
        
        # Use average of self-confidence and external score
        confidence = (self_confidence + score) / 2
        
        iteration = 0
        while confidence < target_confidence and iteration < max_iterations:
            output, self_confidence = await self.generate_with_confidence(
                prompt,
                previous=output,
                feedback=feedback
            )
            score, feedback = await self.evaluate(output, prompt)
            confidence = (self_confidence + score) / 2
            iteration += 1
        
        return {
            "output": output,
            "confidence": confidence,
            "iterations": iteration + 1,
            "final_feedback": feedback
        }


# Example usage
async def example_content_refinement():
    """Example: Refine marketing copy"""
    client = anthropic.Anthropic()
    
    eo = EvaluatorOptimizer(client)
    eo.add_criterion("clarity", "Is the writing clear and easy to understand?", weight=1.0, threshold=8.0)
    eo.add_criterion("persuasiveness", "Is the copy persuasive and compelling?", weight=1.2, threshold=7.5)
    eo.add_criterion("brand_voice", "Does it match a professional, friendly brand voice?", weight=0.8, threshold=7.0)
    eo.add_criterion("call_to_action", "Is there a clear, effective call to action?", weight=1.0, threshold=8.0)
    
    result = await eo.refine(
        "Write marketing copy for a new AI-powered writing assistant that helps users write better emails",
        max_iterations=3,
        target_score=8.5
    )
    
    print("=== Content Refinement Results ===")
    print(f"Iterations: {result.iterations}")
    print(f"Initial score: {result.initial_score:.1f}")
    print(f"Final score: {result.final_score:.1f}")
    print(f"\n=== Final Output ===\n{result.final_output}")
    
    print("\n=== Iteration History ===")
    for entry in result.history:
        print(f"\nIteration {entry['iteration']}:")
        print(f"  Score: {entry['evaluation']['overall_score']:.1f}")
        print(f"  Feedback: {entry['evaluation']['feedback'][:100]}...")


async def example_translation_refinement():
    """Example: Literary translation with iterative refinement"""
    client = anthropic.Anthropic()
    
    eo = EvaluatorOptimizer(client)
    eo.add_criterion("accuracy", "Does the translation preserve the original meaning?", threshold=9.0)
    eo.add_criterion("fluency", "Does the translation read naturally in the target language?", threshold=8.0)
    eo.add_criterion("cultural_fit", "Are idioms and cultural references appropriately adapted?", threshold=7.5)
    eo.add_criterion("tone", "Does the translation preserve the original tone and style?", threshold=8.0)
    
    result = await eo.refine(
        """Translate this French passage to English, preserving literary quality:

"Le temps s'écoule comme l'eau d'une rivière, emportant avec lui les souvenirs des jours heureux. 
Mais parfois, un parfum, une mélodie, nous ramène en arrière, vers ces moments précieux que nous 
croyions perdus à jamais."
""",
        max_iterations=3
    )
    
    print("=== Translation Refinement Results ===")
    print(f"Iterations: {result.iterations}")
    print(f"Score improvement: {result.initial_score:.1f} -> {result.final_score:.1f}")
    print(f"\n=== Final Translation ===\n{result.final_output}")


async def example_confidence_based():
    """Example: Confidence-based optimization"""
    client = anthropic.Anthropic()
    
    optimizer = ConfidenceBasedOptimizer(client)
    
    result = await optimizer.refine_until_confident(
        "Explain the Halting Problem in computer science in a way that a high school student could understand",
        target_confidence=0.85,
        max_iterations=4
    )
    
    print("=== Confidence-Based Results ===")
    print(f"Iterations: {result['iterations']}")
    print(f"Final confidence: {result['confidence']:.0%}")
    print(f"\n=== Output ===\n{result['output']}")


if __name__ == "__main__":
    import asyncio
    asyncio.run(example_content_refinement())
    # asyncio.run(example_translation_refinement())
    # asyncio.run(example_confidence_based())
