from flask import Blueprint, request, jsonify, current_app

media_bp = Blueprint('media', __name__)


@media_bp.route('/interpretMedia', methods=['POST'])
def handle_interpret_media():
    """Handle media interpretation requests - describe what's in an image"""
    try:
        media_interpreter = current_app.config.get('MEDIA_INTERPRETER')
        if not media_interpreter:
            return jsonify({
                'success': False,
                'message': 'MediaInterpreter not initialized. Please check your OpenAI API key.'
            }), 500

        data = request.json
        image_data = data.get('image', '')
        image_path = data.get('imagePath', '')
        block_type = data.get('blockType', None)
        interpretation_type = data.get('type', None)
        custom_prompt = data.get('prompt', None)

        if not image_data and not image_path:
            return jsonify({
                'success': False,
                'message': 'Either image (base64) or imagePath must be provided'
            }), 400

        image_input = image_path if image_path else image_data

        print(f" :: Media Interpretation Request:")
        print(f"    - Block Type: {block_type}")
        print(f"    - Type: {interpretation_type}")
        print(f"    - Input: {'file path' if image_path else 'base64 data'}")

        description = None

        if custom_prompt:
            description = media_interpreter.interpret_image(
                image_input=image_input,
                prompt=custom_prompt
            )
        elif block_type == 'player':
            description = media_interpreter.get_player(image_input)
        elif block_type == 'world':
            description = media_interpreter.get_world(image_input)
        elif block_type == 'object':
            description = media_interpreter.get_objects(image_input)
        elif block_type == 'complete_game':
            description = media_interpreter.get_quick_description(image_input)
        elif interpretation_type == 'quick':
            description = media_interpreter.get_quick_description(image_input)
        elif interpretation_type == 'visual_style':
            description = media_interpreter.get_visual_style(image_input)
        else:
            return jsonify({
                'success': False,
                'message': 'Invalid block type or interpretation type'
            }), 400

        print(f" :: Interpretation completed: {description[:100] if len(description) > 100 else description}")

        return jsonify({
            'success': True,
            'description': description,
            'blockType': block_type,
            'type': interpretation_type
        })

    except Exception as e:
        print(f" :: Error interpreting media: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error interpreting media: {str(e)}'
        }), 500
