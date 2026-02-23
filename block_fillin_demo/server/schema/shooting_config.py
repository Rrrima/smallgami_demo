from pydantic import BaseModel, Field
from typing import Dict, List, Literal, Optional, Union
from .asset_config import AssetConfig


class MovementMomentumConfig(BaseModel):
    acceleration: float = Field(..., description="Movement acceleration")
    friction: float = Field(..., description="Movement friction")
    maxVelocity: float = Field(..., description="Maximum velocity")


class MovementConfig(BaseModel):
    speed: float = Field(..., description="Movement speed")
    momentum: MovementMomentumConfig
    smoothing: float = Field(..., ge=0, le=1, description="Movement smoothing (0-1)")


class BulletShapeConfig(BaseModel):
    width: float = Field(..., description="Bullet width")
    height: float = Field(..., description="Bullet height")
    depth: float = Field(..., description="Bullet depth")


class ColorConfig(BaseModel):
    r: float = Field(..., ge=0, le=1, description="Red component (0-1)")
    g: float = Field(..., ge=0, le=1, description="Green component (0-1)")
    b: float = Field(..., ge=0, le=1, description="Blue component (0-1)")


class BulletsConfig(BaseModel):
    speed: float = Field(..., description="Bullet speed")
    maxCount: int = Field(..., description="Maximum bullet count")
    cooldown: float = Field(..., description="Minimum time between shots (ms)")
    shape: BulletShapeConfig
    maxDistance: float = Field(..., description="Y position where bullets disappear")
    color: ColorConfig
    opacity: float = Field(..., ge=0, le=1, description="Bullet opacity")


class PhysicsConfig(BaseModel):
    mass: float = Field(..., description="Physics mass")
    restitution: float = Field(..., ge=0, le=1, description="Bounciness (0-1)")
    damping: float = Field(..., description="Air resistance")


class VisualConfig(BaseModel):
    scale: float = Field(..., description="Visual scale")
    rotationEffect: float = Field(..., description="Rotation effect when moving")
    bobbing: bool = Field(..., description="Enable bobbing animation")
    material: Literal['none', 'standard', 'cell'] = Field(..., description="Material type")
    color: ColorConfig
    glow: ColorConfig


class PlayerConfig(BaseModel):
    movement: MovementConfig
    bullets: BulletsConfig
    physics: PhysicsConfig
    visual: VisualConfig


class DialogueConfig(BaseModel):
    messages: List[str] = Field(..., description="Possible dialogue messages")
    likelyHood: float = Field(..., ge=0, le=1, description="Dialogue likelihood (0-1)")


class CollisionBehaviorConfig(BaseModel):
    onBulletHit: Literal['destroy', 'reduceOpacity', 'pokemonInteraction'] = Field(..., description="Collision behavior")
    dialogue: Optional[DialogueConfig] = None


class MovementPatternConfig(BaseModel):
    pattern: Literal['formation', 'freeSwim', 'oscillate', 'swarm'] = Field(..., description="Movement pattern type")


class IdleAnimationConfig(BaseModel):
    enabled: bool = Field(..., description="Enable idle animation")
    type: Literal['bob', 'pulse', 'rotate', 'undulate'] = Field(..., description="Animation type")
    speed: float = Field(..., description="Animation speed")
    intensity: float = Field(..., description="Animation intensity")


class AnimationConfig(BaseModel):
    idleAnimation: IdleAnimationConfig


class ScaleVariationConfig(BaseModel):
    enabled: bool = Field(..., description="Enable scale variation")
    range: float = Field(..., description="Random scale variation range (e.g., 0.2 = ±20%)")
    type: Literal['uniform', 'perRow', 'individual'] = Field(..., description="How variation is applied")


class ScaleAnimationConfig(BaseModel):
    enabled: bool = Field(..., description="Enable scale animation")
    type: Literal['pulse', 'breathe', 'wobble'] = Field(..., description="Animation type")
    speed: float = Field(..., description="Animation speed multiplier")
    intensity: float = Field(..., ge=0, le=1, description="Scale change intensity (0-1)")


class ScaleConfig(BaseModel):
    base: float = Field(..., description="Base scale")
    reduction: float = Field(..., description="Scale reduction per row")
    variation: Optional[ScaleVariationConfig] = None
    animation: Optional[ScaleAnimationConfig] = None


class AlienTypeConfig(BaseModel):
    lives: int = Field(..., description="Number of lives")
    scoreValue: int = Field(..., description="Score value when destroyed")
    scale: ScaleConfig
    movementModifier: Optional[float] = Field(1.0, description="Speed multiplier for this type")


class AlienConfig(BaseModel):
    collisionBehavior: CollisionBehaviorConfig
    movement: MovementPatternConfig
    animation: AnimationConfig
    types: Dict[str, AlienTypeConfig]


class StarfieldPositioningConfig(BaseModel):
    minY: float = Field(..., description="Minimum Y position")
    maxY: float = Field(..., description="Maximum Y position")
    z: float = Field(..., description="Z position")


class StarfieldSizeConfig(BaseModel):
    min: float = Field(..., description="Minimum size")
    max: float = Field(..., description="Maximum size")


class OscillationConfig(BaseModel):
    amplitude: float = Field(..., description="Oscillation amplitude")
    frequency: float = Field(..., description="Oscillation frequency")


class DriftConfig(BaseModel):
    horizontalVariation: float = Field(..., description="Random horizontal movement")
    verticalVariation: float = Field(..., description="Random vertical movement")


class StarfieldMovementConfig(BaseModel):
    pattern: Literal['scroll', 'float', 'oscillate', 'drift'] = Field(..., description="Movement pattern")
    direction: Literal['up', 'down', 'left', 'right'] = Field(..., description="Movement direction")
    speed: float = Field(..., description="Movement speed")
    oscillation: Optional[OscillationConfig] = None
    drift: Optional[DriftConfig] = None


class StarfieldBlinkingConfig(BaseModel):
    minInterval: float = Field(..., description="Minimum blink interval")
    maxInterval: float = Field(..., description="Maximum blink interval")


class StarfieldTextureConfig(BaseModel):
    path: str = Field(..., description="Texture path")
    dimensions: Dict[str, float] = Field(..., description="Texture dimensions")


class StarfieldThemeConfig(BaseModel):
    particleType: Literal['stars', 'bubbles', 'fairies', 'particles'] = Field(..., description="Particle type")
    name: str = Field(..., description="Theme name")


class StarfieldConfig(BaseModel):
    maxStars: int = Field(..., description="Maximum number of stars")
    ratioOfBlinkers: float = Field(..., ge=0, le=1, description="Ratio of blinking stars")
    positioning: StarfieldPositioningConfig
    size: StarfieldSizeConfig
    colors: List[List[float]] = Field(..., description="Star colors")
    movement: StarfieldMovementConfig
    blinking: StarfieldBlinkingConfig
    texture: StarfieldTextureConfig
    theme: StarfieldThemeConfig


class SkyboxConfig(BaseModel):
    texture: str = Field(..., description="Path to skybox texture")


class BackgroundConfig(BaseModel):
    type: Literal['clearColor', 'skybox', 'skybox-flat'] = Field(..., description="Background type")
    clearColor: Optional[List[float]] = Field(None, description="RGBA clear color")
    skybox: Optional[SkyboxConfig] = None


class FogConfig(BaseModel):
    enabled: bool = Field(..., description="Enable fog")
    color: List[float] = Field(..., description="RGB fog color")
    start: float = Field(..., description="Fog start distance")
    end: float = Field(..., description="Fog end distance")
    mode: str = Field(..., description="Fog mode (linear, exponential, exponential2)")


class LightingConfig(BaseModel):
    intensity: float = Field(..., description="Light intensity")
    direction: List[float] = Field(..., description="Light direction")
    position: List[float] = Field(..., description="Light position")
    diffuse: List[float] = Field(..., description="RGB diffuse color")
    specular: List[float] = Field(..., description="RGB specular color")


class AtmosphereConfig(BaseModel):
    background: BackgroundConfig
    fog: FogConfig
    lighting: LightingConfig


class ShootingGameDSLConfig(BaseModel):
    id: str = Field(..., description="Game ID")
    name: str = Field(..., description="Game name")
    camera: Literal['action', 'follow', 'fixed'] = Field(..., description="Camera type")
    assets: AssetConfig
    player: PlayerConfig
    aliens: AlienConfig
    starfield: StarfieldConfig
    atmosphere: AtmosphereConfig
