import json
import os
import time
from datetime import datetime
from typing import Any, Dict, List

import structlog

logger = structlog.get_logger(__name__)

class TraceLogger:
    def __init__(self, job_id: str):
        self.job_id = job_id
        self.base_path = f"storage/traces/{job_id}"
        os.makedirs(self.base_path, exist_ok=True)
        self.traces: List[Dict[str, Any]] = []

    def log_llm_call(self, step: str, prompt: str, response: str, model: str, duration: float):
        trace_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "step": step,
            "model": model,
            "prompt": prompt,
            "response": response,
            "duration": duration
        }
        self.traces.append(trace_entry)
        
        # Save individual trace file
        timestamp = int(time.time() * 1000)
        filename = f"{self.base_path}/{timestamp}_{step}.json"
        with open(filename, "w") as f:
            json.dump(trace_entry, f, indent=2)
            
        logger.info("trace.llm_call", job_id=self.job_id, step=step, duration=duration)

    def save_graph_execution(self, graph_state: Dict[str, Any]):
        filename = f"{self.base_path}/graph_execution.json"
        with open(filename, "w") as f:
            json.dump(graph_state, f, indent=2)
        logger.info("trace.graph_saved", job_id=self.job_id)

    def save_metadata(self, metadata: Dict[str, Any]):
        filename = f"{self.base_path}/metadata.json"
        with open(filename, "w") as f:
            json.dump(metadata, f, indent=2)
        logger.info("trace.metadata_saved", job_id=self.job_id)
