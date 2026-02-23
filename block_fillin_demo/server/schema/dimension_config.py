from pydantic import BaseModel, Field
from typing import List

class PlayerDescription(BaseModel):
    description: str = Field(description="Player visual description")
    asset_ref: str = Field(description="asset id from the assets list if N/A, then player will be generated")
    need_update: bool = Field(description="whether the player asset needs to be updated, true for all new assets")

class WorldDescription(BaseModel):
    description: str = Field(description="World visual description")
    asset_ref: str = Field(description="asset id from the assets list if N/A, then world will be generated")
    need_update: bool = Field(description="whether the player asset needs to be updated, true for all new assets")

class ObjectDescription(BaseModel):
    name: str = Field(description="give it a short form name as an identifier, if the need_update is false, the name should stay the same")
    description: str = Field(description="Object visual description")
    behavior: str = Field(description="idle behavior description when there is no interaction")
    effect: str = Field(description="Effect description when the user interact with the object")
    asset_ref: str = Field(description="asset id from the assets list if N/A, then object will be generated")
    need_update: bool = Field(description="whether the player asset needs to be updated, true for all new assets")

class NarrativeDescription(BaseModel):
    transition: str = Field(description="how we get to the current scene, introductory transition if it's the intial generation")
    current_story: str = Field(description="what's happening now")
    next_story: str = Field(description="what's happening next")

class JumpGameDescription(BaseModel):
    player: PlayerDescription 
    world: WorldDescription 
    platforms: List[ObjectDescription] 
    collectables: List[ObjectDescription] 
    narrative: NarrativeDescription 
    visual_style: str = Field(description="Visual style description")