from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class ResearchRequest(BaseModel):
    """Input payload accepted by the /research endpoint."""

    topic: str = Field(min_length=3, description="Primary research topic or question")
    max_depth: int = Field(default=3, ge=1, le=10, description="Controls how exhaustive the review should be")
    num_papers: int = Field(default=10, ge=1, le=50, description="Number of papers to search for")
    provider: str = Field(default="ollama", pattern="^(ollama|openrouter)$", description="LLM provider to use")
    openrouter_api_key: str | None = Field(default=None, description="API key for OpenRouter (required if provider is openrouter)")
    model: str | None = Field(default=None, description="Specific model to use (e.g. 'llama3', 'x-ai/grok-4.1-fast')")
    critic_strictness: int = Field(default=5, ge=1, le=10, description="Strictness level of the critic agent (1=Lenient, 10=Strict)")

    model_config = ConfigDict(extra="forbid")


class ResearchResponse(BaseModel):
    """Successful research result envelope."""

    final_report: str = Field(description="Structured literature review synthesized by the system")
    sources: list[str] = Field(default_factory=list, description="List of source URLs cited in the review")
    topic: str = Field(description="The original research topic")
    graph_data: dict | None = Field(default=None, description="Citation graph data for visualization")
