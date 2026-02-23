import os
import json
import requests
import asyncio
import httpx
from pathlib import Path
from dotenv import load_dotenv
from typing import Dict, List, Any, Optional
from concurrent.futures import ThreadPoolExecutor
from aiolimiter import AsyncLimiter

class AudioManager:
    def __init__(self, game_id: str, llm_endpoint: str, llm_payload: dict):
        self.game_id = game_id
        self.llm_endpoint = llm_endpoint
        self.llm_payload = llm_payload
        
        # Load environment variables
        env_path = Path(__file__).resolve().parents[1] / '.env'
        load_dotenv(dotenv_path=env_path)
        
        # Audio generation endpoint configuration
        self.audio_base_url = os.getenv("AUDIO_BASE_URL", "http://gcrsandbox388:9996")
        self.prompts_dir = Path(__file__).resolve().parent / 'prompts'
        
        # Rate limiter for audio API (max 3 concurrent requests)
        self.audio_limiter = AsyncLimiter(3, 1)  # 3 requests per second
    
    def _load_prompt(self, prompt_filename):
        """Load prompt from file in prompts directory."""
        prompt_path = self.prompts_dir / prompt_filename
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    def generate_sound_prompt(self, sound_type: str, sound_context: str,
                            visual_style: str, world_description: str, narrative_theme: str = "") -> str:
        """Generate a sound generation prompt from game context and sound type"""
        system_prompt = self._load_prompt("sound_prompt_system_prompt.txt")
        user_prompt_template = self._load_prompt("sound_prompt_user_prompt.txt")
        
        # Replace placeholders in the user prompt
        formatted_user_prompt = user_prompt_template.replace("__VISUAL_STYLE__", visual_style)
        formatted_user_prompt = formatted_user_prompt.replace("__WORLD_DESCRIPTION__", world_description)
        formatted_user_prompt = formatted_user_prompt.replace("__NARRATIVE_THEME__", narrative_theme)
        formatted_user_prompt = formatted_user_prompt.replace("__SOUND_TYPE__", sound_type)
        formatted_user_prompt = formatted_user_prompt.replace("__SOUND_CONTEXT__", sound_context)
        
        # Call LLM to generate sound prompt
        payload = {
            "prompt": formatted_user_prompt,
            "system_prompt": system_prompt,
            "temperature": 0.7,
            **self.llm_payload,
        }
        
        try:
            response = requests.post(self.llm_endpoint, json=payload)
            response.raise_for_status()
            
            result = response.json()
            sound_prompt = result.strip() if isinstance(result, str) else str(result).strip()
            
            print(f" > Generated sound prompt for {sound_type}: {sound_prompt}")
            return sound_prompt
            
        except Exception as e:
            print(f"Error generating sound prompt: {str(e)}")
            # Fallback to a basic prompt
            return f"{sound_type.lower()} sound effect"
    
    async def generate_audio_async(self, prompt: str, sound_name: str, sound_type: str, asset_id: int = 0) -> Optional[Dict[str, Any]]:
        """Generate audio using Stable Audio API"""
        async with self.audio_limiter:
            try:
                # Set audio length and steps based on sound type
                if sound_type in ("JUMP", "COLLISION", "PICKUP"):
                    length, steps = 1, 25  # Short sound effects
                elif sound_type == "AMBIENT":
                    length, steps = 6, 25  # Longer ambient sounds
                else:
                    length, steps = 2, 25  # Default medium length
                
                payload = {
                    "prompt": prompt,
                    "length": str(length),
                    "steps": str(steps)
                }
                
                url = f"{self.audio_base_url}/"
                headers = {"Content-Type": "application/json"}
                
                print(f"[Sound {asset_id}] Generating audio: {sound_name} with prompt: {prompt}")
                
                async with httpx.AsyncClient(timeout=httpx.Timeout(120.0)) as client:
                    response = await client.post(url, json=payload, headers=headers)
                    response.raise_for_status()
                    
                    # Check content type
                    content_type = response.headers.get("Content-Type", "")
                    if "audio/wav" not in content_type:
                        error_text = response.text
                        raise RuntimeError(f"Expected audio/wav, got {content_type}. Body: {error_text[:500]}")
                    
                    audio_bytes = await response.aread()
                    if len(audio_bytes) < 4 or audio_bytes[:4] != b"RIFF":
                        raise RuntimeError("Invalid WAV header (missing RIFF)")
                    
                    print(f"[Sound {asset_id}] ✅ Generated {sound_name}: {len(audio_bytes)} bytes")
                    
                    return {
                        "sound_name": sound_name,
                        "sound_type": sound_type,
                        "prompt": prompt,
                        "audio_data": audio_bytes,
                        "asset_id": asset_id,
                        "success": True,
                    }
                    
            except Exception as e:
                print(f"❌ Error generating audio '{sound_name}': {e}")
                return {
                    "sound_name": sound_name,
                    "sound_type": sound_type,
                    "prompt": prompt,
                    "audio_data": None,
                    "asset_id": asset_id,
                    "success": False,
                    "error": str(e)
                }
    
    def save_audio_to_folder(self, audio_data: bytes, sound_name: str, game_id: str = None) -> Optional[str]:
        """Save WAV audio to assets folder"""
        try:
            if not audio_data:
                print(f"No audio data to save for {sound_name}")
                return None
            
            # Use the instance game_id if not provided
            if game_id is None:
                game_id = self.game_id
                
            # Create output directory (server-side assets folder)
            output_dir = Path(__file__).parent / 'assets' / 'generated' / game_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
            # Also save to frontend public assets folder
            frontend_assets_dir = Path("../demo/public/assets") / game_id
            frontend_assets_dir.mkdir(parents=True, exist_ok=True)
            
            filename = f"{sound_name}.wav"
            
            # Save to both locations
            server_destination = output_dir / filename
            frontend_destination = frontend_assets_dir / filename
            
            with open(server_destination, 'wb') as f:
                f.write(audio_data)
            
            with open(frontend_destination, 'wb') as f:
                f.write(audio_data)
            
            print(f"✅ Audio saved: {server_destination} and {frontend_destination}")
            return filename
                
        except Exception as e:
            print(f"❌ Error saving audio '{sound_name}': {e}")
            return None
    
    def generate_ambient_sound_prompt(self, game_description: Dict[str, Any]) -> str:
        """Generate prompt for ambient background sound"""
        visual_style = game_description.get('visual_style', 'whimsical')
        world_description = game_description.get('world', {'description': 'magical world'}).get('description','magical world')
        narrative = game_description.get('narrative', {"current_story":""}).get('current_story','')        

        context = f"Background atmosphere for {world_description}"
        
        return self.generate_sound_prompt(
            sound_type="AMBIENT",
            sound_context=context,
            visual_style=visual_style,
            world_description=world_description,
            narrative_theme=narrative
        )
    
    def generate_platform_jump_sound_prompt(self, platform: Dict[str, Any], game_description: Dict[str, Any]) -> str:
        """Generate prompt for platform jump sound effect"""
        platform_name = platform.get('name', 'platform')
        platform_description = platform.get('description', 'platform')
        
        visual_style = game_description.get('visual_style', 'whimsical')
        world_description = game_description.get('world', {'description': 'magical world'}).get('description','magical world')
        narrative = game_description.get('narrative', {"current_story":""}).get('current_story','')
        
        context = f"Player jumping on {platform_name}. The platform is {platform_description}"
        
        return self.generate_sound_prompt(
            sound_type="JUMP",
            sound_context=context,
            visual_style=visual_style,
            world_description=world_description,
            narrative_theme=narrative
        )
    
    def generate_collectable_pickup_sound_prompt(self, collectable: Dict[str, Any], game_description: Dict[str, Any]) -> str:
        """Generate prompt for collectable pickup sound effect"""
        collectable_name = collectable.get('name', 'item')
        
        visual_style = game_description.get('visual_style', 'whimsical')
        world_description = game_description.get('world', 'magical world')
        narrative = game_description.get('narrative', '')
        
        context = f"Picking up {collectable_name}, magical collection sound"
        
        return self.generate_sound_prompt(
            sound_type="PICKUP",
            sound_context=context,
            visual_style=visual_style,
            world_description=world_description,
            narrative_theme=narrative
        )

    
    async def generate_jump_game_audio_assets(self, game_description: Dict[str, Any]) -> Dict[str, str]:
        """Generate all audio assets for a jumping game"""
        print(f"🎵 Starting audio generation for jump game: {game_description.get('game_name', 'Unknown')}")
        
        audio_tasks = []
        task_id = 0
        
        # 1. Generate ambient sound
        ambient_prompt = self.generate_ambient_sound_prompt(game_description)
        audio_tasks.append(
            asyncio.create_task(
                self.generate_audio_async(ambient_prompt, "ambient", "AMBIENT", task_id)
            )
        )
        task_id += 1
        
        # 2. Generate platform jump sounds
        platforms = game_description.get('platforms', [])
        for i, platform in enumerate(platforms):
            platform_sound_prompt = self.generate_platform_jump_sound_prompt(platform, game_description)
            sound_name = f"jump_{platform.get('name', f'platform{i+1}')}"
            
            audio_tasks.append(
                asyncio.create_task(
                    self.generate_audio_async(platform_sound_prompt, sound_name, "JUMP", task_id)
                )
            )
            task_id += 1
        
        # do not generate collectable pickup sounds for the sake of time
        # 3. Generate collectable pickup sounds
        # collectables = jumping_config.get('objects', {}).get('collectables', [])
        # for i, collectable in enumerate(collectables):
        #     pickup_sound_prompt = self.generate_collectable_pickup_sound_prompt(collectable, game_description)
        #     sound_name = f"pickup_{collectable.get('id', f'collectable{i+1}')}"
            
        #     audio_tasks.append(
        #         asyncio.create_task(
        #             self.generate_audio_async(pickup_sound_prompt, sound_name, "PICKUP", task_id)
        #         )
        #     )
        #     task_id += 1
        
        # print(f"⚡ Launched {len(audio_tasks)} concurrent audio generation tasks!")
        
        # Execute all audio generation tasks concurrently
        results = await asyncio.gather(*audio_tasks, return_exceptions=True)
        
        # Process results and save audio files
        saved_audio_files = {}
        successful_sounds = 0
        
        for result in results:
            if isinstance(result, Exception):
                print(f"❌ Audio generation task failed with exception: {result}")
                continue
            
            if result and result.get('success'):
                # Save the audio file
                saved_path = self.save_audio_to_folder(
                    result['audio_data'],
                    result['sound_name'],
                    self.game_id
                )
                
                if saved_path:
                    saved_audio_files[result['sound_name']] = saved_path
                    successful_sounds += 1
                    print(f"✅ [Audio {result['asset_id']}] '{result['sound_name']}' ({result['sound_type']}) completed and saved")
                else:
                    print(f"❌ [Audio {result['asset_id']}] Failed to save '{result['sound_name']}'")
            else:
                asset_id = result.get('asset_id', 'unknown') if result else 'unknown'
                sound_name = result.get('sound_name', 'unknown') if result else 'unknown'
                error = result.get('error', 'Unknown error') if result else 'No result returned'
                print(f"❌ [Audio {asset_id}] Generation failed for '{sound_name}': {error}")
        
        print(f"\n🎯 Audio generation completed!")
        print(f"📊 Results: {successful_sounds}/{len(audio_tasks)} sounds generated successfully")
        
        if saved_audio_files:
            print(f"\n✅ Generated Audio Files:")
            for sound_name, filename in saved_audio_files.items():
                print(f"  🎵 {sound_name}: {filename}")
        
        return saved_audio_files
