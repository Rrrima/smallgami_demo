from flask import Blueprint, request, jsonify, current_app

agent_bp = Blueprint('agent', __name__)


@agent_bp.route('/chat', methods=['POST'])
def handle_chat_message():
    """Handle chat messages using two-step agent (intent detection + routing)"""
    try:
        agent = current_app.config.get('AGENT')
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not initialized. Please check your API keys.'
            }), 500

        data = request.json
        user_message = data.get('message', '')
        history = data.get('history', [])
        world_config = data.get('worldConfig', None)
        temperature = data.get('temperature', 0.7)

        if not user_message:
            return jsonify({
                'success': False,
                'message': 'No message provided'
            }), 400

        result = agent.process_message(
            message=user_message,
            history=history,
            world_config=world_config,
            temperature=temperature
        )

        return jsonify({
            'success': True,
            'response': result['response'],
            'intent': result['intent']
        })

    except Exception as e:
        print(f" :: Error handling chat message: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error processing chat message: {str(e)}'
        }), 500


@agent_bp.route('/agent/switch', methods=['POST'])
def switch_agent_model():
    """Switch the AI agent to a different model"""
    try:
        agent = current_app.config.get('AGENT')
        if not agent:
            return jsonify({
                'success': False,
                'message': 'Agent not initialized'
            }), 500

        data = request.json
        model = data.get('model')

        if not model:
            return jsonify({
                'success': False,
                'message': 'Model parameter is required'
            }), 400

        agent.switch_model(model)

        return jsonify({
            'success': True,
            'message': f'Switched to {model}',
            'info': agent.get_info()
        })

    except Exception as e:
        print(f" :: Error switching model: {str(e)}")
        return jsonify({
            'success': False,
            'message': f'Error switching model: {str(e)}'
        }), 500
