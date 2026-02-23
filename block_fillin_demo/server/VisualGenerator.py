"""
VisualGenerator: Handles image generation for game assets using OpenAI's API
"""
import os
import base64
import requests
from openai import OpenAI
from pathlib import Path


class VisualGenerator:
    """
    A class to handle visual asset generation for SmallGami games.
    Uses OpenAI's DALL-E API for image generation and editing.
    """
    
    def __init__(self, api_key=None):
        """
        Initialize the VisualGenerator.
        
        Args:
            api_key (str, optional): OpenAI API key. If not provided, reads from OPENAI_API_KEY env variable.
        """
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key not provided and OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key)
    
    def generate_ground_texture(self, world_description, player_description=None, size="1024x1024", model="gpt-image-1-mini"):
        
        full_prompt = f"A seamless tileable ground surface texture map for {world_description} scene. Pure material texture only - no objects, no shadows, no perspective. Top-down flat view of the ground material surface pattern. The texture should tile perfectly when repeated."

        print(f" :: Generating ground texture with prompt: {full_prompt}")
        print(f" :: Using model: {model}, size: {size}")
        
        try:
            # Call OpenAI's image generation API
            result = self.client.images.generate(
                model=model,
                prompt=full_prompt,
                n=1,
                size=size
            )
            
            # Try to get image data in different formats
            image_data = result.data[0]
            

            # Check for base64 json
            if hasattr(image_data, 'b64_json') and image_data.b64_json:
                print(f" :: Decoding base64 image data...")
                texture_bytes = base64.b64decode(image_data.b64_json)
            else:
                # Print all available attributes
                available_attrs = [attr for attr in dir(image_data) if not attr.startswith('_')]
                raise Exception(f"No image URL or b64_json in response. Available attributes: {available_attrs}")
            
            print(f" :: Ground texture generated successfully ({len(texture_bytes)} bytes)")
            return texture_bytes
            
        except Exception as e:
            print(f" :: Error generating ground texture: {e}")
            raise
    
    def save_texture_to_assets(self, texture_bytes, output_dir, filename=None):

        import time
        
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        if not filename:
            timestamp = int(time.time() * 1000)
            filename = f'ground_{timestamp}.png'
        
        texture_path = output_dir / filename
        
        try:
            with open(texture_path, 'wb') as f:
                f.write(texture_bytes)
                f.flush()
                os.fsync(f.fileno())
            
            print(f" :: Texture saved to: {texture_path}")
            return filename
            
        except Exception as e:
            print(f" :: Error saving texture: {e}")
            raise
    
    def generate_and_save_ground_texture(self, output_dir, world_description=None, player_description=None, filename=None, size="1024x1024", model="gpt-image-1-mini"):
        texture_bytes = self.generate_ground_texture(
            world_description=world_description,
            player_description=player_description,
            size=size,
            model=model
        )
        
        return self.save_texture_to_assets(
            texture_bytes=texture_bytes,
            output_dir=output_dir,
            filename=filename
        )

