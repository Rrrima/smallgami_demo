"""
Test script for VisualGenerator class
Tests ground texture generation and other visual asset generation features.
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv
from termcolor import colored

# Add parent directory to path to import VisualGenerator
sys.path.append(str(Path(__file__).parent))

from VisualGenerator import VisualGenerator

# Load environment variables
load_dotenv()


def test_initialization():
    """Test VisualGenerator initialization"""
    print(f"\n{colored('🧪 Test 1: Initialization', 'cyan', attrs=['bold'])}")
    
    try:
        # Test with environment variable
        visual_gen = VisualGenerator()
        print(f"✅ Successfully initialized VisualGenerator with env variable")
        return True
    except Exception as e:
        print(f"❌ Failed to initialize: {e}")
        return False


def test_ground_texture_generation_simple():
    """Test simple ground texture generation"""
    print(f"\n{colored('🧪 Test 2: Simple Ground Texture Generation', 'cyan', attrs=['bold'])}")
    
    try:
        visual_gen = VisualGenerator()
        
        prompt = "grass field with flowers"
        print(f"Prompt: {prompt}")
        print(f"Model: gpt-image-1-mini (default)")
        
        texture_bytes = visual_gen.generate_ground_texture(
            prompt=prompt,
            size="1024x1024",
            model="gpt-image-1-mini"
        )
        
        print(f"✅ Generated texture: {len(texture_bytes)} bytes")
        return texture_bytes
    except Exception as e:
        print(f"❌ Failed to generate texture: {e}")
        return None


def test_ground_texture_with_context():
    """Test ground texture generation with world and player context"""
    print(f"\n{colored('🧪 Test 3: Ground Texture with Context', 'cyan', attrs=['bold'])}")
    
    try:
        visual_gen = VisualGenerator()
        
        prompt = "snowy ground"
        world_desc = "winter wonderland theme"
        player_desc = "a snowman character"
        
        print(f"Prompt: {prompt}")
        print(f"World: {world_desc}")
        print(f"Player: {player_desc}")
        print(f"Model: gpt-image-1-mini")
        
        texture_bytes = visual_gen.generate_ground_texture(
            prompt=prompt,
            world_description=world_desc,
            player_description=player_desc,
            size="1024x1024",
            model="gpt-image-1-mini"
        )
        
        print(f"✅ Generated contextual texture: {len(texture_bytes)} bytes")
        return texture_bytes
    except Exception as e:
        print(f"❌ Failed to generate texture: {e}")
        return None


def test_save_texture():
    """Test saving texture to file"""
    print(f"\n{colored('🧪 Test 4: Save Texture to File', 'cyan', attrs=['bold'])}")
    
    try:
        visual_gen = VisualGenerator()
        
        # Generate a simple texture
        prompt = "sandy beach texture"
        print(f"Generating texture: {prompt}")
        print(f"Model: gpt-image-1-mini")
        
        texture_bytes = visual_gen.generate_ground_texture(
            prompt=prompt,
            size="1024x1024",
            model="gpt-image-1-mini"
        )
        
        # Save to test output directory
        output_dir = Path(__file__).parent / 'assets' / 'test_output'
        output_dir.mkdir(parents=True, exist_ok=True)
        
        filename = visual_gen.save_texture_to_assets(
            texture_bytes=texture_bytes,
            output_dir=output_dir,
            filename="test_beach_texture.png"
        )
        
        saved_path = output_dir / filename
        if saved_path.exists():
            print(f"✅ Texture saved successfully: {saved_path}")
            print(f"   File size: {saved_path.stat().st_size} bytes")
            return str(saved_path)
        else:
            print(f"❌ File not found at expected path: {saved_path}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to save texture: {e}")
        return None


def test_generate_and_save():
    """Test combined generate and save method"""
    print(f"\n{colored('🧪 Test 5: Generate and Save (Combined)', 'cyan', attrs=['bold'])}")
    
    try:
        visual_gen = VisualGenerator()
        
        player_desc = "a cute bun :P"
        
        print(f"Player: {player_desc}")
        print(f"Model: gpt-image-1-mini")
        
        # Output directory
        output_dir = Path(__file__).parent / 'assets' / 'test_output'
        
        # Generate and save in one call
        filename = visual_gen.generate_and_save_ground_texture(
            output_dir=output_dir,
            player_description=player_desc,
            world_description="a chinese restaurant",
            size="1024x1024",
            model="gpt-image-1-mini"
        )
        
        saved_path = output_dir / filename
        if saved_path.exists():
            print(f"✅ Texture generated and saved: {saved_path}")
            print(f"   Filename: {filename}")
            print(f"   File size: {saved_path.stat().st_size} bytes")
            return str(saved_path)
        else:
            print(f"❌ File not found at expected path: {saved_path}")
            return None
            
    except Exception as e:
        print(f"❌ Failed to generate and save: {e}")
        return None


def test_multiple_textures():
    """Test generating multiple different textures"""
    print(f"\n{colored('🧪 Test 6: Multiple Texture Generation', 'cyan', attrs=['bold'])}")
    
    prompts = [
        ("forest ground with leaves", "forest theme"),
        ("ice surface texture", "frozen world"),
        ("desert sand dunes", "desert theme"),
    ]
    
    visual_gen = VisualGenerator()
    output_dir = Path(__file__).parent / 'assets' / 'test_output'
    
    results = []
    
    for i, (prompt, world) in enumerate(prompts, 1):
        print(f"\n  [{i}/{len(prompts)}] Generating: {prompt}")
        try:
            filename = visual_gen.generate_and_save_ground_texture(
                prompt=prompt,
                output_dir=output_dir,
                world_description=world,
                size="1024x1024",
                model="gpt-image-1-mini"
            )
            print(f"  ✅ Saved as: {filename}")
            results.append(filename)
        except Exception as e:
            print(f"  ❌ Failed: {e}")
            results.append(None)
    
    successful = sum(1 for r in results if r is not None)
    print(f"\n✅ Successfully generated {successful}/{len(prompts)} textures")
    
    return results


def test_error_handling():
    """Test error handling with invalid inputs"""
    print(f"\n{colored('🧪 Test 7: Error Handling', 'cyan', attrs=['bold'])}")
    
    # Test with invalid API key
    print("\n  Testing with invalid API key...")
    try:
        visual_gen = VisualGenerator(api_key="invalid_key")
        visual_gen.generate_ground_texture("test", size="1024x1024", model="gpt-image-1-mini")
        print("  ❌ Should have raised an error")
        return False
    except Exception as e:
        print(f"  ✅ Correctly raised error: {type(e).__name__}")
    
    # Test with valid generator but empty prompt
    print("\n  Testing with empty prompt...")
    try:
        visual_gen = VisualGenerator()
        visual_gen.generate_ground_texture("", size="1024x1024", model="gpt-image-1-mini")
        print("  ⚠️  Empty prompt was accepted (API may handle this)")
    except Exception as e:
        print(f"  ✅ Correctly raised error: {type(e).__name__}")
    
    return True


def run_all_tests():
    """Run all tests"""
    print(f"\n{'='*60}")
    print(f"{colored('🎨 VisualGenerator Test Suite', 'magenta', attrs=['bold'])}")
    print(f"{'='*60}")
    
    # Check for API key
    if not os.getenv('OPENAI_API_KEY'):
        print(f"\n{colored('❌ ERROR: OPENAI_API_KEY not found in environment', 'red', attrs=['bold'])}")
        print("Please set your OpenAI API key in the .env file")
        return
    
    tests = [
        ("Generate and Save", test_generate_and_save)
    ]
    
    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, result is not None and result is not False))
        except Exception as e:
            print(f"\n{colored(f'❌ Test failed with exception: {e}', 'red')}")
            results.append((test_name, False))
    
    # Summary
    print(f"\n{'='*60}")
    print(f"{colored('📊 Test Summary', 'magenta', attrs=['bold'])}")
    print(f"{'='*60}")
    
    passed = sum(1 for _, success in results if success)
    total = len(results)
    
    for test_name, success in results:
        status = colored("✅ PASSED", "green") if success else colored("❌ FAILED", "red")
        print(f"  {status} - {test_name}")
    
    print(f"\n{colored(f'Results: {passed}/{total} tests passed', 'cyan', attrs=['bold'])}")
    
    if passed == total:
        print(f"{colored('🎉 All tests passed!', 'green', attrs=['bold'])}")
    else:
        print(f"{colored('⚠️  Some tests failed', 'yellow', attrs=['bold'])}")
    
    # Show output directory
    output_dir = Path(__file__).parent / 'assets' / 'test_output'
    if output_dir.exists():
        png_files = list(output_dir.glob('*.png'))
        print(f"\n📁 Generated textures saved to: {output_dir}")
        print(f"   Total files: {len(png_files)}")


def test_specific_scenario(prompt, world_desc=None, player_desc=None):
    """
    Test a specific scenario with custom parameters.
    Useful for quick testing and debugging.
    
    Example:
        test_specific_scenario("magical crystal floor", player_desc="wizard with staff")
    """
    print(f"\n{colored('🎯 Custom Scenario Test', 'cyan', attrs=['bold'])}")
    
    visual_gen = VisualGenerator()
    output_dir = Path(__file__).parent / 'assets' / 'test_output'
    
    print(f"Prompt: {prompt}")
    if world_desc:
        print(f"World: {world_desc}")
    if player_desc:
        print(f"Player: {player_desc}")
    
    try:
        filename = visual_gen.generate_and_save_ground_texture(
            prompt=prompt,
            output_dir=output_dir,
            world_description=world_desc,
            player_description=player_desc,
            size="1024x1024"  # Full size for custom tests
        )
        
        saved_path = output_dir / filename
        print(f"✅ Generated: {saved_path}")
        print(f"   Size: {saved_path.stat().st_size / 1024:.1f} KB")
        return str(saved_path)
        
    except Exception as e:
        print(f"❌ Failed: {e}")
        return None


if __name__ == "__main__":
    # Run all tests by default
    run_all_tests()
    
    # Uncomment to test specific scenarios:
    # test_specific_scenario("cobblestone path", player_desc="medieval knight")
    # test_specific_scenario("neon grid floor", world_desc="cyberpunk city")

