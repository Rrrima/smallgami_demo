import os
import json
import time
import concurrent.futures
from pathlib import Path
from flask import Blueprint, request, jsonify, current_app
from config import FRONTEND_ASSETS_DIR

blocks_bp = Blueprint('blocks', __name__)


@blocks_bp.route('/changePropagation', methods=['POST'])
def handle_change_propagation():
    """Handle change propagation requests - suggest what other blocks should change"""
    try:
        agent = current_app.config.get('AGENT')
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not initialized'
            }), 500

        data = request.json
        changed_block_type = data.get('changedBlockType', '')
        new_content = data.get('newContent', '')
        old_content = data.get('oldContent', '')
        mechanism = data.get('mechanism', '')
        mechanism_config = data.get('mechanismConfig', None)

        if not all([changed_block_type, new_content, mechanism]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: changedBlockType, newContent, or mechanism'
            }), 400

        print(f" :: Change Propagation Request:")
        print(f"    - Changed Block: {changed_block_type}")
        print(f"    - Old Content: {old_content}")
        print(f"    - New Content: {new_content}")
        print(f"    - Mechanism: {mechanism}")
        if mechanism_config:
            print(f"    - Mechanism Config: {mechanism_config.get('description', 'N/A')}")

        result = agent._suggest_block_changes(
            changed_block_type=changed_block_type,
            old_content=old_content,
            new_content=new_content,
            mechanism=mechanism,
            mechanism_config=mechanism_config,
            temperature=0.7
        )

        print(f" :: Cohesive Theme Generated:")
        print(f"    📖 {result.narrative}")
        print(f"    👤 Player: {result.player}")
        print(f"    🌍 World: {result.world}")

        result_dict = result.model_dump()
        for key, value in result_dict.items():
            if key not in ['player', 'world', 'narrative']:
                print(f"    📦 {key}: {value}")

        return jsonify({
            'success': True,
            'message': 'Cohesive theme generated',
            'data': result_dict
        })

    except Exception as e:
        print(f" :: Error handling change propagation: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error processing change propagation: {str(e)}'
        }), 500


@blocks_bp.route('/cohesiveChat', methods=['POST'])
def handle_cohesive_chat():
    """Handle cohesive chat requests that generate all blocks based on user message"""
    try:
        agent = current_app.config.get('AGENT')
        media_interpreter = current_app.config.get('MEDIA_INTERPRETER')
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not initialized'
            }), 500

        data = request.json
        message = data.get('message', '')
        image = data.get('image', None)
        current_narrative = data.get('currentNarrative', {})
        mechanism = data.get('mechanism', '')
        mechanism_config = data.get('mechanismConfig', None)

        if not mechanism:
            return jsonify({
                'success': False,
                'message': 'Missing required field: mechanism'
            }), 400

        if not message and not image:
            return jsonify({
                'success': False,
                'message': 'Either message or image must be provided'
            }), 400

        print(f" :: Cohesive Chat Request:")
        print(f"    - Message: {message if message else '(none - image only)'}")
        print(f"    - Has Image: {image is not None}")
        print(f"    - Current Narrative: {current_narrative}")
        print(f"    - Mechanism: {mechanism}")

        interpreted_context = message
        if image:
            print(f"    - Interpreting image...")
            image_description = media_interpreter.interpret_image(image, "complete_game")
            print(f"    - Image interpreted: {image_description}")
            if message:
                interpreted_context = f"{message}\n\nImage description: {image_description}"
            else:
                interpreted_context = f"Create a game based on this image: {image_description}"

        current_state = f"""Current game narrative:
Player: {current_narrative.get('player', 'Not set')}
World: {current_narrative.get('world', 'Not set')}
"""
        if mechanism_config and 'objects' in mechanism_config:
            for obj_key in mechanism_config['objects']:
                if obj_key in current_narrative:
                    current_state += f"{obj_key}: {current_narrative.get(obj_key, 'Not set')}\n"

        result = agent._suggest_block_changes(
            changed_block_type='player',
            old_content=current_state,
            new_content=f"User request: {interpreted_context}",
            mechanism=mechanism,
            mechanism_config=mechanism_config,
            temperature=0.8
        )

        print(f" :: Cohesive Theme Generated from Chat:")
        print(f"    📖 {result.narrative}")
        if result.transition:
            print(f"    ✨ {result.transition}")
        print(f"    👤 Player: {result.player}")
        print(f"    🌍 World: {result.world}")

        result_dict = result.model_dump()
        for key, value in result_dict.items():
            if key not in ['player', 'world', 'narrative', 'transition']:
                print(f"    📦 {key}: {value}")

        response_message = f"I've generated a cohesive theme based on your request: {result.narrative}"

        return jsonify({
            'success': True,
            'message': 'Cohesive theme generated from chat',
            'data': {
                'narrative': result_dict,
                'response': response_message
            }
        })

    except Exception as e:
        print(f" :: Error handling cohesive chat: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error processing cohesive chat: {str(e)}'
        }), 500


@blocks_bp.route('/blockGenerate', methods=['POST'])
def handle_block_generate():
    """Handle block generation/update requests from sticky blocks"""
    try:
        agent = current_app.config.get('AGENT')
        data = request.json
        block_type = data.get('blockType', '')
        action_type = data.get('actionType', '')
        content = data.get('content', '')

        if not all([block_type, action_type, content]):
            return jsonify({
                'success': False,
                'message': 'Missing required fields: blockType, actionType, or content'
            }), 400

        print(f" :: Block Generate Request:")
        print(f"    - Block Type: {block_type}")
        print(f"    - Action Type: {action_type}")
        print(f"    - Content: {content}")

        if block_type == 'player' and action_type == 'generate':
            if not agent:
                return jsonify({
                    'success': False,
                    'message': 'Agent not initialized'
                }), 500

            player_config = data.get('currentPlayerConfig', None)

            asset_result = None
            config_result = None
            asset_error = None
            config_error = None

            def generate_asset():
                nonlocal asset_result, asset_error
                try:
                    print(f" :: Generating asset for: {content}")
                    result = agent._generate_asset(content, [], temperature=0.7)
                    asset_result = result
                except Exception as e:
                    asset_error = str(e)
                    print(f" :: Error generating asset: {e}")

            def modify_config():
                nonlocal config_result, config_error
                try:
                    print(f" :: Modifying player config based on: {content}")
                    result = agent._change_player_config(content, player_config, temperature=0.7)
                    config_result = result
                except Exception as e:
                    config_error = str(e)
                    print(f" :: Error modifying config: {e}")

            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as executor:
                future_asset = executor.submit(generate_asset)
                future_config = executor.submit(modify_config)
                concurrent.futures.wait([future_asset, future_config])

            if asset_error and config_error:
                return jsonify({
                    'success': False,
                    'message': f'Both operations failed. Asset: {asset_error}, Config: {config_error}'
                }), 500
            elif asset_error:
                return jsonify({
                    'success': False,
                    'message': f'Asset generation failed: {asset_error}'
                }), 500
            elif config_error:
                return jsonify({
                    'success': False,
                    'message': f'Config modification failed: {config_error}'
                }), 500

            frontend_assets_dir = FRONTEND_ASSETS_DIR
            frontend_assets_dir.mkdir(parents=True, exist_ok=True)

            timestamp = int(time.time() * 1000)
            asset_filename = f'player_{timestamp}.json'
            asset_path = frontend_assets_dir / asset_filename

            with open(asset_path, 'w') as f:
                json.dump(asset_result.model_dump(), f, indent=2)
                f.flush()
                os.fsync(f.fileno())

            if not asset_path.exists():
                return jsonify({
                    'success': False,
                    'message': 'Failed to save asset file'
                }), 500

            return jsonify({
                'success': True,
                'message': 'Generated player asset and configuration',
                'data': {
                    'assetFilename': asset_filename,
                    'playerConfig': config_result.playerConfig.model_dump(),
                    'summary': config_result.summary
                }
            })

        if block_type == 'world' and action_type == 'generate':
            if not agent:
                return jsonify({
                    'success': False,
                    'message': 'Agent not initialized'
                }), 500

            world_config = data.get('currentWorldConfig', None)
            player_description = data.get('playerDescription', '')

            config_result = None
            ground_texture_result = None
            ambient_sound_result = None
            config_error = None
            ground_error = None
            sound_error = None

            def generate_world_config():
                nonlocal config_result, config_error
                try:
                    print(f" :: Generating world config for: {content}")
                    result = agent._change_world_config(content, world_config, temperature=0.7)
                    config_result = result
                except Exception as e:
                    config_error = str(e)
                    print(f" :: Error generating world config: {e}")

            def generate_ground_texture():
                nonlocal ground_texture_result, ground_error
                try:
                    print(f" :: Generating ground texture")
                    from VisualGenerator import VisualGenerator
                    visual_gen = VisualGenerator()
                    ground_texture_result = visual_gen.generate_and_save_ground_texture(
                        output_dir=FRONTEND_ASSETS_DIR,
                        world_description=content,
                        player_description=player_description if player_description else None,
                        filename=None,
                        size="1024x1024"
                    )
                    print(f" :: Ground texture saved as: {ground_texture_result}")
                except Exception as e:
                    ground_error = str(e)
                    print(f" :: Error generating ground texture: {e}")

            def generate_ambient_sound():
                nonlocal ambient_sound_result, sound_error
                try:
                    print(f" :: Generating ambient sound")
                    import requests as req
                    sound_prompt = f"Ambient background music for a game world: {content}"
                    if player_description:
                        sound_prompt += f". The player is: {player_description}"
                    sound_prompt += ". Loop-friendly, atmospheric, no abrupt changes."

                    response = req.post(
                        "https://api.stability.ai/v2beta/audio/stable-audio-2/text-to-audio",
                        headers={
                            "authorization": f"Bearer {os.getenv('STABILITY_API_KEY')}",
                            "accept": "audio/*"
                        },
                        files={"none": ""},
                        data={
                            "prompt": sound_prompt,
                            "output_format": "wav",
                            "duration": 10,
                            "model": "stable-audio-2.5",
                            "steps": 5,
                        },
                    )

                    if response.status_code == 200:
                        frontend_assets_dir = FRONTEND_ASSETS_DIR
                        frontend_assets_dir.mkdir(parents=True, exist_ok=True)
                        timestamp = int(time.time() * 1000)
                        audio_filename = f'ambient_{timestamp}.wav'
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

            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_config = executor.submit(generate_world_config)
                future_ground = executor.submit(generate_ground_texture)
                future_sound = executor.submit(generate_ambient_sound)
                concurrent.futures.wait([future_config, future_ground, future_sound])

            response_data = {}
            warnings = []

            if config_result:
                response_data['worldConfig'] = config_result.worldConfig.model_dump()
                response_data['summary'] = config_result.summary
            else:
                warnings.append(f"Config: {config_error}")

            if ground_texture_result:
                response_data['groundTexture'] = ground_texture_result
            else:
                warnings.append(f"Ground: {ground_error}")

            if ambient_sound_result:
                response_data['ambientSound'] = ambient_sound_result
            else:
                warnings.append(f"Sound: {sound_error}")

            if response_data:
                return jsonify({
                    'success': True,
                    'message': 'Generated world components',
                    'data': response_data,
                    'warnings': warnings if warnings else None
                })
            else:
                return jsonify({
                    'success': False,
                    'message': 'All world generation components failed',
                    'errors': warnings
                }), 500

        if block_type == 'object' and action_type == 'generate':
            if not agent:
                return jsonify({
                    'success': False,
                    'message': 'Agent not initialized'
                }), 500

            object_config = data.get('currentObjectConfig', None)
            spawn_configs = data.get('currentSpawnConfigs', [])
            world_description = data.get('worldDescription', '')
            mechanism = data.get('mechanism', '')
            mechanism_config = data.get('mechanismConfig', None)

            if not object_config:
                return jsonify({
                    'success': False,
                    'message': 'Object configuration is required'
                }), 400

            asset_result = None
            config_result = None
            spawn_result = None
            asset_error = None
            config_error = None
            spawn_error = None

            def generate_object_asset():
                nonlocal asset_result, asset_error
                try:
                    print(f" :: Generating asset for object: {content}")
                    asset_description = f"{content}"
                    if world_description:
                        asset_description += f" (in a {world_description} setting)"
                    result = agent._generate_asset(asset_description, [], temperature=0.7)
                    asset_result = result
                except Exception as e:
                    asset_error = str(e)
                    print(f" :: Error generating object asset: {e}")

            def modify_object_config():
                nonlocal config_result, config_error
                try:
                    print(f" :: Modifying object config for mechanism '{mechanism}' based on: {content}")
                    result = agent._change_object_config(content, object_config, world_description, mechanism, mechanism_config, temperature=0.7)
                    config_result = result
                except Exception as e:
                    config_error = str(e)
                    print(f" :: Error modifying object config: {e}")

            def modify_spawn_config():
                nonlocal spawn_result, spawn_error
                try:
                    timeout = 30
                    elapsed = 0
                    while config_result is None and config_error is None and elapsed < timeout:
                        time.sleep(0.1)
                        elapsed += 0.1

                    if config_result:
                        print(f" :: Modifying spawn config based on object changes")
                        result = agent._change_spawn_config(
                            modified_object=config_result.objectConfig.model_dump(),
                            object_change_summary=config_result.summary,
                            spawn_configs=spawn_configs,
                            world_description=world_description,
                            temperature=0.7
                        )
                        spawn_result = result
                    else:
                        spawn_error = "Object config modification failed or timed out"
                except Exception as e:
                    spawn_error = str(e)
                    print(f" :: Error modifying spawn config: {e}")

            with concurrent.futures.ThreadPoolExecutor(max_workers=3) as executor:
                future_asset = executor.submit(generate_object_asset)
                future_config = executor.submit(modify_object_config)
                future_spawn = executor.submit(modify_spawn_config)
                concurrent.futures.wait([future_asset, future_config, future_spawn])

            if asset_error and config_error:
                return jsonify({
                    'success': False,
                    'message': f'Both operations failed. Asset: {asset_error}, Config: {config_error}'
                }), 500
            elif asset_error:
                return jsonify({
                    'success': False,
                    'message': f'Asset generation failed: {asset_error}'
                }), 500
            elif config_error:
                return jsonify({
                    'success': False,
                    'message': f'Config modification failed: {config_error}'
                }), 500

            frontend_assets_dir = FRONTEND_ASSETS_DIR
            frontend_assets_dir.mkdir(parents=True, exist_ok=True)

            timestamp = int(time.time() * 1000)
            object_id = config_result.objectConfig.id
            asset_filename = f'{object_id}_{timestamp}.json'
            asset_path = frontend_assets_dir / asset_filename

            with open(asset_path, 'w') as f:
                json.dump(asset_result.model_dump(), f, indent=2)
                f.flush()
                os.fsync(f.fileno())

            if not asset_path.exists():
                return jsonify({
                    'success': False,
                    'message': 'Failed to save asset file'
                }), 500

            response_data = {
                'assetFilename': asset_filename,
                'objectConfig': config_result.objectConfig.model_dump(),
                'objectId': object_id,
                'summary': config_result.summary
            }

            if spawn_result:
                response_data['spawnConfigs'] = [sc.model_dump() for sc in spawn_result.spawnConfigs]
                response_data['spawnSummary'] = spawn_result.summary
                print(f" :: Spawn configs updated: {spawn_result.summary}")
            elif spawn_error:
                print(f" :: Warning: Spawn config update failed: {spawn_error}")
                response_data['spawnWarning'] = f"Spawn config update failed: {spawn_error}"

            return jsonify({
                'success': True,
                'message': 'Generated object asset and configuration',
                'data': response_data
            })

        return jsonify({
            'success': True,
            'message': f'Received {block_type} block with action {action_type}',
            'data': {
                'blockType': block_type,
                'actionType': action_type,
                'content': content
            }
        })

    except Exception as e:
        print(f" :: Error handling block generate: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing block generate: {str(e)}'
        }), 500
