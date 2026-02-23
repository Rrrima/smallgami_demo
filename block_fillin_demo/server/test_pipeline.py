import os
import base64
import json
import asyncio
import time
from termcolor import colored
from pathlib import Path
from Gami import Gami
from pydantic import BaseModel
from datetime import datetime
from VisualManager import VisualManager
import requests
from dotenv import load_dotenv
from google import genai
import base64
import wave

load_dotenv() 

def encode_image_to_base64(image_path):
    try:
        with open(image_path, 'rb') as image_file:
            image_data = image_file.read()
            base64_encoded = base64.b64encode(image_data).decode('utf-8')
            
            # Determine MIME type based on file extension
            file_extension = Path(image_path).suffix.lower()
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


def test_image_analysis(image_name, game_id="test_game"):
    # Get the path to the test assets folder
    assets_test_dir = Path(__file__).resolve().parent / 'assets' / 'test'
    image_path = assets_test_dir / image_name
    
    # Check if image exists
    if not image_path.exists():
        available_images = [f.name for f in assets_test_dir.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']]
        raise FileNotFoundError(f"Image '{image_name}' not found in assets/test folder. Available images: {available_images}")
    
    print(f"Analyzing image: {image_name}")
    print(f"Image path: {image_path}")
    
    try:
        # Initialize Gami instance
        gami = Gami(game_id)
        
        # Encode image to base64
        image_data = encode_image_to_base64(image_path)
        
        # Analyze the image
        print("Starting image analysis...")
        result = gami.decompose_image(image_data)
        
        print("Analysis completed successfully!")
        return result
        
    except Exception as e:
        print(f"Error during analysis: {str(e)}")
        return {"error": str(e)}

def test_askllm(prompt, system_prompt, schema=None):
    gami = Gami("test_game")
    print(schema)
    result = gami.askLLM(prompt, system_prompt, schema)
    return result

def save_base64_image(base64_data, output_path):
    """Save base64 encoded image to file."""
    try:
        # Remove data URL prefix if present
        if ',' in base64_data:
            base64_data = base64_data.split(',')[1]
        
        # Decode base64 data
        image_data = base64.b64decode(base64_data)
        
        # Ensure output directory exists
        output_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Write to file
        with open(output_path, 'wb') as f:
            f.write(image_data)
        
        print(f"✅ Image saved to: {output_path}")
        return True
        
    except Exception as e:
        print(f"❌ Error saving image to {output_path}: {str(e)}")
        return False

def test_skybox_generation(prompt="minecraft landscape with blue flowers", game_id="test_game"):
    """Test skybox generation with Stable Diffusion."""
    print(f"\n{colored('🌅 Testing Skybox Generation', 'cyan')}")
    print(f"Prompt: {prompt}")
    
    try:
        # Initialize Gami and VisualManager
        gami = Gami(game_id, hotload=True)
        
        # Generate skybox
        print("Generating skybox...")
        start_time = time.time()
        skybox_b64 = gami.visual_manager.generate_skybox(prompt)
        generation_time = time.time() - start_time
        
        if skybox_b64:
            # Save the generated skybox
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            output_path = Path(__file__).parent / 'assets' / 'test_output' / f'skybox_{timestamp}.png'
            
            if save_base64_image(skybox_b64, output_path):
                print(f"✅ Skybox generation successful! Time: {generation_time:.2f}s")
                return {"success": True, "output_path": str(output_path), "time": generation_time}
            else:
                return {"success": False, "error": "Failed to save image"}
        else:
            print("❌ Skybox generation failed - no image returned")
            return {"success": False, "error": "No image generated"}
            
    except Exception as e:
        print(f"❌ Error during skybox generation: {str(e)}")
        return {"success": False, "error": str(e)}

def test_gpt_image_editing(input_image_name, prompt="make this more colorful and vibrant", game_id="test_game"):
    """Test GPT image editing."""
    print(f"\n{colored('🎨 Testing GPT Image Editing', 'cyan')}")
    print(f"Input image: {input_image_name}")
    print(f"Edit prompt: {prompt}")
    
    try:
        # Get input image path
        assets_test_dir = Path(__file__).parent / 'assets' / 'test'
        input_path = assets_test_dir / input_image_name
        
        if not input_path.exists():
            available_images = [f.name for f in assets_test_dir.iterdir() if f.is_file() and f.suffix.lower() in ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp']]
            raise FileNotFoundError(f"Image '{input_image_name}' not found. Available: {available_images}")
        
        # Initialize Gami and VisualManager
        gami = Gami(game_id, hotload=True)
        
        # Load and encode reference image
        print("Loading reference image...")
        with open(input_path, 'rb') as f:
            image_data = base64.b64encode(f.read()).decode('utf-8')
        
        # Generate edited image
        print("Editing image with GPT...")
        start_time = time.time()
        edited_b64 = gami.visual_manager.generate_image_with_gpt_edit(prompt, image_data)
        generation_time = time.time() - start_time
        
        if edited_b64:
            # Save the edited image
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            base_name = Path(input_image_name).stem
            output_path = Path(__file__).parent / 'assets' / 'test_output' / f'gpt_edit_{base_name}_{timestamp}.png'
            
            if save_base64_image(edited_b64, output_path):
                print(f"✅ GPT image editing successful! Time: {generation_time:.2f}s")
                return {"success": True, "input_image": input_image_name, "output_path": str(output_path), "time": generation_time}
            else:
                return {"success": False, "error": "Failed to save edited image"}
        else:
            print("❌ GPT image editing failed - no image returned")
            return {"success": False, "error": "No edited image generated"}
            
    except Exception as e:
        print(f"❌ Error during GPT image editing: {str(e)}")
        return {"success": False, "error": str(e)}

def test_transparent_asset_generation(prompt="friendly green cartoon dinosaur", game_id="test_game"):
    """Test transparent asset generation with Stable Diffusion + background removal."""
    print(f"\n{colored('🦖 Testing Transparent Asset Generation', 'cyan')}")
    print(f"Prompt: {prompt}")
    
    try:
        # Initialize Gami and VisualManager
        gami = Gami(game_id, hotload=True)
        
        # Generate transparent asset
        print("Generating transparent asset...")
        start_time = time.time()
        asset_b64 = gami.visual_manager.generate_transparent_asset(prompt)
        generation_time = time.time() - start_time
        
        if asset_b64:
            # Save the generated asset
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            prompt_short = prompt.replace(" ", "_")[:20]
            output_path = Path(__file__).parent / 'assets' / 'test_output' / f'transparent_{prompt_short}_{timestamp}.png'
            
            if save_base64_image(asset_b64, output_path):
                print(f"✅ Transparent asset generation successful! Time: {generation_time:.2f}s")
                return {"success": True, "output_path": str(output_path), "time": generation_time}
            else:
                return {"success": False, "error": "Failed to save transparent asset"}
        else:
            print("❌ Transparent asset generation failed - no image returned")
            return {"success": False, "error": "No transparent asset generated"}
            
    except Exception as e:
        print(f"❌ Error during transparent asset generation: {str(e)}")
        return {"success": False, "error": str(e)}

def test_all_image_generation():
    """Run all image generation tests."""
    print(f"\n{colored('🚀 Starting All Image Generation Tests', 'green', attrs=['bold'])}")
    
    results = {}
    total_start_time = time.time()
    
    # Test 1: Skybox Generation
    results['skybox'] = test_skybox_generation(
        prompt="office workspace with creative posters and bright lighting, panoramic view"
    )
    
    # Test 2: GPT Image Editing (test with multiple images)
    test_images = ['dino_story2.jpg']
    results['gpt_editing'] = []
    
    for img in test_images:
        # Check if image exists before testing
        assets_test_dir = Path(__file__).parent / 'assets' / 'test'
        if (assets_test_dir / img).exists():
            result = test_gpt_image_editing(
                input_image_name=img,
                prompt="'Edit the image to enhance the green, cartoonish creature, making it resemble a friendly dinosaur. Modify its body to be slightly more elongated and add small, rounded limbs to represent arms and legs. Ensure the facial expression remains simple and happy with bright, friendly features. Adjust the style to be painterly and impressionistic, incorporating pastel hues and whimsical, storybook-like qualities."
            )
            results['gpt_editing'].append(result)
        else:
            print(f"⚠️ Skipping {img} - file not found")
    
    # Test 3: Transparent Asset Generation (test multiple prompts)
    asset_prompts = [
        "Create an image of colorful sticky notes with creative doodles and messages. The sticky notes should be in various pastel hues such as light pinks, yellows, blues, and greens, each featuring whimsical and storybook-like doodles or handwritten messages. Incorporate elements that feel painterly and impressionistic, with bright accents and a playful yet artistic arrangement. The scene should evoke a sense of creativity and thoughtfulness.",
        "A collection of colorful sticky notes featuring a variety of charming doodles and handwritten messages. The notes have a painterly and impressionistic style, with pastel hues complemented by bright accents. The doodles and messages convey a whimsical, storybook-like quality, making them look like delightful game collectibles. The notes are arranged in a way that highlights their unique designs, all floating against a simple, transparent background.",
        "magical cloud creature with cute face"
    ]
    
    results['transparent_assets'] = []
    for prompt in asset_prompts:
        result = test_transparent_asset_generation(prompt)
        results['transparent_assets'].append(result)
    
    total_time = time.time() - total_start_time
    
    # Print summary
    print(f"\n{colored('📊 Test Summary', 'green', attrs=['bold'])}")
    print(f"Total execution time: {total_time:.2f}s")
    
    # Count successes
    skybox_success = results['skybox']['success']
    gpt_successes = sum(1 for r in results['gpt_editing'] if r['success'])
    transparent_successes = sum(1 for r in results['transparent_assets'] if r['success'])
    
    print(f"Skybox generation: {'✅' if skybox_success else '❌'}")
    print(f"GPT image editing: {gpt_successes}/{len(results['gpt_editing'])} successful")
    print(f"Transparent assets: {transparent_successes}/{len(results['transparent_assets'])} successful")
    
    # Save results to JSON
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_path = Path(__file__).parent / 'assets' / 'test_output' / f'test_results_{timestamp}.json'
    
    try:
        with open(results_path, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"📄 Test results saved to: {results_path}")
    except Exception as e:
        print(f"⚠️ Failed to save test results: {str(e)}")
    
    return results

class JokeResponse(BaseModel):
    joke: str


def test_gpt_image_gen_endpoint(prompt, reference_filename, save_path):
    gami = Gami("test_game", hotload=True) 
    visual_manager = gami.visual_manager
    reference_path = Path(__file__).parent / 'assets' / 'test' / reference_filename
    with open(reference_path, 'rb') as f:
        reference_b64 = base64.b64encode(f.read()).decode('utf-8')             
        # Generate base image with GPT editing
        gpt_edited_image = visual_manager.generate_image_with_gpt_edit(
            prompt, reference_b64, reference_filename
        )

    output_dir = Path(__file__).parent / 'assets' / 'generated' / 'test_pipeline'
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / save_path

    if ',' in gpt_edited_image:
        gpt_edited_image = gpt_edited_image.split(',')[1]

    gpt_edited_image = base64.b64decode(gpt_edited_image)

    with open(output_path, 'wb') as f:
        f.write(gpt_edited_image)
            
    print(f"✅ Saved {save_path} to: {output_path}")
    return str(output_path)

def remove_background(input_path, output_path):
    try:
        sd_url = os.getenv("SD_URL2","http://gcrsandbox388:5002/")
        url = sd_url + "rembg"

        with open(input_path, 'rb') as f:
            image_b64 = base64.b64encode(f.read()).decode('utf-8')
        
        
        request_data = {
            "input_image": image_b64,
            "model": "isnet-general-use",
            "return_mask": False,
            "alpha_matting": False,
            "alpha_matting_foreground_threshold": 20,
            "alpha_matting_background_threshold": 200,
            "alpha_matting_erode_size": 10,
        }
        
        response = requests.post(url, json=request_data, headers={"Content-Type": "application/json"})
        response.raise_for_status()
        
        result = response.json().get('image')
        save_base64_image(result, output_path)
        
        
    except Exception as e:
        print(f"Error removing background: {str(e)}")
        return None

def stable_audio(prompt, output_dir, filename, duration):
  response = requests.post(
      f"https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",
      headers={"authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}", "accept": "audio/*"},
      files={"none": ""},
      data={
          "prompt": prompt,
          "output_format": "wav",
          "duration": duration,
          "model": "stable-audio-2.5",
          "steps": 5,
      },
  )

  if response.status_code == 200:
      with open(os.path.join(output_dir, filename), "wb") as file:
          file.write(response.content)
  else:
      raise Exception(str(response.json()))

def google_lyria_audio(output_dir, filename):
  client = genai.Client(
    vertexai=True,
    project="smallgami",
    location="us-central1",  # Lyria works here
  )

  prompt = (
    "A short, dry sound effect of a character jumping and landing on soft snow. "
    "Muted crunch, powdery texture, no music, no rhythm, no reverb."
  )


  response = client.models.generate_content(
      model="lyria-002",
      contents=prompt,
      config={
          "audio": {
              "voice": None,              # no voice
              "audio_format": "wav",
          },
          "temperature": 0.7,
          "max_output_tokens": 2048,      # safe for short audio
      },
  )

  # --- Extract audio ---
  audio_part = None
  for part in response.candidates[0].content.parts:
      if part.inline_data and part.inline_data.mime_type == "audio/wav":
          audio_part = part.inline_data.data
          break

  if audio_part is None:
      raise RuntimeError("No audio returned")

  audio_bytes = base64.b64decode(audio_part)

  # --- Save WAV ---
  with open(os.path.join(output_dir, filename), "wb") as f:
      f.write(audio_bytes)

  print("Saved snow_jump.wav")


def generate_ambient_sound(content, player_description,tag):
  try:
      print(f" :: Generating ambient sound")
      import requests
      
      # Create ambient sound prompt based on world description
      sound_prompt = f"Ambient background music for a game world: {content}"
      if player_description:
          sound_prompt += f". The player is: {player_description}"
      sound_prompt += ". Loop-friendly, atmospheric, no abrupt changes."
      
      # Use Stability AI's audio generation
      response = requests.post(
          f"https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",
          headers={
              "authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}", 
              "accept": "audio/*"
          },
          files={"none": ""},
          data={
              "prompt": sound_prompt,
              "output_format": "wav",
              "duration": 10,  # 10 seconds of ambient sound
              "model": "stable-audio-2.5",
              "steps": 5,
          },
      )
      
      if response.status_code == 200:
          # Save the audio to frontend's public/assets folder
          frontend_assets_dir = Path(__file__).parent.parent / 'frontend' / 'public' / 'assets'
          frontend_assets_dir.mkdir(parents=True, exist_ok=True)
          
          # timestamp = int(time.time() * 1000)
          audio_filename = f'ambient_{tag}.wav'
          audio_path = frontend_assets_dir / audio_filename
          
          with open(audio_path, 'wb') as f:
              f.write(response.content)
              f.flush()
              os.fsync(f.fileno())
          
          ambient_sound_result = audio_filename
          print(f" :: Ambient sound saved as: {audio_filename}")
      else:
          raise Exception(f"Audio generation failed: {response.json()}")
          
  except Exception as e:
      sound_error = str(e)
      print(f" :: Error generating ambient sound: {e}")






if __name__ == "__main__":

    start_time = time.time()

    # input_path = Path(__file__).parent / 'assets' / 'generated' / 'test_pastal' / 'player_test-1.png'
    # output_path = Path(__file__).parent / 'assets' / 'generated' / 'test_pastal' / 'player_test-1_removed_background2.png'
    # remove_background(input_path, output_path)


    

    # test_gpt_image_gen_endpoint("extract them smiling face as a collectable in a game asset, clear background", "pastal.jpg", "test-pipeline-collectable.png")

    # Choose what to test by uncommenting the desired section
    # =============================================================================
    # OPTION 1: Test Visual Asset Generation (Original functionality)
    # =============================================================================
    # gami = Gami("test_pastal", hotload=True)
    # res = gami.generate_game_description("add asset:", "add file-1756881061680 and specify the tag as object")
    # res = gami.generate_game_description("regenerate", "add file-1756881061680 and specify the tag as object")
    # res = gami.generate_game_description("hotload",str(0))
    # gami.generate_visual_assets('narraitve4')
    # asyncio.run(gami.generate_audio_assets())
    # gami.generate_configuration()
    
    # =============================================================================
    # OPTION 2: Test Individual Image Generation Methods
    # =============================================================================
    # Uncomment any of these to test individual methods:
    
    # Test skybox generation only
    # result = test_skybox_generation("office workspace with creative posters and bright lighting")
    # print(json.dumps(result, indent=2))
    
    # Test GPT image editing only  
    # result = test_gpt_image_editing("dino.jpg", "make this dinosaur more magical with sparkles")
    # print(json.dumps(result, indent=2))
    
    # Test transparent asset generation only
    # result = test_transparent_asset_generation("friendly green cartoon dinosaur")
    # print(json.dumps(result, indent=2))
    
    # =============================================================================
    # OPTION 3: Run All Image Generation Tests (Comprehensive Testing)
    # =============================================================================
    # Uncomment this line to run all image generation tests:
    # test_results = test_all_image_generation()
    
    # =============================================================================
    # OPTION 4: Test Image Analysis (Original functionality)  
    # =============================================================================
    # Test a specific image analysis
    # test_image = "pastal.jpg"  
    # print(f"\nTesting single image: {test_image}")
    # result = test_image_analysis(test_image)
    # print(json.dumps(result, indent=2))
    
    # =============================================================================
    # OPTION 5: Test LLM functionality
    # =============================================================================
    # prompt = "tell me a joke"
    # system_prompt = "You are a helpful assistant."
    # schema = JokeResponse.model_json_schema()
    # schema["additionalProperties"] = False
    # json_format = {
    #     "type": "json_schema",
    #     "json_schema": {
    #         "name": "joke_response",
    #         "schema": schema,
    #         "strict": True
    #     }
    # }
    # result = test_askllm(prompt, system_prompt, json_format)
    # print("LLM Response:")
    # print(json.dumps(result, indent=2))


    # print(f"{colored(' test configuration generation', 'cyan')}")
    # gami = Gami("test_game", hotload=True) 
    # gami.generate_configuration()
    
    # Test audio assets generation (async)
    # try:
    #     print(f"{colored(' Testing audio assets generation...', 'yellow')}")
    #     audio_results = asyncio.run(gami.generate_audio_assets())
    #     print(f"{colored(f' Audio generation completed: {len(audio_results)} files', 'green')}")
    # except Exception as e:
    #     print(f"{colored(f' Audio generation failed: {str(e)}', 'red')}")

    
    # print(f"{colored(' -------------------------------------------', 'green')}")
    # print(f"{colored(f' Total execution time: {time.time() - start_time:.2f}s', 'green')}")

    # prompt = "A sound effect when the player got hit by a snowball. Muted and dry, sad."
    # output_path = "assets/test"
    # stable_audio(prompt, output_path, "ouch_sound.wav", 1)
    generate_ambient_sound("a retro-style arcade space invader game. The sound should evoke a sense of cosmic tension and suspense, it should be dark and dangerous", "a spaceship", "space_invader3")
