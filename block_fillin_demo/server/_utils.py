import os
import json

def make_schema_strict_compatible(schema):
    """
    Recursively modify a JSON schema to be compatible with OpenAI's strict mode.
    This adds 'additionalProperties': false to all object definitions and ensures
    all properties are listed in the required array.
    """
    if isinstance(schema, dict):
        # If this is an object schema, add additionalProperties: false
        if schema.get('type') == 'object' or 'properties' in schema:
            schema['additionalProperties'] = False
            
            # For OpenAI strict mode, all properties must be in required array
            if 'properties' in schema:
                properties = schema['properties']
                # Get all property names
                all_properties = list(properties.keys())
                
                # Ensure required array includes all properties
                if 'required' not in schema:
                    schema['required'] = all_properties
                else:
                    # Add any missing properties to required array
                    existing_required = set(schema['required'])
                    missing_properties = [prop for prop in all_properties if prop not in existing_required]
                    schema['required'].extend(missing_properties)
        
        # Recursively process all values
        for key, value in schema.items():
            if isinstance(value, (dict, list)):
                make_schema_strict_compatible(value)
    elif isinstance(schema, list):
        # Recursively process all items in the list
        for item in schema:
            if isinstance(item, (dict, list)):
                make_schema_strict_compatible(item)
    
    return schema


def load_prompt(file_name: str = "prompt") -> str:
    file_path = os.path.join("prompts", file_name+".txt")
    try:
        with open(file_path, 'r', encoding='utf-8') as file:
            return file.read().strip()
    except Exception as e:
        print(f"Error reading prompt file: {str(e)}. Using default prompt.")
        return "You are a helpful AI assistant. Please provide a thoughtful and informative response."

def load_test_response() -> str:
    """Load test response from _data/response_test.json"""
    try:
        file_path = os.path.join("_data", "testdsl.json")
        with open(file_path, 'r', encoding='utf-8') as file:
            test_data = json.load(file)
            return json.dumps(test_data["gpt_response"])
    except Exception as e:
        print(f"Error reading test response file: {str(e)}")
        return json.dumps({"error": "Could not load test response"})


def merge_factory_states(existing_filepath, new_factory_state):
    """
    Merge new factory state with existing one, preserving analyzed image content.
    
    Args:
        existing_filepath: Path to existing factory_state.json file
        new_factory_state: New factory state data from the request
        
    Returns:
        Merged factory state with preserved analyzed content
    """
    # If file doesn't exist, return the new factory state as-is
    if not os.path.exists(existing_filepath):
        print(f"📝 No existing factory state found at {existing_filepath}, using new state")
        return new_factory_state
    
    try:
        # Load existing factory state
        with open(existing_filepath, 'r', encoding='utf-8') as f:
            existing_factory_state = json.load(f)
        
        print(f"🔄 Merging factory states from {existing_filepath}")
        
        # Get factory stores from both states
        existing_store = existing_factory_state.get('factory_store', [])
        new_store = new_factory_state.get('factory_store', [])
        
        # Create a mapping of existing items by ID for quick lookup
        existing_items_map = {item.get('id'): item for item in existing_store if item.get('id')}
        
        # Process new store items
        merged_store = []
        for new_item in new_store:
            item_id = new_item.get('id')
            
            # Check if this item exists in the old state
            if item_id and item_id in existing_items_map:
                existing_item = existing_items_map[item_id]
                
                # If it's an image item with analyzed content (dict), preserve the analysis
                if (new_item.get('dataType') == 'image' and 
                    existing_item.get('dataType') == 'image' and
                    isinstance(existing_item.get('content'), dict) and
                    not existing_item.get('content', {}).get('error')):
                    
                    print(f"🔍 Preserving analyzed content for image: {new_item.get('fileUrl', 'unknown')}")
                    # Use new item structure but preserve the analyzed content
                    merged_item = new_item.copy()
                    merged_item['content'] = existing_item['content']
                    merged_store.append(merged_item)
                else:
                    # For non-image items or unanalyzed images, use the new item
                    merged_store.append(new_item)
            else:
                # New item doesn't exist in old state, add as-is
                merged_store.append(new_item)
        
        # Create the merged factory state
        merged_factory_state = new_factory_state.copy()
        merged_factory_state['factory_store'] = merged_store
        
        print(f"✅ Successfully merged factory states - preserved {len([item for item in merged_store if isinstance(item.get('content'), dict)])} analyzed images")
        return merged_factory_state
        
    except Exception as e:
        print(f"⚠️  Error merging factory states: {str(e)}, using new state")
        return new_factory_state