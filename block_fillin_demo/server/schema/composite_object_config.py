from typing import List, Literal, Optional, Union, Any, Dict
from pydantic import BaseModel, Field, ConfigDict

# Reusable "vector3" type that becomes items+minItems+maxItems (supported)
Vec3 = List[float]

class StrictBase(BaseModel):
    # Pydantic v2: forbid extra keys -> additionalProperties: false
    model_config = ConfigDict(extra="forbid")

# ===== WORLD CONFIGURATION SCHEMA =====

class GroundConfig(StrictBase):
    width: Optional[float] = Field(None, description="Ground box width in world units (default: 500)")
    height: Optional[float] = Field(None, description="Ground box height/thickness in world units (default: 5)")
    depth: Optional[float] = Field(None, description="Ground box depth in world units (default: 500)")
    posY: Optional[float] = Field(None, description="Ground vertical center position, negative values lower it (default: -6)")

class FogConfig(StrictBase):
    enabled: bool = Field(..., description="Whether fog effect is active in the scene")
    color: Vec3 = Field(..., min_length=3, max_length=3, description="Fog color as RGB values (0-1 each), e.g., [0.5, 0.5, 0.6] for gray-blue fog")
    start: Optional[float] = Field(None, description="Distance from camera where fog begins (linear mode only, default: 0)")
    end: Optional[float] = Field(None, description="Distance where fog reaches maximum density (linear mode only, default: 800)")
    mode: str = Field(..., description="Fog calculation mode: 'linear', 'exponential', or 'exponential2'")
    density: Optional[float] = Field(None, description="Fog density for exponential modes (0.05=light, 0.3=default, 1.0=heavy)")

class LightConfig(StrictBase):
    intensity: float = Field(..., description="Light brightness level (typical: 0.05-2.0)")
    color: Vec3 = Field(..., min_length=3, max_length=3, description="Light color as RGB values (0-1, can exceed 1 for extra intensity)")
    direction: Vec3 = Field(..., min_length=3, max_length=3, description="Light direction vector [x,y,z]. For HemisphericLight: reflection direction. For DirectionalLight/BottomLight: incoming light direction")

class WorldConfig(StrictBase):
    description: Optional[str] = Field(None, description="World description for the game (e.g., 'snowy winter wonderland forest')")
    ground: Optional[GroundConfig] = Field(None, description="Ground box configuration (dimensions and position)")
    hasGround: bool = Field(..., description="Whether ground is visible (false=invisible but collision still exists)")
    cameraType: Literal['ortho', 'action', 'normal', 'birdeye'] = Field(..., description="Camera perspective: 'ortho'=2D side view, 'action'=close follow, 'normal'=standard 3D, 'birdeye'=top-down")
    cameraFovScale: Optional[float] = Field(None, description="Field of view multiplier (multiplies default FOV)")
    cameraTargetDelta: Optional[Vec3] = Field(None, min_length=3, max_length=3, description="Camera look-at target offset [x,y,z] from default [0,0,0]")
    cameraAlphaDelta: Optional[float] = Field(None, description="Camera horizontal rotation offset in degrees (added to default alpha)")
    cameraBetaDelta: Optional[float] = Field(None, description="Camera vertical rotation offset in degrees (added to default beta)")
    cameraRadiusDelta: Optional[float] = Field(None, description="Camera distance offset in world units (added to default radius, negative=closer)")
    gravityMultiplier: float = Field(..., description="Gravity strength multiplier (1.0=Earth gravity, 1.3=typical, 0.5=floaty, 3.0=heavy)")
    HemisphericLight: LightConfig = Field(..., description="Ambient environment light (intensity: 0.3-1.0, direction is reflection direction)")
    DirectionalLight: LightConfig = Field(..., description="Directional sun-like light with shadows (intensity: 0.1-0.8, direction is incoming light)")
    BottomLight: LightConfig = Field(..., description="Upward fill light for readability (intensity: 0.05-0.25, typically upward direction like [0,1,0])")
    skyboxType: Literal['box', 'sphere'] = Field(..., description="Skybox geometry: 'box'=six-sided cube, 'sphere'=seamless dome")
    particles: Optional[Dict[str, Any]] = Field(None, description="Particle system configuration with maxStars, size, colors, movement pattern (scroll/float/oscillate/drift), speed, blinking, and optional texture")
    fog: Optional[FogConfig] = Field(None, description="Atmospheric fog effect configuration")

# ===== COMPOSITE OBJECT SCHEMA =====

class MaterialData(StrictBase):
    albedoColor: Vec3 = Field(..., description="RGB color values (0-1)", min_length=3, max_length=3)
    metallic: float = Field(..., description="Metallic property (0-1)", ge=0.0, le=1.0)
    roughness: float = Field(..., description="Roughness property (0-1)", ge=0.0, le=1.0)
    alpha: Optional[float] = Field(None, description="Transparency/opacity (0.0=transparent, 1.0=opaque)", ge=0.0, le=1.0)

class TransformData(StrictBase):
    position: Vec3 = Field(..., description="Position [x, y, z]", min_length=3, max_length=3)
    rotation: Vec3 = Field(..., description="Rotation [x, y, z] in radians", min_length=3, max_length=3)
    scale: Optional[Vec3] = Field(None, description="Scale [x, y, z]", min_length=3, max_length=3)

class SoftboxOptions(StrictBase):
    # Keep these optional, but don't assign weird defaults; None is fine,
    # and "optional" is handled by not requiring the field.
    size: Optional[float] = Field(None, description="Uniform size for all dimensions")
    width: Optional[float] = Field(None, description="Width (X dimension)")
    height: Optional[float] = Field(None, description="Height (Y dimension)")
    depth: Optional[float] = Field(None, description="Depth (Z dimension)")

    heightTop: Optional[float] = None
    widthLeft: Optional[float] = None
    depthBack: Optional[float] = None
    heightBottom: Optional[float] = None
    widthRight: Optional[float] = None
    depthFront: Optional[float] = None

    arcSegments: Optional[int] = Field(None, description="Number of segments for rounded corners")
    radius: Optional[float] = Field(None, description="Uniform corner radius")
    radiusX: Optional[float] = None
    radiusY: Optional[float] = None
    radiusZ: Optional[float] = None
    radiusXPos: Optional[float] = None
    radiusYPos: Optional[float] = None
    radiusZPos: Optional[float] = None
    radiusXNeg: Optional[float] = None
    radiusYNeg: Optional[float] = None
    radiusZNeg: Optional[float] = None

    stretch: Optional[bool] = None
    stretchX: Optional[bool] = None
    stretchY: Optional[bool] = None
    stretchZ: Optional[bool] = None

class CylinderOptions(StrictBase):
    height: float = Field(..., description="Height of the cylinder")
    diameter: Optional[float] = Field(None, description="Uniform diameter (overrides diameterTop/Bottom if provided)")
    diameterTop: Optional[float] = Field(None, description="Diameter at the top")
    diameterBottom: Optional[float] = Field(None, description="Diameter at the bottom")
    tessellation: Optional[int] = Field(None, description="Number of radial segments")

class SphereOptions(StrictBase):
    diameter: float = Field(..., description="Diameter of the sphere")
    segments: Optional[int] = Field(None, description="Number of segments")

class BoxOptions(StrictBase):
    size: Optional[float] = Field(None, description="Uniform size for all dimensions")
    width: Optional[float] = Field(None, description="Width (X dimension)")
    height: Optional[float] = Field(None, description="Height (Y dimension)")
    depth: Optional[float] = Field(None, description="Depth (Z dimension)")

# IMPORTANT: Put the variant-specific options field FIRST
# to avoid anyOf variants sharing the same first key (a common validator issue).
class SoftboxPart(StrictBase):
    softboxOptions: SoftboxOptions
    type: Literal["softbox"]
    name: str = Field(..., description="Name/identifier for this part")
    material: MaterialData
    transform: TransformData

class CylinderPart(StrictBase):
    cylinderOptions: CylinderOptions
    type: Literal["cylinder"]
    name: str = Field(..., description="Name/identifier for this part")
    material: MaterialData
    transform: TransformData

class SpherePart(StrictBase):
    sphereOptions: SphereOptions
    type: Literal["sphere"]
    name: str = Field(..., description="Name/identifier for this part")
    material: MaterialData
    transform: TransformData

class BoxPart(StrictBase):
    boxOptions: BoxOptions
    type: Literal["box"]
    name: str = Field(..., description="Name/identifier for this part")
    material: MaterialData
    transform: TransformData

Part = Union[SoftboxPart, CylinderPart, SpherePart, BoxPart]

class CompositeObject(StrictBase):
    name: str = Field(..., description="Name of the composite object")
    description: Optional[str] = Field(None, description="Description of the object")
    parts: List[Part] = Field(..., description="List of parts that make up this object")
    overallTransform: Optional[TransformData] = Field(
        None, description="Optional transform applied to the entire object"
    )

class IntentClassification(StrictBase):
    intent: Literal["chat", "generate_asset", "change_configuration"] = Field(..., description="The classified intent")

class WorldConfigChangeResponse(StrictBase):
    worldConfig: WorldConfig = Field(..., description="The complete modified world configuration")
    summary: str = Field(..., description="Brief summary of what was changed (2-3 sentences explaining the modifications made)")

# ===== PLAYER CONFIGURATION SCHEMA =====

class BulletsConfig(StrictBase):
    speed: float = Field(..., description="Projectile velocity in world units per frame (1-10 typical)")
    maxCount: int = Field(..., description="Maximum number of simultaneous projectiles")
    cooldown: float = Field(..., description="Minimum milliseconds between shots")
    shape: Dict[str, float] = Field(..., description="Projectile dimensions {width, height, depth} in world units")
    maxDistance: float = Field(..., description="Maximum travel distance before auto-destroy")
    color: Dict[str, float] = Field(..., description="RGB color {r, g, b} with values 0-1")
    opacity: float = Field(..., description="Transparency 0.0 (invisible) to 1.0 (opaque)", ge=0.0, le=1.0)
    direction: Optional[Literal['up', 'down', 'left', 'right', 'inside']] = Field(None, description="Bullet direction (not fully implemented)")

class PlayerConfig(StrictBase):
    description: Optional[str] = Field(None, description="Player description for the game (e.g., 'green plush dinosaur yellow belly')")
    size: float = Field(..., description="Player visual size and collision dimensions in world units (typically 5)")
    jumpPower: float = Field(..., description="Initial upward velocity for jumping (30=low, 50=moderate, 70=high)")
    moveSpeed: float = Field(..., description="Horizontal movement speed (25=slow, 50=moderate, 100=fast)")
    friction: float = Field(..., description="Horizontal deceleration (3=slippery, 7=quick stop, 15=instant)")
    mass: float = Field(..., description="Player mass for physics (1=light, 10=medium, 20=heavy)")
    restitution: float = Field(..., description="Bounciness on collision (0=no bounce, 1=perfect bounce)", ge=0.0, le=1.0)
    jumpAnimationDuration: float = Field(..., description="Jump animation cycle duration in milliseconds (300-800 typical)")
    jumpSquishScale: float = Field(..., description="Horizontal compression during jump (0.85-0.95 typical)", ge=0.0, le=1.0)
    jumpStretchScale: float = Field(..., description="Vertical stretch during jump (1.02-1.2 typical)", ge=1.0)
    jumpOnlyOnGround: bool = Field(..., description="Whether jumping restricted to ground contact")
    maxJumpCount: Optional[int] = Field(None, description="Max air jumps allowed (2=double jump, None=unlimited if jumpOnlyOnGround=false)")
    jumpInterval: Optional[float] = Field(None, description="Milliseconds between consecutive jumps (default: 200)")
    bullets: Optional[BulletsConfig] = Field(None, description="Projectile configuration if player can shoot")
    startPosition: Dict[str, float] = Field(..., description="Initial spawn position {x, y, z} in world coordinates")
    initialRotation: Optional[Vec3] = Field(None, min_length=3, max_length=3, description="Initial rotation [x, y, z] in radians")

class PlayerConfigChangeResponse(StrictBase):
    playerConfig: PlayerConfig = Field(..., description="The complete modified player configuration")
    summary: str = Field(..., description="Brief summary of what was changed (2-3 sentences explaining the modifications made)")

# ===== OBJECT CONFIGURATION SCHEMA =====

class ObjectCollisionConfig(StrictBase):
    """Configuration for player-object collision. ONLY contains 'player' and 'object' fields."""
    player: Optional[Literal['jump', 'die', 'score', 'none']] = Field(None, description="Effect on the player: 'jump' (bounce with double jumpPower), 'die' (lose life), 'score' (gain points), 'none' (no effect)")
    object: Optional[Literal['dispose', 'none']] = Field(None, description="Effect on the object: 'dispose' (disappear), 'none' (stay)")

class ObjectProjectileCollisionConfig(StrictBase):
    """Configuration for projectile-object collision. ONLY contains 'projectile' and 'object' fields. Do NOT include 'player' field."""
    projectile: Literal['dispose'] = Field(..., description="Effect on the projectile - always 'dispose' in current version")
    object: Literal['dispose', 'score', 'none'] = Field(..., description="Effect on the object: 'dispose' (destroyed), 'score' (award points then dispose), 'none' (unaffected)")

class ObjectSpeedConfig(StrictBase):
    x: float = Field(..., description="Initial velocity in x direction (world units)")
    y: float = Field(..., description="Initial velocity in y direction (world units, negative = falling)")
    z: float = Field(..., description="Initial velocity in z direction (world units)")

class ObjectSizeConfig(StrictBase):
    x: float = Field(..., description="Width of the object (applied as scale to model)")
    y: float = Field(..., description="Height of the object (applied as scale to model)")
    z: float = Field(..., description="Depth of the object (applied as scale to model)")

class ObjectRotationConfig(StrictBase):
    x: float = Field(..., description="Rotation around x-axis in radians")
    y: float = Field(..., description="Rotation around y-axis in radians")
    z: float = Field(..., description="Rotation around z-axis in radians")

class GameObjectConfig(StrictBase):
    name: str = Field(..., description="Display name of the object (can be changed by user)")
    id: str = Field(..., description="Unique identifier for the object (must NOT be changed - used for spawning and asset references)")
    size: ObjectSizeConfig = Field(..., description="3D dimensions of the object (applied as scale)")
    onPlayerCollision: ObjectCollisionConfig = Field(..., description="Player-object collision behavior with structure {player: string, object: string}. Do NOT include 'projectile' field here!")
    onProjectileCollision: Optional[ObjectProjectileCollisionConfig] = Field(None, description="Projectile-object collision behavior with structure {projectile: string, object: string}. Do NOT include 'player' field here!")
    onGroundCollision: Literal['none', 'disappearing', 'dispose'] = Field(..., description="Behavior when object hits the ground: 'none' (stays), 'disappearing' (despawn after 1200ms), 'dispose' (immediate removal)")
    initialSpeed: ObjectSpeedConfig = Field(..., description="Initial velocity vector of the object (only applies to motionType 1 or 2)")
    motionType: Literal[0, 1, 2] = Field(..., description="Physics motion type: 0=STATIC (unmoving), 1=DYNAMIC (fully simulated), 2=ANIMATED (pushes others but unaffected by them)")
    score: Optional[int] = Field(None, description="Points awarded to player (can be positive or negative). Applied when onPlayerCollision.player='score' or 'jump', or onProjectileCollision.object='score'")
    initialRotation: Optional[ObjectRotationConfig] = Field(None, description="Optional starting rotation in radians")

class ObjectConfigChangeResponse(StrictBase):
    objectConfig: GameObjectConfig = Field(..., description="The complete modified object configuration")
    summary: str = Field(..., description="Brief summary of what was changed (2-3 sentences explaining the modifications made)")

# ===== SPAWN CONFIGURATION SCHEMA =====

class SpawnScheduleConfig(StrictBase):
    schedule: List[int] = Field(..., description="Sequence of timestamps in milliseconds when objects spawn")
    recurrent: bool = Field(..., description="If true, sequence repeats when it ends; if false, it's a one-time sequence")
    parseFrom: Optional[str] = Field(None, description="Optional path to file to parse schedule from (e.g., audio file for beat-matching) - not yet implemented")

class SpawnOffsetConfig(StrictBase):
    x: float = Field(..., description="X offset in world units")
    y: float = Field(..., description="Y offset in world units")
    z: float = Field(..., description="Z offset in world units")

class SpawnConfig(StrictBase):
    spawnTrigger: Literal['timer', 'scheduled', 'once'] = Field(..., description="Spawn trigger type: 'timer' (regular intervals), 'scheduled' (specific timestamps), 'once' (single spawn)")
    spawnTriggerTime: Optional[int] = Field(None, description="Milliseconds - interval for 'timer', spawn time for 'once'")
    spawnTriggerSchedule: Optional[SpawnScheduleConfig] = Field(None, description="Schedule config for 'scheduled' trigger type")
    spawnLikelihood: Dict[str, float] = Field(..., description="Object spawn probabilities by object ID {objectId: 0-1}. Controls which objects this spawner manages and their spawn chance")
    spawnXrange: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] X spawn position range in world units")
    spawnYrange: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] Y spawn position range in world units")
    spawnZrange: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] Z spawn position range in world units")
    spawnOffset: Optional[Dict[str, SpawnOffsetConfig]] = Field(None, description="Optional per-object position offsets {objectId: {x,y,z}} for maintaining spatial relationships")
    scaleRangeX: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] X scale multiplier range for spawned objects")
    scaleRangeY: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] Y scale multiplier range for spawned objects")
    scaleRangeZ: List[float] = Field(..., min_length=2, max_length=2, description="[min, max] Z scale multiplier range for spawned objects")

class SpawnConfigChangeResponse(StrictBase):
    spawnConfigs: List[SpawnConfig] = Field(..., description="The complete list of spawn configurations (all spawn controllers)")
    summary: str = Field(..., description="Brief summary of what was changed in the spawn configurations (1-2 sentences)")

# ===== COHESIVE THEME SCHEMA =====

class BlockChangeSuggestionResponse(BaseModel):
    # Allow extra fields for dynamic object keys (box1, box2, tubeTop, tubeBottom, etc.)
    model_config = ConfigDict(extra="allow")
    
    player: str = Field(..., description="ONE specific player description (2-5 words, e.g., 'red cape superhero', 'medieval knight with sword')")
    world: str = Field(..., description="ONE specific world description (2-5 words, e.g., 'starry night sky', 'ancient stone castle')")
    narrative: str = Field(..., description="A single narrative sentence describing the complete game theme")
    transition: Optional[str] = Field(None, description="An engaging transition sentence describing the event that transforms the game from old to new theme (e.g., 'A portal opened and transported you to a magical realm!', 'The snow melted away revealing a hidden garden!')")
    
    # Dynamic object fields will be added based on the mechanism configuration
    # For example: box1, box2 for dodge_and_catch; tubeTop, tubeBottom for flappy_bird, etc.
