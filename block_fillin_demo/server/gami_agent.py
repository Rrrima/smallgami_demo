from openai import OpenAI
from anthropic import Anthropic, transform_schema
from google import genai
import os
import json
from pathlib import Path
from typing import Optional, Dict, Any, Literal
from schema.composite_object_config import CompositeObject, IntentClassification, WorldConfig, WorldConfigChangeResponse, PlayerConfig, PlayerConfigChangeResponse, GameObjectConfig, ObjectConfigChangeResponse, SpawnConfig, SpawnConfigChangeResponse, BlockChangeSuggestionResponse
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class GamiAgent:
    """
    AI Agent for SmallGami that can switch between different LLM models.
    Automatically detects the provider based on model name.
    
    This agent uses a two-step process:
    1. Determine user intent (chat vs generate_asset)
    2. Call the appropriate function based on intent
    """
    
    # Model to provider mapping
    MODEL_PROVIDERS = {
        # OpenAI models
        "gpt-4o": "openai",
        # Anthropic Claude models
        "claude-sonnet-4-5": "anthropic",
        # Google Gemini models
        "gemini-3-flash-preview": "google",
        "gemini-3-pro-preview": "google",
    }
    
    def __init__(self, model: str = "gpt-4o"):
        """
        Initialize the GamiAgent with a specific model.
        
        Args:
            model: The model name to use
        """
        self.model = model
        self.provider = self._detect_provider(model)
        self.client = None
        
        # Initialize the client
        self._init_client()
        
        # Set up prompts directory
        self.prompts_dir = Path(__file__).parent / "prompts"
        
        # Load prompts
        self.prompts = self._load_prompts()
    
    def _load_prompts(self) -> Dict[str, str]:
        """Load all prompt files from the prompts directory"""
        prompts = {}
        prompt_files = {
            'intent_system': 'intent_detection_system_prompt.txt',
            'intent_user': 'intent_detection_user_prompt.txt',
            'composite_system': 'composite_object_system_prompt.txt',
            'composite_user': 'composite_object_user_prompt.txt',
            'chat_system': 'system_prompt.txt',
            'world_config_system': 'world_config_system_prompt.txt',
            'world_config_user': 'world_config_user_prompt.txt',
            'player_config_system': 'player_config_system_prompt.txt',
            'player_config_user': 'player_config_user_prompt.txt',
            'object_config_system': 'object_config_system_prompt.txt',
            'object_config_user': 'object_config_user_prompt.txt',
            'spawn_config_system': 'spawn_config_system_prompt.txt',
            'spawn_config_user': 'spawn_config_user_prompt.txt',
        }
        
        for key, filename in prompt_files.items():
            filepath = self.prompts_dir / filename
            if filepath.exists():
                with open(filepath, 'r', encoding='utf-8') as f:
                    prompts[key] = f.read().strip()
            else:
                print(f"Warning: Prompt file not found: {filepath}")
                prompts[key] = ""
        
        return prompts
    
    def _detect_provider(self, model: str) -> str:
        """Detect which provider a model belongs to"""
        # Check if model is in our mapping
        if model in self.MODEL_PROVIDERS:
            return self.MODEL_PROVIDERS[model]
        
        # Try to detect by model name prefix
        if model.startswith("gpt-"):
            return "openai"
        elif model.startswith("claude-"):
            return "anthropic"
        elif model.startswith("gemini-"):
            return "google"
        
        raise ValueError(f"Unknown model: {model}. Could not detect provider.")
    
    def _init_client(self):
        """Initialize the API client based on provider"""
        if self.provider == "openai":
            api_key = os.getenv('OPENAI_API_KEY')
            if not api_key:
                raise ValueError("OPENAI_API_KEY environment variable not set")
            self.client = OpenAI(api_key=api_key)
            
        elif self.provider == "anthropic":
            api_key = os.getenv('ANTHROPIC_API_KEY')
            if not api_key:
                raise ValueError("ANTHROPIC_API_KEY environment variable not set")
            self.client = Anthropic(api_key=api_key)
            
        elif self.provider == "google":
            # Get Vertex AI configuration from environment
            project = os.getenv('VERTEX_PROJECT', 'smallgami')
            location = os.getenv('VERTEX_LOCATION', 'global')
            
            # Create Vertex AI client
            self.client = genai.Client(
                vertexai=True,
                project=project,
                location=location
            )

            resp = self.client.models.generate_content(
                  model="gemini-3-flash-preview",
                  contents="give me the world best recipe for short ribs"
              )
            
            print(f" :: Vertex AI response: {resp.text}")
    
    def process_message(
        self, 
        message: str,
        history: list = None,
        world_config: dict = None,
        temperature: float = 0.7
    ) -> Dict[str, Any]:
        """
        Process a user message through the two-step agent pipeline.
        
        Step 1: Determine intent (chat vs generate_asset vs change_configuration)
        Step 2: Call appropriate function based on intent
        
        Args:
            message: The user's message
            history: Previous conversation history as list of dicts with 'role' and 'content'
            world_config: Current world configuration (for context and modification)
            temperature: The sampling temperature (0.0 to 1.0)
            
        Returns:
            A dictionary with:
            - intent: 'chat', 'generate_asset', or 'change_configuration'
            - response: The response (string for chat, CompositeObject dict for generate, WorldConfig dict for change_configuration)
            - reasoning: Why this intent was chosen
        """
        if history is None:
            history = []
            
        try:
            # Step 1: Detect intent
            intent_result = self._detect_intent(message, temperature)

            print(f" :: >>>  Intent result: {intent_result}")
            
            # Step 2: Process based on intent
            if intent_result.intent == "chat":
                response = self._handle_chat(message, history, temperature)
                return {
                    "intent": "chat",
                    "response": response,
                }
            elif intent_result.intent == "generate_asset":
                composite_object = self._generate_asset(message, history, temperature)
                return {
                    "intent": "generate_asset",
                    "response": composite_object.model_dump(),
                }
            elif intent_result.intent == "change_configuration":
                modified_world_config = self._change_world_config(message, world_config, temperature)
                return {
                    "intent": "change_configuration",
                    "response": modified_world_config.model_dump(),
                }
                
        except Exception as e:
            raise Exception(f"Error processing message: {str(e)}")
    
    def _detect_intent(self, message: str, temperature: float) -> IntentClassification:
        """
        Step 1: Detect user intent using structured output.
        
        Args:
            message: The user's message
            temperature: The sampling temperature
            
        Returns:
            IntentClassification with intent and reasoning
        """
        system_prompt = self.prompts['intent_system']
        user_prompt = self.prompts['intent_user'].format(user_message=message)
        
        if self.provider == "openai":
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                response_format=IntentClassification,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # Use regular JSON mode to avoid "compiled grammar too large" errors
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON with only this field: intent (must be exactly 'chat' or 'generate_asset')."
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                temperature=temperature,
            )
            
            # Parse the JSON response and validate with Pydantic
            response_text = response.content[0].text
            
            # Sometimes Claude wraps JSON in markdown code blocks, so extract it
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            # Filter to only keep the 'intent' field to match the schema
            return IntentClassification(intent=data.get("intent"))
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": IntentClassification.model_json_schema(),
            }
            
            full_message = f"{system_prompt}\n\n{user_prompt}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_message,
                config=config
            )
            data = json.loads(response.text)
            return IntentClassification(**data)
    
    def _handle_chat(self, message: str, history: list, temperature: float) -> str:
        """
        Handle a chat message (regular conversation).
        
        Args:
            message: The user's message
            history: Previous conversation history
            temperature: The sampling temperature
            
        Returns:
            The AI's response as a string
        """
        system_prompt = self.prompts['chat_system']
        
        # Build the messages list with history
        if self.provider == "openai":
            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(history)
            messages.append({"role": "user", "content": message})
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
            )
            return response.choices[0].message.content
        
        elif self.provider == "anthropic":
            # Anthropic doesn't support system messages in the messages array,
            # so we use the system parameter separately
            messages = list(history)
            messages.append({"role": "user", "content": message})
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=4096,
                system=system_prompt,
                messages=messages,
                temperature=temperature,
            )
            return response.content[0].text
        
        elif self.provider == "google":
            # Build conversation history as a single prompt
            conversation = f"{system_prompt}\n\n Here is the conversation history: "
            for msg in history:
                role = "User" if msg["role"] == "user" else "Assistant"
                conversation += f"{role}: {msg['content']}\n\n"
            conversation += f"\n\n Here is the user's current message you should respond to, you natural langauge text to respond (not JSON): "
            conversation += f"User: {message}"
            
            config = {"temperature": temperature}
            response = self.client.models.generate_content(
                model=self.model,
                contents=conversation,
                config=config
            )
            return response.text
    
    def _generate_asset(self, message: str, history: list, temperature: float) -> CompositeObject:
        """
        Generate a 3D composite asset using structured output.
        
        Args:
            message: The user's message describing the asset
            history: Previous conversation history for context
            temperature: The sampling temperature
            
        Returns:
            CompositeObject with the generated asset structure
        """
        system_prompt = self.prompts['composite_system']
        user_prompt = self.prompts['composite_user'].replace('____USER_MESSAGE____', message)
        
        if self.provider == "openai":
            messages = [{"role": "system", "content": system_prompt}]
            
            # Add history for context (but not too much to avoid token limits)
            # Only include the last few messages for context
            recent_history = history[-4:] if len(history) > 4 else history
            messages.extend(recent_history)
            messages.append({"role": "user", "content": user_prompt})
            
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=messages,
                temperature=temperature,
                response_format=CompositeObject,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # For complex schemas like CompositeObject, Claude's structured outputs
            # can fail with "compiled grammar too large" error.
            # Instead, we use regular JSON mode and validate with Pydantic after.
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON matching the CompositeObject schema."
            
            messages = list(history[-4:] if len(history) > 4 else history)
            messages.append({"role": "user", "content": enhanced_user_prompt})
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=messages,
                temperature=temperature,
            )
            
            # Parse the JSON response and validate with Pydantic
            response_text = response.content[0].text
            
            # Sometimes Claude wraps JSON in markdown code blocks, so extract it
            if "```json" in response_text:
                # Extract JSON from code block
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                # Extract from generic code block
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            return CompositeObject(**data)
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": CompositeObject.model_json_schema(),
            }
            
            # Build conversation with history
            conversation = f"{system_prompt}\n\n"
            recent_history = history[-4:] if len(history) > 4 else history
            for msg in recent_history:
                role = "User" if msg["role"] == "user" else "Assistant"
                conversation += f"{role}: {msg['content']}\n\n"
            conversation += f"User: {user_prompt}"
            
            response = self.client.models.generate_content(
                model=self.model,
                contents=conversation,
                config=config
            )
            data = json.loads(response.text)
            return CompositeObject(**data)
    
    def _change_world_config(self, message: str, world_config: dict, temperature: float) -> WorldConfigChangeResponse:
        """
        Modify world configuration based on user request.
        
        Args:
            message: The user's message describing the desired changes
            world_config: Current world configuration as a dictionary
            temperature: The sampling temperature
            
        Returns:
            WorldConfigChangeResponse with the modified configuration and a summary of changes
        """
        system_prompt = self.prompts['world_config_system']
        
        # Convert world_config dict to JSON string for the prompt
        world_config_json = json.dumps(world_config, indent=2) if world_config else "{}"
        
        user_prompt = self.prompts['world_config_user'].replace('____USER_MESSAGE____', message)
        user_prompt = user_prompt.replace('____WORLD_CONFIG____', world_config_json)
        
        if self.provider == "openai":
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                response_format=WorldConfigChangeResponse,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # Use regular JSON mode and validate with Pydantic
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON matching the WorldConfigChangeResponse schema with fields: worldConfig (complete world config) and summary (brief description of changes)."
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                temperature=temperature,
            )
            
            # Parse the JSON response and validate with Pydantic
            response_text = response.content[0].text
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            return WorldConfigChangeResponse(**data)
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": WorldConfigChangeResponse.model_json_schema(),
            }
            
            full_message = f"{system_prompt}\n\n{user_prompt}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_message,
                config=config
            )
            data = json.loads(response.text)
            return WorldConfigChangeResponse(**data)
    
    def _change_player_config(self, message: str, player_config: dict, temperature: float) -> PlayerConfigChangeResponse:
        """
        Modify player configuration based on user request.
        
        Args:
            message: The user's message describing the desired changes
            player_config: Current player configuration as a dictionary
            temperature: The sampling temperature
            
        Returns:
            PlayerConfigChangeResponse with the modified configuration and a summary of changes
        """
        system_prompt = self.prompts['player_config_system']
        
        # Convert player_config dict to JSON string for the prompt
        player_config_json = json.dumps(player_config, indent=2) if player_config else "{}"
        
        user_prompt = self.prompts['player_config_user'].replace('____USER_MESSAGE____', message)
        user_prompt = user_prompt.replace('____PLAYER_CONFIG____', player_config_json)
        
        if self.provider == "openai":
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                response_format=PlayerConfigChangeResponse,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # Use regular JSON mode and validate with Pydantic
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON matching the PlayerConfigChangeResponse schema with fields: playerConfig (complete player config) and summary (brief description of changes)."
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                temperature=temperature,
            )
            
            # Parse the JSON response and validate with Pydantic
            response_text = response.content[0].text
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            return PlayerConfigChangeResponse(**data)
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": PlayerConfigChangeResponse.model_json_schema(),
            }
            
            full_message = f"{system_prompt}\n\n{user_prompt}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_message,
                config=config
            )
            data = json.loads(response.text)
            return PlayerConfigChangeResponse(**data)
    
    def _change_object_config(self, message: str, object_config: dict, world_description: str, mechanism: str, mechanism_config: Optional[Dict[str, Any]], temperature: float) -> ObjectConfigChangeResponse:
        """
        Modify object configuration based on user request.
        
        Args:
            message: The user's message describing the desired changes
            object_config: Current object configuration as a dictionary
            world_description: Description of the world for context
            mechanism: Game mechanism type (e.g., 'christmas', 'flappy_bird')
            mechanism_config: Configuration for the current mechanism (objects, description, narrative)
            temperature: The sampling temperature
            
        Returns:
            ObjectConfigChangeResponse with the modified configuration and a summary of changes
        """
        system_prompt = self.prompts['object_config_system']
        
        # Build dynamic mechanism constraints based on mechanism_config
        if mechanism_config and 'objects' in mechanism_config:
            mechanism_objects = mechanism_config.get('objects', {})
            mechanism_desc = mechanism_config.get('description', '')
            
            # Build constraints section dynamically
            mechanism_constraints = f"### {mechanism} ({mechanism_desc})\n"
            for obj_key, obj_desc in mechanism_objects.items():
                # Determine the role based on description keywords
                if any(keyword in obj_desc.lower() for keyword in ['avoid', 'dodge', 'hazard', 'obstacle', 'must avoid']):
                    role = "hazard"
                    collision_type = "die"
                elif any(keyword in obj_desc.lower() for keyword in ['catch', 'collect', 'reward', 'get']):
                    role = "collectible"
                    collision_type = "score"
                else:
                    role = "interactive object"
                    collision_type = "varies"
                
                if collision_type in ["die", "score"]:
                    mechanism_constraints += f"- **{obj_key}**: MUST ALWAYS be a {role} → onPlayerCollision.player MUST be \"{collision_type}\"\n"
                else:
                    mechanism_constraints += f"- **{obj_key}**: {obj_desc}\n"
            
            mechanism_constraints += "- You CAN change: visual appearance, size, speed, name\n"
            mechanism_constraints += "- You CANNOT change: the core role (hazard vs collectible)\n"
            
            # Replace the hardcoded mechanism constraints section
            system_prompt = system_prompt.replace(
                "### christmas (Dodge & Catch)\n- **box1**: MUST ALWAYS be a hazard → onPlayerCollision.player MUST be \"die\"\n- **box2**: MUST ALWAYS be a collectible → onPlayerCollision.player MUST be \"score\"\n- You CAN change: visual appearance, size, speed, name\n- You CANNOT change: the core role (hazard vs collectible)\n\n### running_christmas (Run & Catch)\n- **box1**: MUST ALWAYS be a hazard → onPlayerCollision.player MUST be \"die\"\n- **box2**: MUST ALWAYS be a collectible → onPlayerCollision.player MUST be \"score\"\n- Objects should have negative X velocity (moving toward player)\n- You CAN change: visual appearance, size, speed, name\n- You CANNOT change: the core role (hazard vs collectible)\n\n### Other mechanisms (flappy_bird, platform_forest, platform_jump)\n- Respect the object's intended gameplay role\n- Pipes/obstacles should remain hazards\n- Platforms should maintain jump behavior\n- Collectibles should maintain score behavior",
                mechanism_constraints
            )
        
        # Convert object_config dict to JSON string for the prompt
        object_config_json = json.dumps(object_config, indent=2) if object_config else "{}"
        
        # Get current object ID to build specific constraints
        object_id = object_config.get('id', '') if object_config else ''
        object_role_constraint = ""
        
        if mechanism_config and 'objects' in mechanism_config and object_id:
            mechanism_objects = mechanism_config.get('objects', {})
            if object_id in mechanism_objects:
                obj_desc = mechanism_objects[object_id]
                if any(keyword in obj_desc.lower() for keyword in ['avoid', 'dodge', 'hazard', 'obstacle', 'must avoid']):
                    object_role_constraint = f"\n**CRITICAL for object '{object_id}'**: This object MUST remain a hazard (onPlayerCollision.player = \"die\"). You can change its appearance but NOT its role."
                elif any(keyword in obj_desc.lower() for keyword in ['catch', 'collect', 'reward', 'get']):
                    object_role_constraint = f"\n**CRITICAL for object '{object_id}'**: This object MUST remain a collectible (onPlayerCollision.player = \"score\"). You can change its appearance but NOT its role."
        
        user_prompt = self.prompts['object_config_user'].replace('____USER_MESSAGE____', message)
        user_prompt = user_prompt.replace('____OBJECT_CONFIG____', object_config_json)
        user_prompt = user_prompt.replace('____WORLD_DESCRIPTION____', world_description or "No world description provided")
        user_prompt = user_prompt.replace('____MECHANISM____', mechanism or "Unknown mechanism")
        
        # Add the dynamic role constraint
        if object_role_constraint:
            user_prompt = user_prompt.replace(
                "- **CRITICAL**: Respect mechanism constraints! For \"christmas\" and \"running_christmas\":\n  * If object id is \"box1\", it MUST remain a hazard (onPlayerCollision.player = \"die\")\n  * If object id is \"box2\", it MUST remain a collectible (onPlayerCollision.player = \"score\")\n  * You can change appearance, size, speed, name - but NOT the core role",
                object_role_constraint
            )
        
        if self.provider == "openai":
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                response_format=ObjectConfigChangeResponse,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # Use regular JSON mode and validate with Pydantic
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON matching the ObjectConfigChangeResponse schema with fields: objectConfig (complete object config with UNCHANGED id field) and summary (brief description of changes)."
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                temperature=temperature,
            )
            response_text = response.content[0].text
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            return ObjectConfigChangeResponse(**data)
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": ObjectConfigChangeResponse.model_json_schema(),
            }
            
            full_message = f"{system_prompt}\n\n{user_prompt}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_message,
                config=config
            )
            data = json.loads(response.text)
            return ObjectConfigChangeResponse(**data)
    
    def _change_spawn_config(self, modified_object: dict, object_change_summary: str, spawn_configs: list, world_description: str, temperature: float) -> SpawnConfigChangeResponse:
        """
        Modify spawn configurations based on object changes.
        
        Args:
            modified_object: The modified object configuration
            object_change_summary: Summary of what changed in the object
            spawn_configs: Current spawn configurations list
            world_description: Description of the world for context
            temperature: The sampling temperature
            
        Returns:
            SpawnConfigChangeResponse with the modified spawn configurations and a summary
        """
        system_prompt = self.prompts['spawn_config_system']
        
        # Convert configurations to JSON strings for the prompt
        modified_object_json = json.dumps(modified_object, indent=2)
        spawn_configs_json = json.dumps(spawn_configs, indent=2)
        
        user_prompt = self.prompts['spawn_config_user'].replace('____MODIFIED_OBJECT____', modified_object_json)
        user_prompt = user_prompt.replace('____OBJECT_CHANGE_SUMMARY____', object_change_summary)
        user_prompt = user_prompt.replace('____SPAWN_CONFIGS____', spawn_configs_json)
        user_prompt = user_prompt.replace('____WORLD_DESCRIPTION____', world_description or "No world description provided")
        
        if self.provider == "openai":
            response = self.client.chat.completions.parse(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=temperature,
                response_format=SpawnConfigChangeResponse,
            )
            return response.choices[0].message.parsed
        
        elif self.provider == "anthropic":
            # Use regular JSON mode and validate with Pydantic
            enhanced_user_prompt = user_prompt + "\n\nIMPORTANT: Return your response as valid JSON matching the SpawnConfigChangeResponse schema with fields: spawnConfigs (complete list of all spawn controllers) and summary (brief description of changes)."
            
            response = self.client.messages.create(
                model=self.model,
                max_tokens=8192,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": enhanced_user_prompt}
                ],
                temperature=temperature,
            )
            response_text = response.content[0].text
            
            # Extract JSON from markdown code blocks if present
            if "```json" in response_text:
                json_start = response_text.find("```json") + 7
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            elif "```" in response_text:
                json_start = response_text.find("```") + 3
                json_end = response_text.find("```", json_start)
                response_text = response_text[json_start:json_end].strip()
            
            data = json.loads(response_text)
            return SpawnConfigChangeResponse(**data)
        
        elif self.provider == "google":
            # Google Gemini Vertex AI with JSON schema
            config = {
                "temperature": temperature,
                "response_mime_type": "application/json",
                "response_schema": SpawnConfigChangeResponse.model_json_schema(),
            }
            
            full_message = f"{system_prompt}\n\n{user_prompt}"
            response = self.client.models.generate_content(
                model=self.model,
                contents=full_message,
                config=config
            )
            data = json.loads(response.text)
            return SpawnConfigChangeResponse(**data)
    
    def chat(
        self, 
        message: str, 
        system_prompt: str = "You are a helpful assistant for creating games. Help users design and modify their games with creative suggestions and technical guidance.",
        temperature: float = 0.7
    ) -> str:
        """
        Legacy method for backwards compatibility.
        Send a message to the LLM and get a response.
        
        Args:
            message: The user's message
            system_prompt: The system prompt to guide the AI's behavior
            temperature: The sampling temperature (0.0 to 1.0)
            
        Returns:
            The AI's response as a string
        """
        try:
            if self.provider == "openai":
                return self._chat_openai(message, system_prompt, temperature)
            elif self.provider == "anthropic":
                return self._chat_anthropic(message, system_prompt, temperature)
            elif self.provider == "google":
                return self._chat_google(message, system_prompt, temperature)
        except Exception as e:
            raise Exception(f"Error calling {self.provider} ({self.model}): {str(e)}")
    
    def _chat_openai(self, message: str, system_prompt: str, temperature: float) -> str:
        """Chat with OpenAI GPT"""
        response = self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": message}
            ],
            temperature=temperature,
        )
        return response.choices[0].message.content
    
    def _chat_anthropic(self, message: str, system_prompt: str, temperature: float) -> str:
        """Chat with Anthropic Claude"""
        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            system=system_prompt,
            messages=[
                {"role": "user", "content": message}
            ],
            temperature=temperature,
        )
        return response.content[0].text
    
    def _chat_google(self, message: str, system_prompt: str, temperature: float) -> str:
        """Chat with Google Gemini Vertex AI"""
        # Gemini includes system prompt in the message
        full_message = f"{system_prompt}\n\nUser: {message}"
        
        config = {"temperature": temperature}
        response = self.client.models.generate_content(
            model=self.model,
            contents=full_message,
            config=config
        )
        return response.text
    
    def switch_model(self, model: str):
        """
        Switch to a different model.
        
        Args:
            model: The new model to use
        """
        self.model = model
        self.provider = self._detect_provider(model)
        self._init_client()
        print(f" :: Switched to {model} (provider: {self.provider})")
    
    def get_info(self) -> dict:
        """Get information about the current configuration"""
        return {
            "model": self.model,
            "provider": self.provider,
            "available_models": list(self.MODEL_PROVIDERS.keys())
        }
    
    def _suggest_block_changes(
        self,
        changed_block_type: str,
        old_content: str,
        new_content: str,
        mechanism: str,
        mechanism_config: Optional[Dict[str, Any]] = None,
        temperature: float = 0.7
    ) -> BlockChangeSuggestionResponse:
        # Extract mechanism information
        if mechanism_config:
            mechanism_description = mechanism_config.get('description', '')
            mechanism_objects = mechanism_config.get('objects', {})
            mechanism_narrative = mechanism_config.get('narrative', '')
        else:
            # Fallback to default dodge & catch
            mechanism_description = 'Player must dodge falling hazards and catch falling collectibles'
            mechanism_objects = {
                'box1': 'a hazard that the player must avoid',
                'box2': 'a collectible that the player will catch to get rewards.'
            }
            mechanism_narrative = '##player is in ##world. Avoid ##box1 and get those ##box2!'
        
        # Build the object fields description dynamically
        object_fields_desc = []
        object_fields_json = []
        for obj_key, obj_desc in mechanism_objects.items():
            object_fields_desc.append(f"- {obj_key}: ONE specific {obj_desc} (2-5 words, concrete and specific)")
            object_fields_json.append(f'  "{obj_key}": "one specific {obj_key} description"')
        
        objects_desc_str = '\n'.join(object_fields_desc)
        objects_json_str = ',\n'.join(object_fields_json)
        
        # Create a prompt to ask the LLM what else should change
        system_prompt = f"""You are an expert game designer creating a cohesive thematic experience for a {mechanism} game.

GAME MECHANISM: {mechanism_description}

CRITICAL RULES:
1. Be DETERMINISTIC - your response will be used DIRECTLY to generate game assets
2. Specify EXACTLY ONE thing for each field - NO alternatives, NO "or", NO "and"
3. Be CONCRETE and SPECIFIC - "space helmet astronaut" not "astronaut or space explorer"
4. Make it ASSET-READY - descriptions must be clear enough for visual generation
5. If the block is the one user is changing, do not suggest to change it again, use the new content as the new description!

For this game mechanism, you MUST define all of these elements:
- player: ONE specific player character (e.g., "red cape superhero", "medieval knight with sword")
- world: ONE specific environment/setting (e.g., "starry night sky", "ancient stone castle")
{objects_desc_str}
- narrative: A single narrative sentence describing the complete game (following this template: "{mechanism_narrative}")
- transition: An ENGAGING transition sentence that describes the event transforming the game from the old theme to the new theme (e.g., "A portal opened and transported you to a magical realm!", "The snow melted away revealing a hidden garden!", "A magical spell transformed everything!")

IMPORTANT:
- Each description must be 2-5 words, specific and concrete
- All objects must be clearly different and thematically consistent
- All elements must work together as one cohesive theme
- NO OPTIONS - choose ONE specific thing for each field
- The transition should be EXCITING and make sense between the old and new themes

Your response MUST be a JSON object:
{{
  "player": "one specific player",
  "world": "one specific world",
{objects_json_str},
  "narrative": "narrative following the template",
  "transition": "engaging transition sentence"
}}"""

        user_prompt = f"""The {changed_block_type} block has changed in a {mechanism} game:

Old content: "{old_content}"
New content: "{new_content}"

Based on this change, define ONE cohesive theme for the entire game. Provide EXACTLY ONE specific description for each block (player, world, {', '.join(mechanism_objects.keys())}) and a narrative.

IMPORTANT for transition: Create an ENGAGING event that explains how the game transforms from the old theme to the new theme. Make it exciting and magical! Examples:
- If going from winter to summer: "The winter sun melted the snow, revealing a vibrant garden!"
- If going from space to ocean: "Your spaceship dove through a portal into the deep sea!"
- If going from city to forest: "A magical mist swept you away into an enchanted forest!"

Remember: NO alternatives, NO "or" - just ONE concrete thing for each field that can be used directly for asset generation."""

        try:
            if self.provider == "openai":
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                    response_format={"type": "json_object"}
                )
                response_text = response.choices[0].message.content
                data = json.loads(response_text)
                return BlockChangeSuggestionResponse(**data)
            
            elif self.provider == "anthropic":
                response = self.client.messages.create(
                    model=self.model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=[
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=temperature,
                )
                response_text = response.content[0].text
                
                # Extract JSON from markdown code blocks if present
                if "```json" in response_text:
                    json_start = response_text.find("```json") + 7
                    json_end = response_text.find("```", json_start)
                    response_text = response_text[json_start:json_end].strip()
                elif "```" in response_text:
                    json_start = response_text.find("```") + 3
                    json_end = response_text.find("```", json_start)
                    response_text = response_text[json_start:json_end].strip()
                
                data = json.loads(response_text)
                return BlockChangeSuggestionResponse(**data)
            
            elif self.provider == "google":
                full_message = f"{system_prompt}\n\n{user_prompt}"
                config = {
                    "temperature": temperature,
                    "response_mime_type": "application/json",
                    "response_schema": BlockChangeSuggestionResponse.model_json_schema(),
                }
                
                response = self.client.models.generate_content(
                    model=self.model,
                    contents=full_message,
                    config=config
                )
                data = json.loads(response.text)
                return BlockChangeSuggestionResponse(**data)
        
        except Exception as e:
            print(f"Error suggesting block changes: {str(e)}")
            import traceback
            traceback.print_exc()
            
            # Build default response with dynamic object keys
            default_response = {
                "player": "hero",
                "world": "fantasy world",
                "narrative": "Error generating suggestions"
            }
            
            # Add default values for mechanism objects
            if mechanism_config and 'objects' in mechanism_config:
                for obj_key in mechanism_config['objects'].keys():
                    default_response[obj_key] = f"default {obj_key}"
            else:
                # Fallback defaults
                default_response["box1"] = "obstacle"
                default_response["box2"] = "treasure"
            
            return BlockChangeSuggestionResponse(**default_response)