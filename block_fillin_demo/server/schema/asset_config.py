from pydantic import BaseModel, Field
from typing import Dict, Literal, List


class ImageDecompositionConfig(BaseModel):
    worlds: str = Field(..., description="Worlds description")
    objects: List[str] = Field(..., description="Objects description, each should a single object, self-contained. ")
    events: str = Field(..., description="Events description")
    style: str = Field(..., description="Style description")


class AssetConfig(BaseModel):
    models: Dict[str, str] = Field(..., description="Asset models - key: asset name, value: asset path relative to assetRoot (.png or .glb file)")
    sounds: Dict[str, str] = Field(..., description="Asset sounds - key: asset name, value: asset path relative to assetRoot (.wav file)")
    skybox: str = Field(..., description="Skybox path relative to assetRoot (.png file)")


class AssetGenerationPromptConfig(BaseModel):
    model: Literal['gpt', 'sd'] = Field(..., description="Asset generation model")
    prompt: str = Field(..., description="Asset generation prompt")
    negative_prompt: str = Field(..., description="Asset generation negative prompt")
    reference_image_id: str = Field(..., description="Asset generation reference image id")
