import os
import requests
import base64
import json
from pathlib import Path
from dotenv import load_dotenv
from schema import AssetGenerationPromptConfig
from _utils import make_schema_strict_compatible
from openai import OpenAI
from io import BytesIO
from azure.identity import ChainedTokenCredential, AzureCliCredential, ManagedIdentityCredential, get_bearer_token_provider


class VisualManager:
    def __init__(self, game_id:str, llm_endpoint:str, llm_payload:dict):
        self.game_id = game_id
        self.llm_endpoint = llm_endpoint
        self.llm_payload = llm_payload
        env_path = Path(__file__).resolve().parents[1] / '.env'
        load_dotenv(dotenv_path=env_path)
        self.gpt_image_endpoint = os.getenv("VITE_URL_GPT") + "gpt_image_edit"
        self.prompts_dir = Path(__file__).resolve().parent / 'prompts'

        self.use_internal_server = True
        
        # Stable Diffusion endpoints configuration
        self.sd_url1 = os.getenv("SD_URL1","http://gcrsandbox388:5001/") # for image generation
        self.sd_url2 = os.getenv("SD_URL2","http://gcrsandbox388:5002/")  # For background removal
        self.sd_checkpoint = os.getenv("SD_CHECKPOINT","sd_xl_base_1.0.safetensors")  # For asset generation
        self.skybox_checkpoint = os.getenv("SKYBOX_CHECKPOINT","dreamshaper_8.safetensors")  # For skybox generation
    
    def analyze_image(self, image_data, prompt, system_prompt, response_format=None):
        # Prepare the message with image
        prompt = [
            {
                "type": "text",
                "text": prompt
            },
            {
                "type": "image_url",
                "image_url": {
                    "url": image_data
                }
            }
        ]
        
        payload = {
            "prompt": prompt,
            "system_prompt": system_prompt,
            **self.llm_payload,
        }

    
        
        if response_format:
            payload["response_format"] = response_format
            
        response = requests.post(self.llm_endpoint, json=payload)
        return response.json()
    
    def _load_prompt(self, prompt_filename):
        """Load prompt from file in prompts directory."""
        prompt_path = self.prompts_dir / prompt_filename
        try:
            with open(prompt_path, 'r', encoding='utf-8') as f:
                return f.read().strip()
        except FileNotFoundError:
            raise FileNotFoundError(f"Prompt file not found: {prompt_path}")
    
    def generate_visual_prompt(self, type, visual_description, reference_description, visual_style, askllm):
        system_prompt = "you are a prompt engineer and a game developer, you are familiar with the stable difussion model and gpt image editing model. "
        user_prompt = self._load_prompt("visual_prompt_user_prompt.txt")

        user_prompt = user_prompt.replace("___TYPE___", type)
        user_prompt = user_prompt.replace("___VISUAL___", visual_description)
        user_prompt = user_prompt.replace("___STYLE___", visual_style)
        user_prompt = user_prompt.replace("___REFERENCE___", reference_description)


        # Create response format schema
        schema = AssetGenerationPromptConfig.model_json_schema()
        
        # Make schema compatible with OpenAI strict mode
        make_schema_strict_compatible(schema)
        
        response_format = {
            "type": "json_schema",
            "json_schema": {
                "name": "asset_generation_prompt_config",
                "schema": schema,
                "strict": True
            }
        }
            
        return askllm(system_prompt, user_prompt, response_format)
    
    def generate_image_with_gpt_edit(self, prompt, reference_image_b64, reference_filename=None):
        """ Generate image using GPT image editing endpoint.
        Args:
            prompt (str): Text prompt for image editing
            reference_image_b64 (str): Base64 encoded reference image    
        Returns:
            str: Base64 encoded generated image
        """
        if self.use_internal_server:
            try:
                payload = {
                    "prompt": prompt,
                    "image": reference_image_b64
                }
                
                response = requests.post(self.gpt_image_endpoint, json=payload)
                response.raise_for_status()
                
                result = response.json()
                return result.get('image')
                
            except Exception as e:
                print(f"Error generating image with GPT edit: {str(e)}")
                return None
        else:
            scope = "api://trapi/.default"
            credential = get_bearer_token_provider(
                ChainedTokenCredential(
                    AzureCliCredential(),
                    ManagedIdentityCredential(),
                ),
                scope,
            )
            api_version = '2025-04-01-preview'
            deployment_name = 'gpt-image-1'
            instance = 'gcr/shared'
            endpoint = f'https://trapi.research.microsoft.com/{instance}/openai/deployments/{deployment_name}'
            token = credential()

            client = OpenAI(
                api_key=token,
                base_url=endpoint
            )
            reference_path = reference_filename

            with open(reference_path, 'rb') as image_file:
                result = client.images.edit(
                    model=deployment_name,
                    prompt=prompt,
                    n=1,
                    image=image_file, 
                    size="1024x1024",
                    extra_query={"api-version": api_version}
                )
            image_base64 = result.data[0].b64_json
            return image_base64

    
    def _generate_sd_image(self, prompt, negative_prompt="blurry, low quality, distorted, watermark, text", width=1024, height=1024, steps=20, cfg_scale=7):
        """ generate images using Stable Diffusion.
        Args:
            prompt (str): Text prompt for image generation
            width (int): Image width (default: 1024)
            height (int): Image height (default: 1024)
            steps (int): Number of generation steps (default: 20)
            cfg_scale (float): CFG scale (default: 7)
        Returns:
            str: Base64 encoded generated image
        """
        try:
            url = self.sd_url1 + "sdapi/v1/txt2img"
            
            request_data = {
                "prompt": prompt,
                "steps": steps,
                "seed": -1,
                "negative_prompt": negative_prompt,
                "cfg_scale": cfg_scale,
                "user_token": 0,
                "override_settings": {
                    "sd_model_checkpoint": self.sd_checkpoint,
                },
                "width": width,
                "height": height,
            }
            
            response = requests.post(url, json=request_data, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            
            result = response.json()
            return result.get('images', [None])[0]
            
        except Exception as e:
            print(f"Error generating SD image: {str(e)}")
            return None
    
    def _remove_background(self, image_b64):
        """ remove background from an image using rembg.
        Args:
            image_b64 (str): Base64 encoded input image  
        Returns:
            str: Base64 encoded image with background removed
        """
        try:
            url = self.sd_url2 + "rembg"
            
            request_data = {
                "input_image": image_b64,
                "model": "isnet-general-use",
                "return_mask": False,
                "alpha_matting": False,
                "alpha_matting_foreground_threshold": 240,
                "alpha_matting_background_threshold": 10,
                "alpha_matting_erode_size": 10,
            }
            
            response = requests.post(url, json=request_data, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            
            result = response.json()
            return result.get('image')
            
        except Exception as e:
            print(f"Error removing background: {str(e)}")
            return None
    
    def generate_transparent_asset(self, prompt):
        """ Generate asset with transparent background for game objects.
        Uses a two-step process: generate image then remove background.
        Args:
            prompt (str): Text prompt for asset generation  
        Returns:
            str: Base64 encoded image with transparent background
        """
        # Step 1: Generate image with SD
        negative_prompt = "background, scenery, extra characters, text, clutter"
        base_image = self._generate_sd_image(prompt, negative_prompt)
        if not base_image:
            print("Failed to generate base image for transparent asset")
            return None
        
        # Step 2: Remove background
        # transparent_image = base_image
        transparent_image = self._remove_background(base_image)
        if not transparent_image:
            print("Failed to remove background from asset")
            return None
        
        return transparent_image
    
    def _outpaint_image(self, prompt, base_image_b64, width=512, height=512, steps=20, cfg_scale=7):
        """ outpaint an image using Stable Diffusion.
        Args:
            prompt (str): Text prompt for outpainting
            base_image_b64 (str): Base64 encoded base image
            width (int): Output width (default: 512)
            height (int): Output height (default: 512)
            steps (int): Number of generation steps (default: 20)
            cfg_scale (float): CFG scale (default: 7)  
        Returns:
            str: Base64 encoded outpainted image
        """
        try:
            url = self.sd_url1 + "sdapi/v1/img2img"
            
            request_data = {
                "prompt": prompt,
                "steps": steps,
                "seed": -1,
                "negative_prompt": "",
                "cfg_scale": cfg_scale,
                "width": width,
                "height": height,
                "init_images": [base_image_b64],
                "override_settings": {
                    "sd_model_checkpoint": self.skybox_checkpoint,
                },
                "script_args": [128, 4, 0, ["left", "right"]],
                "script_name": "poor man's outpainting",
                "alwayson_scripts": {
                    "ControlNet": {
                        "args": [
                            {
                                "enabled": "true",
                                "module": "inpaint_only+lama",
                                "model": "control_v11p_sd15_inpaint [ebff9138]",
                                "weight": 1,
                            },
                        ],
                    },
                },
            }
            
            response = requests.post(url, json=request_data, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            
            result = response.json()
            return result.get('images', [None])[0]
            
        except Exception as e:
            print(f"Error outpainting image: {str(e)}")
            return None
    
    def generate_skybox(self, prompt, negative_prompt="blurry, low quality, distorted, watermark, text, characters"):
        """ Generate panoramic skybox image with outpainting.
        Args:
            prompt (str): Text prompt for skybox generation (should include "panorama") 
        Returns:
            str: Base64 encoded panoramic skybox image
        """
        try:
            # First generate the base image
            url = self.sd_url1 + "sdapi/v1/txt2img"
            
            request_data = {
                "prompt": f"panorama, {prompt}",
                "steps": 20,
                "seed": -1,
                "negative_prompt": negative_prompt,
                "cfg_scale": 7,
                "user_token": 0,
                "override_settings": {
                    "sd_model_checkpoint": self.skybox_checkpoint,
                },
                "width": 512,
                "height": 512,
            }
            
            response = requests.post(url, json=request_data, headers={"Content-Type": "application/json"})
            response.raise_for_status()
            
            result = response.json()
            base_image = result.get('images', [None])[0]
            
            if not base_image:
                print("Failed to generate base skybox image")
                return None
            
            # Outpaint once to create panoramic effect
            outpainted_image = self._outpaint_image(f"panorama, {prompt}", base_image)
            
            return outpainted_image
            
        except Exception as e:
            print(f"Error generating skybox: {str(e)}")
            return None