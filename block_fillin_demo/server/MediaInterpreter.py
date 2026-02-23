"""
MediaInterpreter: Handles image interpretation and description using OpenAI's Vision API
"""
import os
import base64
from pathlib import Path
from openai import OpenAI
from typing import Union


class MediaInterpreter:
    
    def __init__(self, api_key=None):
        self.api_key = api_key or os.getenv('OPENAI_API_KEY')
        if not self.api_key:
            raise ValueError("OpenAI API key not provided and OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key)
    
    def _encode_image_to_base64(self, image_path: str) -> str:
        with open(image_path, 'rb') as image_file:
            encoded = base64.b64encode(image_file.read()).decode('utf-8')
            # Detect image format
            ext = Path(image_path).suffix.lower()
            mime_type = {
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.png': 'image/png',
                '.gif': 'image/gif',
                '.webp': 'image/webp'
            }.get(ext, 'image/jpeg')
            
            return f"data:{mime_type};base64,{encoded}"
    
    def interpret_image(self, 
                       image_input: Union[str, Path], 
                       prompt: str = "Briefly describe what you see in this image in one or two sentences.",
                       model: str = "gpt-4o",
                       max_tokens: int = 150) -> str:

        try:
            # Check if input is a file path or base64 string
            if isinstance(image_input, (str, Path)) and os.path.isfile(image_input):
                # print(f" :: Encoding image from file: {image_input}")
                image_data = self._encode_image_to_base64(str(image_input))
            elif isinstance(image_input, str) and image_input.startswith('data:image'):
                # Already a base64 data URL
                image_data = image_input
            elif isinstance(image_input, str) and not image_input.startswith('data:'):
                # Assume it's base64 without prefix, add it
                image_data = f"data:image/jpeg;base64,{image_input}"
            else:
                raise ValueError("Invalid image input. Provide either a file path or base64 encoded image.")
            
            
            # Call OpenAI's vision API
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {
                                "type": "image_url",
                                "image_url": {
                                    "url": image_data
                                }
                            }
                        ]
                    }
                ],
                max_tokens=max_tokens
            )
            
            description = response.choices[0].message.content.strip()
            # print(f" :: Image interpretation: {description}")
            return description
            
        except Exception as e:
            print(f" :: Error interpreting image: {e}")
            raise
    
    def get_quick_description(self, image_input: Union[str, Path]) -> str:
      
        return self.interpret_image(
            image_input=image_input,
            prompt="In one concise sentence, describe what you see in this image, including the objects and the world.",
            max_tokens=50
        )
    
    def get_player(self, image_input: Union[str, Path]) -> str:
        
        return self.interpret_image(
            image_input=image_input,
            prompt="Based on the image/drawing, infer what kind of player character it is. In a simple phrase, such 'a cute girl with a red dress' or 'a funny cat with a green hat' or 'a chef cute bear'. Your answer will be used to generate a single game asset model for a player, just the player itself, no conditions, do NOT mention where it is or what it is doing. It needs to be a player, do not be too literal, use your imagination, if the image is only a cat face, it should be a cat, not a cat face",
            max_tokens=300
        )
    
    def get_world(self, image_input: Union[str, Path]) -> str:

        return self.interpret_image(
            image_input=image_input,
            prompt="Describe the world in this image. In a simple phrase, such 'a beautiful forest' or 'a fancy chinese restaurant' or 'deep blue ocean'. Your answer must be specic, you dont need to cover eveything, just the scene settings, no objects, no characters.",
            max_tokens=250
        )
    
    def get_objects(self, image_input: Union[str, Path]) -> str:
        return self.interpret_image(
            image_input=image_input,
            prompt="Describe the playable objects in this image. In the most simple word, it should be a single, tangible object, no context, no background, the descirption will be used to generate a single game asset model.  such 'a cup of tea' or 'a chill pepper' or 'a french baguette'. Your answer must be specic, you dont need to cover eveything, just the one object you choose itself.",
            max_tokens=250
        )


    def get_visual_style(self, image_input: Union[str, Path]) -> str:
       
        return self.interpret_image(
            image_input=image_input,
            prompt="Describe the visual style and aesthetic of this image. Mention art style in concise keywords, such 'cartoon', 'low poly', 'pixel', 'claymation', 'pastal'",
            max_tokens=150
        )

