import os, json
import requests
from termcolor import colored
from pathlib import Path
from dotenv import load_dotenv
import base64
import concurrent.futures
from typing import Dict, List, Any
from VisualManager import VisualManager
from AudioManager import AudioManager
from GameConfigurator import GameConfigurator
from _utils import make_schema_strict_compatible
from schema import (
    ShootingGameDSLConfig,
    JumpingGameDSLConfig,
    AssetConfig,
    ShootingPlayerConfig,
    JumpingPlayerConfig,
    AlienConfig,
    StarfieldConfig,
    AtmosphereConfig,
    WorldConfig,
    ObjectConfig,
    JumpGameDescription,
    ImageDecompositionConfig
)

class Gami: 
    def __init__(self, game_id:str, hotload=False):
        self.game_id = game_id
        self.hotload = hotload
        self.img_host_endpoint = "http://localhost:8000/files/"
        env_path = Path(__file__).resolve().parents[1] / '.env'
        load_dotenv(dotenv_path=env_path)
        
        vite_url_gpt = os.getenv("VITE_URL_GPT")
        if not vite_url_gpt:
            raise ValueError("VITE_URL_GPT environment variable is not set")

        
        self.llm_endpoint = vite_url_gpt + "askLLM"
        self.llm_payload = {
            "api_version": os.getenv("GPT_API_VERSION"),
            "deployment_name": os.getenv("GPT_DEPLOYMENT_NAME"),
            "endpoint": os.getenv("GPT_ENDPOINT"),
        }
        self.visual_manager = VisualManager(game_id,self.llm_endpoint,self.llm_payload)
        self.audio_manager = AudioManager(game_id,self.llm_endpoint,self.llm_payload)
        self.prompts_dir = Path(__file__).resolve().parent / 'prompts'

        self.factory_data = None
        self.game_dimensions = None
        self.game_description = None
        
        self.askllm = self.askLLM

        if self.hotload:
            self.factory_data = json.load(open(f"_data/{game_id}/factory_state.json", "r"))
            # self.game_dimensions = self.get_dimension_description(self.factory_data)
            # self.game_description = json.load(open(f"_data/{game_id}/jumping_game_description.json", "r"))
            print(f"{colored(' :: ', 'green')} Hotloaded game data for {colored(game_id, "black", 'on_cyan')}")
    
    def set_game_id(self, game_id: str):
        self.game_id = game_id

    def askLLM(self, prompt, system_prompt, response_format=None, temperature=None):
        payload = {
            "prompt": prompt,
            "system_prompt": system_prompt,
            **self.llm_payload,
        }
        if temperature:
            payload["temperature"] = temperature
        if response_format:
            payload["response_format"] = response_format
        
        try:
            response = requests.post(self.llm_endpoint, json=payload)
            
            # Check if response is successful
            if response.status_code != 200:
                raise Exception(f"API returned status code {response.status_code}: {response.text}")
            
            # Check if response has content
            if not response.text.strip():
                raise Exception("API returned empty response")
            
            return response.json()
            
        except requests.exceptions.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response text: {response.text}")
            raise Exception(f"Failed to parse JSON response: {e}")
        except requests.exceptions.RequestException as e:
            print(f"Request error: {e}")
            raise Exception(f"API request failed: {e}")
        except Exception as e:
            print(f"Unexpected error in askLLM: {e}")
            raise
    

    def _load_prompt(self, prompt_filename):
        """Load prompt from file in prompts directory."""
        prompt_path = self.prompts_dir / prompt_filename
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")

    def decompose_image(self, image_data):
        # Load prompts from external files
        print(" ==== start decompose image ==== ")
        system_prompt = self._load_prompt('image_decomposition_system_prompt.txt')
        user_prompt = self._load_prompt('image_decomposition_user_prompt.txt')
        
        # Use schema from external file
        schema = ImageDecompositionConfig.model_json_schema()

        make_schema_strict_compatible(schema)
        
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "image_decomposition_config",
                "schema": schema,
                "strict": True
            }
        }
        
        try:
            result = self.visual_manager.analyze_image(
                image_data=image_data,
                prompt=user_prompt,
                system_prompt=system_prompt,
                response_format=response_format
            )
            return result
        except Exception as e:
            return {
                "error": f"Failed to decompose image: {str(e)}",
                "worlds": "N/A",
                "objects": [],
                "events": "N/A",
                "style": "N/A"
            }

    @staticmethod
    def _encode_image_to_base64(image_path: Path) -> str:
        """Encode image file to base64 data URL."""
        try:
            with open(image_path, 'rb') as image_file:
                image_data = image_file.read()
                base64_encoded = base64.b64encode(image_data).decode('utf-8')
                
                # Determine MIME type based on file extension
                file_extension = image_path.suffix.lower()
                mime_type_map = {
                    '.jpg': 'image/jpeg',
                    '.jpeg': 'image/jpeg', 
                    '.png': 'image/png',
                    '.gif': 'image/gif',
                    '.bmp': 'image/bmp',
                    '.webp': 'image/webp'
                }
                
                mime_type = mime_type_map.get(file_extension, 'image/jpeg')
                return f"data:{mime_type};base64,{base64_encoded}"
                
        except FileNotFoundError:
            raise FileNotFoundError(f"Image file not found: {image_path}")
        except Exception as e:
            raise Exception(f"Error encoding image: {str(e)}")
    
    @staticmethod
    def _find_image_objects(factory_state: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Find all objects in factory state that represent images."""
        image_objects = []
        
        for category_name, category_items in factory_state.items():
            if isinstance(category_items, list):
                for item in category_items:
                    # Check if item has image-related properties
                    if (isinstance(item, dict) and 
                        item.get('type') == 'file' and 
                        (item.get('dataType') == 'image' or 
                         (item.get('file') and any(item['file'].lower().endswith(ext) 
                                                 for ext in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'])))):
                        # Add category context to the object
                        item_with_context = item.copy()
                        item_with_context['_category'] = category_name
                        image_objects.append(item_with_context)
        
        return image_objects

    def _analyze_single_image(self, image_obj: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze a single image object and return updated object with decomposition result."""
        try:
            image_file_url = image_obj.get('fileUrl')
            image_path = Path(__file__).resolve().parent / image_file_url.replace(self.img_host_endpoint, '')
            
            if not image_path.exists():
                print(f"Warning: Image file not found: {image_path}")
                return image_obj
            
            # Encode image to base64
            image_data = self._encode_image_to_base64(image_path)
            # Analyze the image
            decomposition_result = self.decompose_image(image_data)
            
            # Update the object with decomposition result
            updated_obj = image_obj.copy()
            updated_obj['content'] = decomposition_result
            
            return updated_obj
            
        except Exception as e:
            print(f"Error analyzing image {image_obj.get('id', 'unknown')}: {str(e)}")
            # Return original object if analysis fails
            return image_obj

    def analyze_factory_state(self, factory_state_filename: str):
        """Analyze factory state JSON file, process all images concurrently, and update the file."""
        try:
            # Load factory state from file
            factory_data = json.load(open(factory_state_filename))
            
            factory_store = factory_data.get('factory_store', {})
        
            # Process images concurrently
            with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                # Submit all image analysis tasks
                future_to_obj = {
                    executor.submit(self._analyze_single_image, img_obj): img_obj 
                    for img_obj in factory_store if img_obj.get('dataType') == 'image'
                }
                
                # Collect results
                analyzed_objects = []
                for future in concurrent.futures.as_completed(future_to_obj):
                    try:
                        result = future.result()
                        analyzed_objects.append(result)
                    except Exception as e:
                        original_obj = future_to_obj[future]
                        print(f"Error processing image {original_obj.get('file', 'unknown')}: {str(e)}")
                        analyzed_objects.append(original_obj)
            
            print(f"Successfully analyzed {len(analyzed_objects)} images")
            
            return analyzed_objects
            
        except Exception as e:
            print(f"Error analyzing factory state: {str(e)}")

    ## pipeline2: get game description from factory state
    def generate_game_description(self, user_operation: str, prompt: str = None):
        if user_operation == "hotload":
            if prompt:
                idx = int(prompt)
            else:
                idx = -1
            with open(f"_data/{self.game_id}/game_description.json", 'r', encoding='utf-8') as f:
                self.game_description = json.load(f)[idx]
            return self.game_description
        system_prompt = self._load_prompt('game_description_system_prompt.txt')
        user_prompt = self._load_prompt('game_description_user_prompt.txt')
        factory_store = self.factory_data.get('factory_store', [])
        game_description_filepath = f"_data/{self.game_id}/game_description.json"
        if os.path.exists(game_description_filepath):
            with open(game_description_filepath, 'r', encoding='utf-8') as f:
                previous_game_description = json.load(f)
        else:
            previous_game_description = []
        if (user_operation == 'regenerate'):
            previous_game_description.pop(-1)
            user_prompt = user_prompt.replace("__user_operation__", prompt)
        elif (user_operation == 'initialize'):
            previous_game_description = []
            user_prompt = user_prompt.replace("__user_operation__", 'generate intial game description' + " : " + prompt)
        else:
            user_prompt = user_prompt.replace("__user_operation__", user_operation + " : " + prompt)
        user_prompt = user_prompt.replace("__asset_list__", json.dumps(factory_store))
        user_prompt = user_prompt.replace("__previous_game_description__", json.dumps(previous_game_description[-3:]))

        schema = JumpGameDescription.model_json_schema()
        make_schema_strict_compatible(schema)
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "jump_game_description",
                "schema": schema,
                "strict": True
            }
        }
        result = self.askLLM(user_prompt, system_prompt, response_format=response_format, temperature=0.4)
        previous_game_description.append({'id': user_operation+":"+prompt, 'content': result})
        print(f"Game description generated successfully!")
        with open(game_description_filepath, 'w', encoding='utf-8') as f:
            json.dump(previous_game_description, f, indent=2, ensure_ascii=False)
        self.game_description = {'id': user_operation+":"+prompt, 'content': result}
        return result

        # result = self.askLLM(user_prompt, system_prompt, response_format=JumpGameDescription.model_json_schema(), temperature=0.9)
        # return result
        # result = self.askLLM(user_prompt, system_prompt, response_format=JumpGameDescription.model_json_schema(), temperature=0.9)

    def update_factory_store_with_analysis(self, factory_state_filename: str, output_filename: str = None):
        """Analyze factory state and update the original JSON file with analyzed results while preserving non-image data."""
        try:
            # Load original factory state from file
            with open(factory_state_filename, 'r', encoding='utf-8') as f:
                factory_data = json.load(f)
            
            factory_store = factory_data.get('factory_store', [])
            
            # Create a mapping of image objects by their id for quick lookup
            image_objects_map = {}
            non_image_objects = []
            
            # Separate image and non-image objects
            for obj in factory_store:
                if obj.get('dataType') == 'image':
                    # Check if image has already been analyzed (content is a dictionary)
                    content = obj.get('content')
                    if isinstance(content, dict) and not content.get('error'):
                        print(f"Image {obj.get('fileUrl', 'unknown')} already analyzed, skipping...")
                        non_image_objects.append(obj)  # Treat as non-image since it's already processed
                    else:
                        image_objects_map[obj.get('id')] = obj
                else:
                    non_image_objects.append(obj)
            
            # Analyze only the image objects
            if image_objects_map:
                print(f"Found {len(image_objects_map)} image objects to analyze")
                
                # Process images concurrently
                with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
                    # Submit all image analysis tasks
                    future_to_obj = {
                        executor.submit(self._analyze_single_image, img_obj): img_obj 
                        for img_obj in image_objects_map.values()
                    }
                    
                    # Collect analyzed results
                    analyzed_image_objects = []
                    for future in concurrent.futures.as_completed(future_to_obj):
                        try:
                            result = future.result()
                            analyzed_image_objects.append(result)
                        except Exception as e:
                            original_obj = future_to_obj[future]
                            print(f"Error processing image {original_obj.get('fileUrl', 'unknown')}: {str(e)}")
                            analyzed_image_objects.append(original_obj)
                
                print(f"Successfully analyzed {len(analyzed_image_objects)} images")
            else:
                analyzed_image_objects = []
                print("No image objects found to analyze")
                
            # Combine analyzed image objects with non-image objects
            # Maintain the original order by reconstructing the factory_store list
            updated_factory_store = []
            analyzed_images_by_id = {obj.get('id'): obj for obj in analyzed_image_objects}
            
            for original_obj in factory_store:
                obj_id = original_obj.get('id')
                if original_obj.get('dataType') == 'image' and obj_id in analyzed_images_by_id:
                    # Use the analyzed version
                    updated_factory_store.append(analyzed_images_by_id[obj_id])
                else:
                    # Keep the original non-image object
                    updated_factory_store.append(original_obj)
            
            # Update the factory data with the new factory_store
            factory_data['factory_store'] = updated_factory_store
            
            # Determine output filename
            if output_filename is None:
                output_filename = factory_state_filename
            
            # Save the updated factory data back to file
            with open(output_filename, 'w', encoding='utf-8') as f:
                json.dump(factory_data, f, indent=2, ensure_ascii=False)
            
            self.factory_data = factory_data
            return factory_data
            
        except Exception as e:
            print(f"Error updating factory store: {str(e)}")
            raise


    def _get_reference_image_path(self, reference_id):
        """Get file path for reference image from factory store using ID."""
        try:
            factory_store = self.factory_data.get('factory_store', [])
            for obj in factory_store:
                if obj.get('id') == reference_id and obj.get('dataType') == 'image':
                    file_url = obj.get('fileUrl')
                    if file_url:
                        # Construct path to image in assets/test folder
                        image_path = Path(__file__).resolve().parent / file_url.replace(self.img_host_endpoint, '')
                        if image_path.exists():
                            return image_path
                        else:
                            print(f"Warning: Reference image file not found: {image_path}")
                            return None
            print(f"Warning: Reference image with ID {reference_id} not found in factory store")
            return None
        except Exception as e:
            print(f"Error getting reference image path for ID {reference_id}: {str(e)}")
            return None

    def _save_generated_image(self, image_b64, asset_name):
        """Save generated image to assets folder with appropriate naming."""
        try:
            if not image_b64:
                return None
            
            # Remove data URL prefix if present
            if ',' in image_b64:
                image_b64 = image_b64.split(',')[1]
            
            # Create output directory
            output_dir = Path(__file__).parent / 'assets' / 'generated' / self.game_id
            output_dir.mkdir(parents=True, exist_ok=True)
            
           
            filename = f"{asset_name}.png"
            
            
            output_path = output_dir / filename
            
            # Decode and save
            image_data = base64.b64decode(image_b64)
            with open(output_path, 'wb') as f:
                f.write(image_data)
            
            print(f"✅ Saved {asset_name} to: {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"❌ Error saving {asset_name} image: {str(e)}")
            return None
    
    def generate_configuration(self):
        """
        Generate game configuration based on the game mechanism.
        For jumping games, calls the GameConfigurator to generate DSL config.
        
        Returns:
            str: Path to the generated configuration JSON file
        """
        mechanism = self.factory_data.get('mechanism', 'jump')
        
        if mechanism == 'jump':
            if not self.game_description:
                raise ValueError("Game description is required for configuration generation. Run construct_game_description first.")
            
            # Initialize the GameConfigurator
            configurator = GameConfigurator(
                game_id=self.game_id,
                askllm_func=self.askLLM,
                game_description=self.game_description['content']
            )
            
            # Generate the jumping game DSL configuration
            config_path = configurator.generate_jump_dsl_config()
            
            print(f"🎉 Configuration generation completed for {mechanism} game!")
            return config_path
        else:
            raise NotImplementedError(f"Configuration generation for {mechanism} games is not yet implemented")
    
    def get_assets_to_generate(self):
        assets_to_generate = []
        game_description = self.game_description['content']
        if game_description['player']['need_update']:
            assets_to_generate.append({'name': 'player',"description":game_description['player']['description'],"asset_ref":game_description['player']['asset_ref']})
        if game_description['world']['need_update']:
            assets_to_generate.append({'name': 'world',"description":game_description['world']['description'],"asset_ref":game_description['world']['asset_ref']})
        for platform in game_description['platforms']:
            if platform['need_update']:
                assets_to_generate.append(platform)
        for collectable in game_description['collectables']:
            if collectable['need_update']:
                assets_to_generate.append(collectable)
        return assets_to_generate



    def generate_visual_assets(self, file_marker=None):
        """Generate visual assets using appropriate methods based on prompt analysis."""
        visual_style = self.game_description['content']['visual_style']
        assets_to_generate = self.get_assets_to_generate()

        tasks = []

        for asset in assets_to_generate:
            if asset['asset_ref']!='N/A':
                tasks.append((asset['name'], asset['description'], asset['asset_ref']))
            else:
                tasks.append((asset['name'], asset['description'], None))
      
        # Execute all tasks concurrently
        def generate_single_asset(task):
            asset_type, visual_desc, asset_ref = task
            if asset_ref:
                reference_path = self._get_reference_image_path(asset_ref)
                if asset_type == 'world':
                    prompt = "based on the image and descritpipon, generate a background image as a skybox as a backdrop of the game with the following description: " + visual_desc + " and the style should be " + visual_style + 'no characters, no foregroundobjects, only as background'
                else:
                    prompt = "extract a single object in the image as a " + asset_type + " with the following description: " + visual_desc + " and the style should be " + visual_style + "only the static single object, clear background with distinct color difference from the object so we can remove the background without affecting the object, no animation, remove object that is not part of this standalone object, generate the asset with clear background."

                with open(reference_path, 'rb') as f:
                    reference_b64 = base64.b64encode(f.read()).decode('utf-8')
                        
                # Generate base image with GPT editing
                gpt_edited_image = self.visual_manager.generate_image_with_gpt_edit(
                    prompt, reference_b64, reference_path
                )

                # post-processing the iamges
                if asset_type == 'world':
                    generated_image = self.visual_manager._outpaint_image(f"panorama, {prompt}", gpt_edited_image)
                else:
                    generated_image = self.visual_manager._remove_background(gpt_edited_image)
            
            else: 
                prompt = visual_desc + '; ' + visual_style
                if asset_type == 'world':
                    prompt += "; no characters, no objects, seamless, wide view, highly detailed, vibrant atmosphere, perfect for game skybox."
                    negative_prompt = "characters, creatures, people, animals, objects, text, watermark, logo, clutter, foreground items"
                    generated_image = self.visual_manager.generate_skybox(prompt, negative_prompt)
                else:
                    prompt += "; single isolated object, centered, plain white background, no shadows, no scenery, clean edges, perfect for game asset/sprite."
                    generated_image = self.visual_manager.generate_transparent_asset(prompt)
            
            if generated_image:
                asset_name = asset_type
                print("generated_image: ", asset_name)
                print("prompt: ", prompt)
                saved_name = asset_name
                if file_marker:
                    saved_name += "_" + file_marker
                saved_path = self._save_generated_image(generated_image,saved_name)
                return {'success': True, 'saved_path': saved_path}
            else:
                return {'success': False, 'error': 'Failed to generate image'}
        
        with concurrent.futures.ThreadPoolExecutor(max_workers=6) as executor:
            future_to_task = {executor.submit(generate_single_asset, task): task for task in tasks}
            results = {}
            
            for future in concurrent.futures.as_completed(future_to_task):
                result = future.result()
                
                if result and result.get('success'):
                    print(f"✅ Completed: {result.get('saved_path')}")
                else:
                    print(f"❌ Failed")
        

    async def generate_audio_assets(self):
        """Generate audio assets for the jump game using AudioManager."""
        if not self.game_description:
            raise ValueError("Game description is required for audio generation. Run construct_game_description first.")
        
        # config_path = f"_data/{self.game_id}/jumping_game_dsl_config.json"
        # try:
        #     with open(config_path, 'r', encoding='utf-8') as f:
        #         jumping_config = json.load(f)
        # except FileNotFoundError:
        #     raise FileNotFoundError(f"Jumping game configuration not found: {config_path}")
        
        print(f"🎵 Starting audio asset generation for {self.game_id}...")
        
        # Generate all audio assets using the AudioManager
        saved_audio_files = await self.audio_manager.generate_jump_game_audio_assets(
            self.game_description['content']
        )
        
        print(f"🎉 Audio asset generation completed for jump game!")
        return saved_audio_files

        
