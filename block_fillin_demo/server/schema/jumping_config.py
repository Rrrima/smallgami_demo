from pydantic import BaseModel, Field, RootModel
from typing import Dict, List, Optional, Literal
from .asset_config import AssetConfig


# class PlayerDescription(BaseModel):
#     character_visual: str = Field(..., description="Player character description, in a detailed way that can be used to generate a player asset")
#     motion_style: str = Field(..., description="Player motion style")
#     story: str = Field(..., description="Player story")
#     goal: str = Field(..., description="Player goal")

# class ObjectDescription(BaseModel):
#     visual_description: str = Field(..., description="Object description, only describe one single object")
#     effect: str = Field(..., description="Object effect")

# class EventDescription(BaseModel):
#     event: str = Field(..., description="next events that lead to small changes like scene change, or play dynamics, but interesting!")
#     message: str = Field(..., description="message to the player, be as concise as possible! and informative about the event itself!, such as 'wind come!' you do not need full sentence!")

# class JumpGameDescription(BaseModel):
#     story: str = Field(..., description="A simple description of the story in a format of I am _____, I am jumping on _____, collecting _____ to _____")
#     visual_style: str = Field(..., description="Visual style of the game")
#     player: PlayerDescription 
#     world: str = Field(..., description="description of the world that will be used to generate a skybox background")
#     animation_style: str = Field(..., description="Animation style of the game")
#     platforms: List[ObjectDescription] = Field(..., description="List of platform objects description")
#     collectables: List[ObjectDescription] = Field(..., description="List of collectable objects description")
#     new_events: List[EventDescription]
#     events_when_fail: List[EventDescription]

class Vector3Config(BaseModel):
    x: float = Field(..., description="X coordinate")
    y: float = Field(..., description="Y coordinate")
    z: float = Field(..., description="Z coordinate")


class Color3Config(BaseModel):
    r: float = Field(..., ge=0, le=1, description="Red component (0-1)")
    g: float = Field(..., ge=0, le=1, description="Green component (0-1)")
    b: float = Field(..., ge=0, le=1, description="Blue component (0-1)")


class ControlConfig(RootModel[Dict[str, List[str]]]):
    root: Dict[str, List[str]] = Field(..., description="Control mappings")


class SoundConfig(BaseModel):
    file: str = Field(..., description="Sound file path")
    volume: float = Field(..., ge=0.0, le=1.0, description="Volume (0.0 to 1.0)")
    loop: Optional[bool] = Field(False, description="Loop the sound")


class PlayerConfig(BaseModel):    
    # Physics settings
    gravity: float = Field(..., description="Downward acceleration force (higher = falls faster)")
    jumpPower: float = Field(..., description="Initial upward velocity when jumping (higher = jumps higher)")
    moveSpeed: float = Field(..., description="Horizontal movement speed (higher = moves faster left/right)")
    maxVelocityY: float = Field(..., description="Maximum falling speed (terminal velocity)")
    friction: float = Field(..., ge=0, le=1, description="Horizontal movement friction (0-1, higher = stops faster)")
    
    # Jump animation settings
    jumpAnimationDuration: float = Field(..., description="Duration of jump squish/stretch animation in milliseconds")
    jumpSquishScale: float = Field(..., ge=0, le=1, description="How much to compress horizontally during jump (0-1)")
    jumpStretchScale: float = Field(..., gt=1, description="How much to stretch vertically during jump (>1)")


class WorldConfig(BaseModel):    
    # Lighting settings
    lightDirection: Vector3Config 
    lightColor: Color3Config 
    lightIntensity: float = Field(..., ge=0, le=1, description="Light brightness (0-1)")
    

class PlatformConfig(BaseModel):
    name: str = Field(..., description="Platform name")
    id: str = Field(..., description="Platform ID")
    size: Vector3Config 
    moveRange: Vector3Config
    moveSpeed: float = Field(..., description="Platform movement speed")
    disappearDuration: float = Field(..., description="Platform disappear duration, if 0, then platform will not disappear")
    disappearDelay: float = Field(..., description="Platform disappear delay")
    bouncePowerMultiplier: float = Field(..., description="Bounce power multiplier")
   

class EffectConfig(BaseModel):
    name: str = Field(..., description="Effect name")
    target: str = Field(..., description="Effect target (player, world, etc.)")
    property: str = Field(..., description="The property to change")
    value: float = Field(..., description="The operation on the property")
    duration: float = Field(..., description="Effect duration")


class CollectableConfig(BaseModel):
    name: str = Field(..., description="Collectable name")
    id: str = Field(..., description="Collectable ID")
    size: float = Field(..., description="Collectable size")
    floatAmplitude: float = Field(..., description="Float animation amplitude")
    floatFrequency: float = Field(..., description="Float animation frequency")
    emissiveIntensity: float = Field(..., description="Emissive light intensity")
    effect: List[EffectConfig] = Field(..., description="Effects applied when collected")
    systemMessage: str = Field(..., description="System message that serves as a system prompt")
    chanceToTalk: float = Field(..., ge=0, le=1, description="Chance to trigger dialogue (0-1)")


class ObjectConfig(BaseModel):
    platforms: List[PlatformConfig] = Field(..., description="Platform configurations")
    collectables: List[CollectableConfig] = Field(..., description="Collectable configurations")


class JumpingGameDSLConfig(BaseModel):
    world: WorldConfig
    player: PlayerConfig
    objects: ObjectConfig
