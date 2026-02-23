from flask import Flask
from flask_cors import CORS
from gami_agent import GamiAgent
from MediaInterpreter import MediaInterpreter
import os
from routes.agent import agent_bp
from routes.blocks import blocks_bp
from routes.media import media_bp
from routes.config_files import config_files_bp


def create_app():
    app = Flask(__name__)
    CORS(app)
    app.config['CORS_HEADERS'] = 'Content-Type'

    default_model = os.getenv('LLM_MODEL', 'gpt-4o')

    try:
        app.config['AGENT'] = GamiAgent(model=default_model)
        print(f" :: Agent initialized with {default_model}")
    except Exception as e:
        print(f" :: Warning: Could not initialize agent with {default_model}: {e}")
        app.config['AGENT'] = None

    try:
        app.config['MEDIA_INTERPRETER'] = MediaInterpreter()
        print(f" :: MediaInterpreter initialized")
    except Exception as e:
        print(f" :: Warning: Could not initialize MediaInterpreter: {e}")
        app.config['MEDIA_INTERPRETER'] = None

    app.register_blueprint(agent_bp)
    app.register_blueprint(blocks_bp)
    app.register_blueprint(media_bp)
    app.register_blueprint(config_files_bp)

    @app.route('/')
    def hello_world():
        return 'SmallGami Server Running'

    return app


app = create_app()

if __name__ == '__main__':
    if os.environ.get('WERKZEUG_RUN_MAIN') == 'true':
        agent = app.config.get('AGENT')
        if agent:
            info = agent.get_info()
            print(f" :: Agent ready - Provider: {info['provider']}, Model: {info['model']}")
        else:
            print(" :: Warning: Agent not initialized. Check your API keys.")
        print(" :: Starting SmallGami server on http://0.0.0.0:8000")

    app.run(host='0.0.0.0', port=8000, debug=True)
