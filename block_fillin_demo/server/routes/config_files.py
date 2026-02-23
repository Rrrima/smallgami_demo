import json
import time
from pathlib import Path
from flask import Blueprint, request, jsonify
from config import FRONTEND_CONFIG_DIR

config_files_bp = Blueprint('config_files', __name__)


@config_files_bp.route('/save-game-config', methods=['POST'])
def save_game_config():
    """Save game configuration to demo/src/config/ folder"""
    try:
        data = request.json
        game_config = data.get('game_config', None)
        game_name = data.get('game_name', None)

        if not game_config:
            return jsonify({
                'success': False,
                'message': 'No game configuration provided'
            }), 400

        if not game_name:
            return jsonify({
                'success': False,
                'message': 'No game name provided'
            }), 400

        safe_game_name = game_name.strip().replace(' ', '_').lower()
        safe_game_name = ''.join(c for c in safe_game_name if c.isalnum() or c == '_')

        config_dir = FRONTEND_CONFIG_DIR
        config_dir.mkdir(parents=True, exist_ok=True)

        filename = f"{safe_game_name}.json"
        file_path = config_dir / filename

        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(game_config, f, indent=2, ensure_ascii=False)

        print(f" :: Game config saved: {file_path}")

        return jsonify({
            'success': True,
            'message': 'Game configuration saved successfully',
            'filename': filename
        })

    except Exception as e:
        print(f" :: Error saving game config: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error saving game config: {str(e)}'
        }), 500


@config_files_bp.route('/list-config-files', methods=['GET'])
def list_config_files():
    """List all JSON config files in demo/src/config/ folder"""
    try:
        config_dir = FRONTEND_CONFIG_DIR

        if not config_dir.exists():
            return jsonify({
                'success': True,
                'files': [],
                'message': 'Config directory does not exist'
            })

        json_files = []
        for file_path in config_dir.glob('*.json'):
            if file_path.is_file():
                stat = file_path.stat()
                json_files.append({
                    'filename': file_path.name,
                    'size': stat.st_size,
                    'modified': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(stat.st_mtime))
                })

        json_files.sort(key=lambda x: x['modified'], reverse=True)

        print(f" :: Found {len(json_files)} config files")

        return jsonify({
            'success': True,
            'files': json_files,
            'message': f'Found {len(json_files)} config files'
        })

    except Exception as e:
        print(f" :: Error listing config files: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error listing config files: {str(e)}'
        }), 500


@config_files_bp.route('/load-config-file/<filename>', methods=['GET'])
def load_config_file(filename):
    """Load a specific config file from demo/src/config/ folder"""
    try:
        safe_filename = Path(filename).name
        if not safe_filename.endswith('.json'):
            safe_filename += '.json'

        file_path = FRONTEND_CONFIG_DIR / safe_filename

        if not file_path.exists():
            return jsonify({
                'success': False,
                'message': f'Config file not found: {safe_filename}'
            }), 404

        with open(file_path, 'r', encoding='utf-8') as f:
            config = json.load(f)

        print(f" :: Config file loaded: {file_path}")

        return jsonify({
            'success': True,
            'config': config,
            'filename': safe_filename,
            'message': 'Config file loaded successfully'
        })

    except Exception as e:
        print(f" :: Error loading config file: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'message': f'Error loading config file: {str(e)}'
        }), 500
