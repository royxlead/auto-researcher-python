import re
from typing import List, Dict, Any

from langchain_core.messages import HumanMessage, SystemMessage

from src.agents.state import DocumentPayload

def validate_citations(draft: str, documents: List[DocumentPayload]) -> List[str]:
    """
    Verify that all citations in the draft (e.g. [S1], [S2]) exist in the provided documents.
    Returns a list of invalid citation markers.
    """
    # Extract all citation markers like [S1], [S12], etc.
    citations = re.findall(r"\[S(\d+)\]", draft)
    
    # Get valid indices from documents (assuming 1-based indexing in draft)
    # In draft_node, we format sources starting from 1.
    # But documents list is 0-indexed.
    # We need to know how many documents were passed to the draft.
    # The draft prompt uses [S1], [S2]... corresponding to documents[0], documents[1]...
    
    valid_indices = set(range(1, len(documents) + 1))
    
    invalid_citations = []
    for citation in citations:
        idx = int(citation)
        if idx not in valid_indices:
            invalid_citations.append(f"[S{idx}]")
            
    return sorted(list(set(invalid_citations)))

async def detect_hallucinations(draft: str, documents: List[DocumentPayload], llm: Any) -> Dict[str, Any]:
    """
    Use LLM to check for hallucinations.
    """
    # We'll use a simplified version of the critique prompt here, focused solely on hallucination.
    # Or we can rely on the existing critique_node which already does this.
    # But the user asked for a "hallucination detector" module.
    
    context = _format_sources(documents)
    
    prompt = (
        "You are a Hallucination Detector. Check the following draft against the Evidence Bank.\n"
        "Identify any claims in the draft that are NOT supported by the Evidence Bank.\n"
        "Respond in JSON: {\"hallucinations\": [\"claim 1\", \"claim 2\"], \"score\": 0.0 to 1.0}\n"
        "Score 0.0 means no hallucinations, 1.0 means pure hallucination.\n\n"
        f"Evidence Bank:\n{context}\n\nDraft:\n{draft}"
    )
    
    response = await llm.ainvoke([SystemMessage(content="You are a strict fact-checker."), HumanMessage(content=prompt)])
    
    # Parse response (assuming simple JSON extraction)
    content = getattr(response, "content", str(response))
    # ... parsing logic ...
    # For now, return raw content or try to parse
    return {"raw_response": content}

def check_factual_consistency(draft: str, documents: List[DocumentPayload]) -> List[str]:
    """
    Extract numerical claims from draft and verify they exist in documents.
    Returns a list of unverified numbers/claims.
    """
    # Extract numbers (integers, floats, percentages, dates)
    # This is a simple regex, might catch some false positives/negatives
    numbers = re.findall(r'\b\d+(?:\.\d+)?%?\b', draft)
    
    # Flatten document content
    full_text = " ".join([doc["content"] for doc in documents])
    
    unverified = []
    for num in set(numbers):
        # Simple check: does the number appear in the source text?
        # We might want to be more sophisticated (e.g. check context), but this is a start.
        if num not in full_text:
            unverified.append(num)
            
    return sorted(unverified)

def _format_sources(documents: List[DocumentPayload]) -> str:
    formatted = []
    for idx, doc in enumerate(documents, start=1):
        snippet = doc["content"][:1000]
        formatted.append(f"[S{idx}] Source: {doc['source']}\nSnippet: {snippet}")
    return "\n\n".join(formatted)
