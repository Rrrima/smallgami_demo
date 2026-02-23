import os
from pathlib import Path
from MediaInterpreter import MediaInterpreter
from VisualManager import VisualManager


def analyze_and_generate_game_assets(user_image_path: str):

    
    interpreter = MediaInterpreter()
    
    # Get multiple analyses
    quick_desc = interpreter.get_quick_description(user_image_path)
    player = interpreter.get_player(user_image_path)
    world = interpreter.get_world(user_image_path)
    objects = interpreter.get_objects(user_image_path)
    visual_style = interpreter.get_visual_style(user_image_path)
    
    print(f"📝 Quick Description:\n   {quick_desc}\n")
    print(f"🎮 Player:\n   {player}\n")
    print(f"🌍 World:\n   {world}\n")
    print(f"🎯 Objects:\n   {objects}\n")
    print(f"🎨 Visual Style:\n   {visual_style}\n")
    


def extract_color_palette(image_path: str):
    """
    Extract color palette from an image for game theming
    
    Args:
        image_path (str): Path to image
    """
    interpreter = MediaInterpreter()
    
    colors = interpreter.interpret_image(
        image_path,
        prompt="List the 5 most dominant colors in this image with their hex codes if possible. Be specific.",
        max_tokens=100
    )
    
    print("\n" + "=" * 70)
    print("Color Palette Extraction")
    print("=" * 70)
    print(f"\n{colors}\n")
    print("=" * 70)
    
    return colors


def suggest_game_mechanics_from_image(image_path: str):
    """
    Suggest game mechanics based on image content
    
    Args:
        image_path (str): Path to image
    """
    interpreter = MediaInterpreter()
    
    mechanics = interpreter.interpret_image(
        image_path,
        prompt="""Based on this image, suggest 3 game mechanics that would work well.
Consider the visual elements, theme, and atmosphere. Format as a brief list.""",
        max_tokens=200
    )
    
    print("\n" + "=" * 70)
    print("Suggested Game Mechanics")
    print("=" * 70)
    print(f"\n{mechanics}\n")
    print("=" * 70)
    
    return mechanics



def main():
    """Run example demonstrations"""
    
    # Find a test image
    test_images = [
        Path(__file__).parent / 'assets' / 'test' / 'image2.png',
        # Path(__file__).parent / 'assets' / 'test' / 'pastal.jpg',
        # Path(__file__).parent / 'assets' / 'test' / 'simple.png',
        # Path(__file__).parent / 'assets' / 'test' / 'cake.jpg',
        # Path(__file__).parent / 'assets' / 'test' / 'cookie.jpg',
        # Path(__file__).parent / 'assets' / 'test' / 'cake.jpg',
        # Path(__file__).parent / 'assets' / 'test' / 'dino.jpg',
    ]
    
    test_image = None
    for img in test_images:
        if img.exists():
          test_image = str(img)
          print(" :: Analyzing image:", test_image)
          analyze_and_generate_game_assets(test_image)
        
        # # Example 2: Extract colors
        # extract_color_palette(test_image)
        
        # # Example 3: Suggest mechanics
        # suggest_game_mechanics_from_image(test_image)
        
      
if __name__ == "__main__":
    main()

