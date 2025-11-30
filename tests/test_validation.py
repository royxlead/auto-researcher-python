import pytest
from src.tools.validation import validate_citations, check_factual_consistency
from src.agents.state import DocumentPayload

def test_validate_citations():
    documents = [
        {"source": "url1", "content": "content1"},
        {"source": "url2", "content": "content2"}
    ]
    
    # Valid citations
    draft_valid = "This is a claim [S1]. This is another [S2]."
    assert validate_citations(draft_valid, documents) == []
    
    # Invalid citation
    draft_invalid = "This is a claim [S3]."
    assert validate_citations(draft_invalid, documents) == ["[S3]"]
    
    # Mixed
    draft_mixed = "Valid [S1], invalid [S5]."
    assert validate_citations(draft_mixed, documents) == ["[S5]"]

def test_check_factual_consistency():
    documents = [
        {"source": "url1", "content": "The revenue was 50% higher."}
    ]
    
    # Verified claim
    draft_verified = "Revenue increased by 50%."
    assert check_factual_consistency(draft_verified, documents) == []
    
    # Unverified claim
    draft_unverified = "Revenue increased by 60%."
    assert check_factual_consistency(draft_unverified, documents) == ["60%"]
