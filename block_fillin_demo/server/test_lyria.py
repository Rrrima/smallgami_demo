
import base64, io, requests
from pydub import AudioSegment
import google.auth
from google.auth.transport.requests import Request

def generate_lyria_sound_1s(project: str, location: str, prompt: str, out_file: str):
    creds, _ = google.auth.default(scopes=["https://www.googleapis.com/auth/cloud-platform"])
    creds.refresh(Request())
    access_token = creds.token

    endpoint = (
        f"https://{location}-aiplatform.googleapis.com/v1/"
        f"projects/{project}/locations/{location}/publishers/google/models/lyria-002:predict"
    )

    payload = {
        "instances": [{
            "prompt": prompt,
            "negative_prompt": "music, melody, rhythm, vocals, reverb"
        }]
    }

    resp = requests.post(
        endpoint,
        headers={
            "Authorization": f"Bearer {access_token}",
            "Content-Type": "application/json",
        },
        json=payload,
        timeout=300,
    )

    print("status:", resp.status_code)
    print("response head:", resp.text[:500])
    resp.raise_for_status()
    data = resp.json()

    pred0 = data.get("predictions", [None])[0]
    if not isinstance(pred0, dict):
        raise RuntimeError(f"Unexpected response (no predictions dict): {data}")

    b64 = pred0.get("audioContent") or pred0.get("bytesBase64Encoded") or pred0.get("audio_content")
    if not b64:
        print("Prediction keys:", list(pred0.keys()))
        raise RuntimeError(f"No audio base64 field found. Full response:\n{data}")

    wav_bytes = base64.b64decode(b64)
    audio = AudioSegment.from_file(io.BytesIO(wav_bytes), format="wav")
    audio[:1000].export(out_file, format="wav")
    print("Saved:", out_file)

if __name__ == "__main__":
    generate_lyria_sound_1s(
        project="smallgami",
        location="us-central1",
        prompt="A single, very short foley-like jump landing on soft powder snow. Muted dry crunch, no music.",
        out_file="snow_jump_1s.wav",
    )
