from sys import api_version
from azure.identity import DefaultAzureCredential, get_bearer_token_provider, AzureCliCredential, ChainedTokenCredential, AzureCliCredential, ManagedIdentityCredential
from openai import AzureOpenAI, AsyncAzureOpenAI
from flask import Flask, request, Response, jsonify
from flask_cors import CORS, cross_origin
from config import SERVER_HOST, SERVER_PORT
from time import time
from io import BytesIO
import requests
import base64
from PIL import Image

app = Flask(__name__)
cors = CORS(app) # allow CORS for all domains on all routes.
app.config['CORS_HEADERS'] = 'Content-Type'

token_provider = get_bearer_token_provider(
    DefaultAzureCredential(),
    "https://cognitiveservices.azure.com/.default"
)
credential = DefaultAzureCredential()
token_response = credential.get_token("https://cognitiveservices.azure.com/.default")

@app.route("/")
def hello_world():
    return "Hello World"

## Parameters for this are
# - prompt [REQUIRED]: The user prompt to send to the LLM
# - voice [OPTIONAL]: The voice to use for the TTS
# - instructions [OPTIONAL]: The instructions for the TTS
@app.route("/text_to_speech", methods=["POST"])
async def text_to_speech():
    ENDPOINT = "https://vellumeastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini-tts/audio/speech?api-version=2025-03-01-preview"
    DEFAULT_MODEL = 'gpt-4o-mini-tts'
    DEFAULT_API = "2025-03-01-preview"

    start_time = time()
    audio_data = b""
    prompt = request.json.get("prompt")
    voice = request.json.get("voice", "coral")  # Default system prompt if not provided
    instructions = request.json.get("instructions", "slowly, cute, and whispering")
    client = AsyncAzureOpenAI(
        azure_endpoint=ENDPOINT,
        azure_ad_token_provider=token_provider,
        api_version=DEFAULT_API,
    )
    async with client.audio.speech.with_streaming_response.create(
        model=DEFAULT_MODEL,
        voice=voice,
        input=prompt,
        instructions=instructions,
    ) as response:
        # Read the audio data into memory
        async for chunk in response.iter_bytes():
            audio_data += chunk
        # Close the client session
    await client.close()
    end_time = time()
    print(f"Time taken: {end_time - start_time} seconds")
    return Response(content=audio_data, media_type="audio/mpeg")

## Parameters for this are
# - FormData [REQUIRED] with 'audio' file
@app.route("/speech_to_text", methods=["POST"])
async def speech_to_text():
    ENDPOINT = "https://vellumeastus2.cognitiveservices.azure.com/openai/deployments/gpt-4o-mini-transcribe/audio/transcriptions?api-version=2025-03-01-preview"
    DEFAULT_MODEL = 'gpt-4o-mini-transcribe'
    DEFAULT_API = "2025-03-20"
    audio_file = request.files['audio']

    client = AsyncAzureOpenAI(
        azure_endpoint=ENDPOINT,
        azure_ad_token_provider=token_provider,
        api_version=DEFAULT_API,
    )

    # Read audio file content
    audio_content = audio_file.read()
    audio_file.seek(0)  # Reset file pointer for potential future use
    
    # Determine file format and set appropriate filename
    filename = audio_file.filename or 'audio'
    content_type = audio_file.content_type or ''
    
    # Handle different audio formats
    if 'mp3' in content_type or 'mpeg' in content_type:
        filename = filename if filename.endswith('.mp3') else 'audio.mp3'
    elif 'wav' in content_type:
        filename = filename if filename.endswith('.wav') else 'audio.wav'
    elif 'webm' in content_type:
        filename = filename if filename.endswith('.webm') else 'audio.webm'
    elif 'ogg' in content_type:
        filename = filename if filename.endswith('.ogg') else 'audio.ogg'
    else:
        # Default to mp3 for TTS-generated audio
        filename = 'audio.mp3'
    
    # Create a temporary file-like object for the API call
    audio_io = BytesIO(audio_content)
    audio_io.name = filename
    
    # Add debug logging
    print(f"Transcribing audio: filename={filename}, content_type={content_type}, size={len(audio_content)} bytes")
    
    response = await client.audio.transcriptions.create(
        model=DEFAULT_MODEL,
        file=audio_io,
        response_format="text"
    )
    await client.close()
    return response

@app.route("/gpt_image_edit", methods=["POST"])
def gptimage():
    data = request.json
    prompt = data['prompt']
    image_edit = data["image"]
    print(f"Editing image: {prompt}, Incoming Ip: {request.remote_addr}")
    # You will need to set these environment variables or edit the following values.
    AZURE_OPENAI_ENDPOINT= "https://vellumeastus2.cognitiveservices.azure.com/"
    DEPLOYMENT_NAME = "gpt-image-1"
    OPENAI_API_VERSION = "2025-04-01-preview"

    base_path = f'openai/deployments/{DEPLOYMENT_NAME}/images'
    params = f'?api-version={OPENAI_API_VERSION}'
    # In addition to generating images, you can edit them.
    edit_url = f"{AZURE_OPENAI_ENDPOINT}{base_path}/edits{params}"
    edit_body = {
        "prompt": prompt,
        "n": 1,
        "size": "1024x1024",
        "quality": "low"
    }    
    image_bytes = base64.b64decode(image_edit)
    image_io = BytesIO(image_bytes)
    files = {
        "image": ("image.jpg", image_io, "image/jpeg"),
    }
    start_time = time()
    edit_response = requests.post(
        edit_url,
        headers={'Authorization': 'Bearer ' + token_response.token},
        data=edit_body,
        files=files
    ).json()
    end_time = time()
    print(f"Time taken: {end_time - start_time} seconds")

    return jsonify({'image': edit_response['data'][0]['b64_json']}), 200

## Parameters for this are
# Generate video from text using Azure OpenAI Sora model
# Expected request body:
# {
#     "prompt": "Your text prompt here",
#     "width": 480 (optional, default 480),
#     "height": 480 (optional, default 480), 
#     "n_seconds": 5 (optional, default 5)
# } 
@app.route("/text2video", methods=["POST"])
def text2video():
    data = request.json
    prompt = data['prompt']
    width = data.get('width', 480)
    height = data.get('height', 480)
    n_seconds = data.get('n_seconds', 5)
    
    # Azure OpenAI Sora configuration
    ENDPOINT = "https://haotian-east-us-2.openai.azure.com/"
    API_VERSION = "preview"
    headers = {"Authorization": f"Bearer {token_provider()}", "Content-Type": "application/json"}
    
    # 1. Create a video generation job
    create_url = f"{ENDPOINT}/openai/v1/video/generations/jobs?api-version={API_VERSION}"
    body = {
        "prompt": prompt,
        "width": width,
        "height": height,
        "n_seconds": n_seconds,
        "model": "sora"
    }
    response = requests.post(create_url, headers=headers, json=body)
    response.raise_for_status()
    
    job_data = response.json()
    job_id = job_data["id"]
    print(f"Video generation job created: {job_id}")
    return job_id

@app.route("/getvideo", methods=["POST"])
def getvideo():
    data = request.json
    job_id = data['job_id']

    # Azure OpenAI Sora configuration
    ENDPOINT = "https://haotian-east-us-2.openai.azure.com/"
    API_VERSION = "preview"
    headers = {"Authorization": f"Bearer {token_provider()}", "Content-Type": "application/json"}

    # Get status
    status_url = f"{ENDPOINT}/openai/v1/video/generations/jobs/{job_id}?api-version={API_VERSION}"
    status_response = requests.get(status_url, headers=headers)
    status_response.raise_for_status()
    status_data = status_response.json()
    status = status_data.get("status")

    if status == "succeeded":
        generations = status_data.get("generations", [])
        if generations:
            video_url = f"{ENDPOINT}/openai/v1/video/generations/{job_id}/content/video?api-version={API_VERSION}"
            video_response = requests.get(video_url, headers=headers)
            video_response.raise_for_status()

            # Convert video content to base64 for direct return
            video_content = video_response.content
            video_base64 = base64.b64encode(video_content).decode('utf-8')
            video_data_url = f"data:video/mp4;base64,{video_base64}"
            
            print(f'Generated video ready as data URL (size: {len(video_content)} bytes)')
            
            return jsonify({
                'success': True,
                'message': 'Video generated successfully',
                'job_id': job_id,
                'video_data': video_data_url,
                'video_size': len(video_content),
                'status': status
            })
        else:
            return jsonify({'error': 'No generations found in job result'}), 500
    elif status == "failed":
        error_msg = status_data.get("error", {}).get("message", "Unknown error")
        return jsonify({'error': f'Video generation failed: {error_msg}'}), 500
    elif status == "cancelled":
        return jsonify({'error': 'Video generation was cancelled'}), 500
    else:
        return jsonify({'error': f'Video generation timed out. Last status: {status}'}), 408

def interrogate_LLM(prompt, system_prompt, temperature, api_version, deployment_name, endpoint, response_format):
    #Create an AzureOpenAI Client
    client = AzureOpenAI(
        azure_endpoint=endpoint,
        azure_ad_token_provider=token_provider,
        api_version=api_version,
    )
  
    # Build the request parameters dynamically
    chat_params = {
        "model": deployment_name,
        "temperature": temperature,  
        "messages": [
            {
                "role": "system",
                "content": system_prompt,
            },
            {
                "role": "user",
                "content": prompt,
            },
        ]
    }
    
    # Add response_format only if it's not None
    if response_format is not None:
        chat_params["response_format"] = response_format
    
    #Do a chat completion and capture the response
    response = client.chat.completions.create(**chat_params)
    print(response.choices[0].message.content)
    return response.choices[0].message.content

## Parameters for this are
# - prompt [REQUIRED]: The user prompt to send to the LLM
# - system_prompt [OPTIONAL]: The system prompt to guide the LLM's behavior
# - temperature [OPTIONAL]: The sampling temperature to use for the LLM
# - api_version [OPTIONAL]: The API version to use for the request
# - deployment_name [OPTIONAL]: The deployment name to use for the request
# - endpoint [OPTIONAL]: The endpoint URL for the request
@app.route('/askLLM', methods=['POST'])
def callLLM():
    ENDPOINT = "https://projectvellumopenai.openai.azure.com/"
    DEFAULT_MODEL = 'gpt-4o'
    DEFAULT_API = '2025-01-01-preview'

    start_time = time()
    prompt = request.json.get("text") or request.json.get("prompt")
    system_prompt = request.json.get("system_prompt", "You are a helpful assistant.")  # Default system prompt if not provided
    temperature = request.json.get("temperature", 0.7)  # Default to 0.7 if not provided
  
    api_version = request.json.get("api_version", DEFAULT_API)  # Ensure this is a valid API version see: https://learn.microsoft.com/en-us/azure/ai-services/openai/api-version-deprecation#latest-ga-api-release
    deployment_name = request.json.get("deployment_name", DEFAULT_MODEL)  # Ensure this is a valid deployment name see https://aka.ms/trapi/models for the deployment name
    endpoint = request.json.get("endpoint", ENDPOINT)
    response_format = request.json.get("response_format", None)

    print(f"Prompt length {len(prompt)}, Deployment {deployment_name}, Endpoint {endpoint}")
    
    # print(prompt)
    output = interrogate_LLM(prompt, system_prompt, temperature, api_version, deployment_name, endpoint, response_format)
    # print(output)
    end_time = time()
    print(f"Time taken: {end_time - start_time} seconds")
    return output

if __name__ == '__main__':
    print(interrogate_LLM("how are you", "You are a helpful assistant.", 0.7, '2025-01-01-preview', 'gpt-4o', "https://projectvellumopenai.openai.azure.com/", None))
    app.run(host=SERVER_HOST, port=SERVER_PORT, debug=True)