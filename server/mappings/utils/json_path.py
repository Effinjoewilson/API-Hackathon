from typing import Any, List
import json


def extract_sample_paths(data: Any, max_depth: int = 5, current_depth: int = 0) -> List[dict]:
    """Extract all possible paths from a JSON structure with sample values"""
    paths = []
    
    if current_depth >= max_depth:
        return paths
    
    if isinstance(data, dict):
        for key, value in data.items():
            path_info = {
                'path': key,
                'type': type(value).__name__,
                'sample': _get_sample_value(value)
            }
            paths.append(path_info)
            
            # Recurse for nested structures
            if isinstance(value, (dict, list)):
                nested_paths = extract_sample_paths(value, max_depth, current_depth + 1)
                for nested in nested_paths:
                    paths.append({
                        'path': f"{key}.{nested['path']}",
                        'type': nested['type'],
                        'sample': nested['sample']
                    })
    
    elif isinstance(data, list) and data:
        # Handle array of objects
        if isinstance(data[0], dict):
            item_paths = extract_sample_paths(data[0], max_depth, current_depth + 1)
            for item_path in item_paths:
                paths.append({
                    'path': f"[*].{item_path['path']}",
                    'type': item_path['type'],
                    'sample': item_path['sample']
                })
    
    return paths


def _get_sample_value(value: Any) -> Any:
    """Get a sample value for display"""
    if value is None:
        return None
    elif isinstance(value, (dict, list)):
        return f"<{type(value).__name__}>"
    elif isinstance(value, str) and len(value) > 50:
        return value[:50] + "..."
    else:
        return value