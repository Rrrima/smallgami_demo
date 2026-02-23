import os
import json
import concurrent.futures
from pathlib import Path
from typing import Dict, List, Any, Optional
from _utils import make_schema_strict_compatible
from schema import (
    JumpingGameDSLConfig,
    JumpingPlayerConfig,
    WorldConfig,
    ObjectConfig,
    PlatformConfig,
    CollectableConfig,
    EffectConfig,
    Vector3Config,
    Color3Config,
    JumpGameDescription
)


class GameConfigurator:
    def __init__(self, game_id: str, askllm_func, game_description: Dict[str, Any]):
        """
        Initialize GameConfigurator with game context.
        
        Args:
            game_id: Unique identifier for the game
            askllm_func: Function to call LLM (should match Gami.askLLM signature)
            game_description: Game description dictionary from JumpGameDescription
        """
        self.game_id = game_id
        self.askllm = askllm_func
        self.game_description = game_description
        self.prompts_dir = Path(__file__).resolve().parent / 'prompts'
        
    def _load_prompt(self, prompt_filename: str) -> str:
        """Load prompt from file in prompts directory."""
        prompt_path = self.prompts_dir / prompt_filename
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

    def _generate_player_config(self) -> JumpingPlayerConfig:
        """Generate player configuration based on game description."""
        try:
            # Load prompts
            system_prompt = self._load_prompt('jumping_player_config_system_prompt.txt')
            user_prompt_template = self._load_prompt('jumping_player_config_user_prompt.txt')
            
            # Format the user prompt with game description data
            user_prompt = user_prompt_template.format(
                game_description=self.game_description.get('story', ''),
                player_visual=self.game_description.get('player', {}).get('character_visual', ''),
                motion_style=self.game_description.get('player', {}).get('motion_style', ''),
                player_story=self.game_description.get('player', {}).get('story', ''),
                player_goal=self.game_description.get('player', {}).get('goal', ''),
                visual_style=self.game_description.get('visual_style', '')
            )

            # Create response format schema
            schema = JumpingPlayerConfig.model_json_schema()
            make_schema_strict_compatible(schema)
            
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": "jumping_player_config",
                    "schema": schema,
                    "strict": True
                }
            }
            
            # Call LLM to generate player config
            print("🎮 Generating player configuration...")
            result = self.askllm(user_prompt, system_prompt, response_format, temperature=0.7)
            
            if isinstance(result, str):
                result = json.loads(result)
            
            # Validate and return as PlayerConfig object
            player_config = JumpingPlayerConfig(**result)
            print("✅ Player configuration generated successfully!")
            return player_config
            
        except Exception as e:
            print(f"❌ Error generating player config: {str(e)}")
            raise

    def _generate_world_config(self) -> WorldConfig:
        """Generate world configuration based on game description."""
        try:
            # Load prompts
            system_prompt = self._load_prompt('jumping_world_config_system_prompt.txt')
            user_prompt_template = self._load_prompt('jumping_world_config_user_prompt.txt')
            
            # Format the user prompt with game description data
            user_prompt = user_prompt_template.format(
                game_description=self.game_description.get('story', ''),
                world_description=self.game_description.get('world', ''),
                visual_style=self.game_description.get('visual_style', '')
            )

            # Create response format schema
            schema = WorldConfig.model_json_schema()
            make_schema_strict_compatible(schema)
            
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": "jumping_world_config",
                    "schema": schema,
                    "strict": True
                }
            }
            
            # Call LLM to generate world config
            print("🌍 Generating world configuration...")
            result = self.askllm(user_prompt, system_prompt, response_format, temperature=0.7)
            
            if isinstance(result, str):
                result = json.loads(result)
            
            # Validate and return as WorldConfig object
            world_config = WorldConfig(**result)
            print("✅ World configuration generated successfully!")
            return world_config
            
        except Exception as e:
            print(f"❌ Error generating world config: {str(e)}")
            raise

    def _generate_objects_config(self) -> ObjectConfig:
        """Generate objects configuration based on game description."""
        try:
            # Load prompts
            system_prompt = self._load_prompt('jumping_objects_config_system_prompt.txt')
            user_prompt_template = self._load_prompt('jumping_objects_config_user_prompt.txt')
            
            # Format platform descriptions
            platforms = self.game_description.get('platforms', [])
            platform_descriptions = '\n'.join([
                f"Platform {i+1}: Visual - {platform.get('visual_description', '')}, Effect - {platform.get('effect', '')}"
                for i, platform in enumerate(platforms)
            ]) if platforms else "No specific platform descriptions provided"
            
            # Format collectable descriptions
            collectables = self.game_description.get('collectables', [])
            collectable_descriptions = '\n'.join([
                f"Collectable {i+1}: Visual - {collectable.get('visual_description', '')}, Effect - {collectable.get('effect', '')}"
                for i, collectable in enumerate(collectables)
            ]) if collectables else "No specific collectable descriptions provided"
            
            # Format the user prompt with game description data
            user_prompt = user_prompt_template.format(
                game_description=self.game_description.get('story', ''),
                platform_descriptions=platform_descriptions,
                collectable_descriptions=collectable_descriptions,
                visual_style=self.game_description.get('visual_style', '')
            )

            # Create response format schema
            schema = ObjectConfig.model_json_schema()
            make_schema_strict_compatible(schema)
            
            response_format = {
                "type": "json_schema",
                "json_schema": {
                    "name": "jumping_objects_config",
                    "schema": schema,
                    "strict": True
                }
            }
            
            # Call LLM to generate objects config
            print("🎯 Generating objects configuration...")
            result = self.askllm(user_prompt, system_prompt, response_format, temperature=0.7)
            
            if isinstance(result, str):
                result = json.loads(result)
            
            # Validate and return as ObjectConfig object
            objects_config = ObjectConfig(**result)
            print("✅ Objects configuration generated successfully!")
            return objects_config
            
        except Exception as e:
            print(f"❌ Error generating objects config: {str(e)}")
            raise

    def generate_jump_dsl_config(self) -> str:
        """
        Generate complete jumping game DSL configuration concurrently.
        
        Returns:
            str: Path to the generated JSON configuration file
        """
        try:
            print(f"🚀 Starting concurrent DSL configuration generation for game: {self.game_id}")
            
            # Generate all configurations concurrently
            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                # Submit all configuration generation tasks
                future_player = executor.submit(self._generate_player_config)
                future_world = executor.submit(self._generate_world_config)
                future_objects = executor.submit(self._generate_objects_config)
                
                # Collect results
                player_config = future_player.result()
                world_config = future_world.result()
                objects_config = future_objects.result()
            
            # Create the complete DSL configuration
            dsl_config = JumpingGameDSLConfig(
                world=world_config,
                player=player_config,
                objects=objects_config
            )
            
            # Convert to dictionary for JSON serialization
            dsl_config_dict = dsl_config.model_dump()
            
            # Create output directory if it doesn't exist
            output_dir = Path(__file__).parent / '_data' / self.game_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Generate output filename
            output_filename = f"jumping_game_dsl_config.json"
            output_path = output_dir / output_filename
            
            # Write the configuration to JSON file
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(dsl_config_dict, f, indent=2, ensure_ascii=False)
            
            print(f"✅ DSL configuration written to: {output_path}")
            print(f"📊 Configuration Summary:")
            print(f"  - Player: ✅ Generated")
            print(f"  - World: ✅ Generated") 
            print(f"  - Platforms: {len(objects_config.platforms)} configured")
            print(f"  - Collectables: {len(objects_config.collectables)} configured")
            
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Error generating DSL configuration: {str(e)}")
            raise
