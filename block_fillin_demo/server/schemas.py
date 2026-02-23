from pydantic import BaseModel, ConfigDict, Field, model_validator
from typing import List, Dict, Any, Literal, Optional, Union

##############################
##### schema for request #####
##############################
class PromptRequest(BaseModel):
    prompt: str
    game_id: Optional[str] = None

# initial prompt response
class PromptResponse(BaseModel):
    message: str
    dsl_response: str
    setting_config: str
    layout_config: str

# Dialogue interaction schemas
class DialogueInteractionRequest(BaseModel):
    user_input: str
    object_name: str
    game_id: Optional[str] = None

class DialogueInteractionResponse(BaseModel):
    message: str
    game_setting_config: str
    game_layout_config: str
    dsl_data: str

# Factory state schemas
class AssetRef(BaseModel):
    id: str
    content: str
    type: Literal['text', 'file', 'genre']
    reference: str
    fileUrl: Optional[str] = None
    file: Optional[str] = None  # File data as base64 or file path

class FactoryStateRequest(BaseModel):
    mechanism: List[AssetRef] = []
    player: List[AssetRef] = []
    world: List[AssetRef] = []
    style: List[AssetRef] = []
    narrative: List[AssetRef] = []
    context: List[AssetRef] = []

class FactoryStateResponse(BaseModel):
    message: str
    success: bool


##############################
####### schema for DSL #######
##############################
class Vector3Config(BaseModel):
    x: float = Field(description="X coordinate in 3D space")
    y: float = Field(description="Y coordinate in 3D space")
    z: float = Field(description="Z coordinate in 3D space")
    model_config = ConfigDict(extra="forbid")


class PlayerControlsConfig(BaseModel):
    action: Literal['jump', 'move', 'interact'] = Field(description="The type of action the player can perform")
    inputModality: Literal['keyboard', 'voice', 'mouse'] = Field(description="The input method for controlling the action")
    
    model_config = ConfigDict(extra="forbid")



class InteractionConfig(BaseModel):
    player: str = Field(description="Description of whether the player will have some status change when the interaction happens")
    object: str = Field(description="Description of whether the object will have some status change when the interaction happens")
    effect: str = Field(description="Description of the effect or callback function when interaction occurs")
    
    model_config = ConfigDict(extra="forbid")


class ObjectConfig(BaseModel):
    name: str = Field(description="The unique name identifier for the object")
    type: Literal['platform', 'obstacle', 'collectable', 'enemy', 'npc'] = Field(description="The category/type of object in the game world")
    render: str = Field(description="Detailed description of the object's shape, appearance, material, and visual properties for rendering")
    interaction: str = Field(descriptioN="Describe what will happen when the user and the object interact")
    number: int = Field(description="Describe how many of the same category of object needed")
    model_config = ConfigDict(extra="forbid")


class PTObjectConfig(BaseModel):
    name: str = Field(description="The unique name identifier for the object")
    type: Literal['platform', 'obstacle', 'collectable', 'enemy', 'npc'] = Field(description="The category/type of object in the game world")
    render: str = Field(description="Detailed description of the object's shape, appearance, material, and visual properties for rendering")
    interaction: str = Field(descriptioN="Describe what will happen when the user and the object interact")
    number: int = Field(description="Describe how many of the same category of object needed")
    model_config = ConfigDict(extra="forbid")

class MetadataConfig(BaseModel):
    opacity: float = Field(description="The opacity of the object")
    scale: float = Field(description="The scale of the object, range from 0.1 to 2")
    color: str = Field(description="The color of the object, in hex format")
    rotation: Vector3Config 
    model_config = ConfigDict(extra="forbid")


class SIObjectConfig(BaseModel):
    name: str = Field(description="The unique name identifier for the object")
    behavior: str = Field(description="Describe the behavior of the object, how the object will behave when NO interaction happen")
    metadata: MetadataConfig
    interactionType: Literal['emlimination', 'changeProperty', 'dialogue'] = Field(description="The type of interaction when the player's emission collides with the object, if choose change property, the property needs to be one of the opacity, scale, color, rotation")
    interactionDescription: str = Field(description="Describe the interaction when the player's emission collides with the object, if choose change property, the property needs to be one of the opacity, scale, color, rotation")
    model_config = ConfigDict(extra="forbid")

class SceneConfig(BaseModel):
    type: Literal['clearcolor', 'image'] = Field(description="Type of scene background - either a solid color or an image")
    src: str = Field(description="Source for the scene background - either a hex color code or a prompt to generate background image")
    model_config = ConfigDict(extra="forbid")


class WorldConfig(BaseModel):
    physics: str = Field(description="Description of the physics system and rules governing the game world")
    visualStyle: str = Field(description="Description of the visual style that guides the generation of colors and visual elements, using keywords")
    visualType: Literal['cartoon', 'lowpoly', 'pixel', 'claymation'] = Field(description="Based on the visual style, what would be the best type of rendering to illustrate the visual style.")
    worldDescripiton: str = Field(description="Description of the world, this should lead to a background image for the skybox of the world")
    # scene: SceneConfig
    
    model_config = ConfigDict(extra="forbid")


class PlayerConfig(BaseModel):
    # pov: Literal['first-person', 'third-person', 'top-down'] = Field(description="Point of view for the player, used to generate camera parameters")
    render: str = Field(description="Detailed description of the player's shape, appearance, material, and visual properties for rendering, that can be used as a prompt to generate the player model")
    controls: List[PlayerControlsConfig] = Field(description="List of control schemes available to the player, used to generate control parameters")
    
    model_config = ConfigDict(extra="forbid")


class EmissionConfig(BaseModel):
    render: str = Field(description="Detailed description of what is the emission, appearance, material, and visual properties for rendering, that can be used as a prompt to generate the emission model")
    model_config = ConfigDict(extra="forbid")
    
class SIPlayerConfig(BaseModel):
    render: str = Field(description="Detailed description of the player's shape, appearance, material, and visual properties for rendering, that can be used as a prompt to generate the player model")
    controls: List[PlayerControlsConfig] = Field(description="List of control schemes available to the player, used to generate control parameters")
    emissions: EmissionConfig
    model_config = ConfigDict(extra="forbid")

class StoryMapping(BaseModel):
    story_fragment: str = Field(description="A fragment of the story (i.e., part of the input sentence) that is mapped to the game world, this should be very specific think about the story as a sentence completion task, what are the worlds/phrases that directly mapped to the mechanism?")
    game_element: List[str] = Field(description="The game element that is mapped to the story fragment, it can be more than one element")

class StoryChange(BaseModel):
    Operation: Literal['next', 'modify'] = Field(description="The operation to be performed on the existing story")
    change: str = Field(description="The change to be performed on the existing story, describe it in the tone of you are talking to the user, make it engaging and concise. It should not be longer than 7 words!")

class GameDSL(BaseModel):
    goal: str = Field(description="The goal of the game, it should be a short description of the goal of the game")
    world: WorldConfig
    player: PlayerConfig
    objects: List[ObjectConfig] = Field(description="List of interactive objects in the game world with their properties and behaviors")
    storyMappings: List[StoryMapping] = Field(description="List of story fragments mapped to game elements, it can be a many to many mapping")
    possibleNext: List[StoryChange] = Field(description="a list of change of the story that can happen next, construct it with an operation and the change, ")
    
    model_config = ConfigDict(extra="forbid")


###############################
###### schema for Params ######
###############################

class MyColor(BaseModel):
    value: Literal['#CDC3C5',"#E0D8D8","#9898A8","#A7C46E","#51B07A","#154D39", "#C9415A", "#8B7464", "#DEBE7B", "#E2B835","#C27F2A","#84C2C7","#60ABC6","#18668E"]


class MaterialParams(BaseModel):
    color: MyColor
    shape: List[Literal[ 'sphere', 'cylinder','capsule', 'box']] = Field(description="The basic shape of the material, consider what object is, give the most reasonable basic shape. e ")


class GroundParams(BaseModel):
    material: MaterialParams
 

class WorldParams(BaseModel):
    gravity: Vector3Config
    ground: GroundParams
    skybox: MyColor 

class PhysicsParams(BaseModel):
    mass: float
    restitution: float
    friction: float

class PlayerParams(BaseModel):
    shape: str = Field(description="The shape of the player, it should be a prompt to generate the player model")
    color: MyColor
    position: Vector3Config 
    status: List[str] = Field(description="The status of the player, it should be a list of status that the player can have")

class ObjectParams(BaseModel):
    position: List[Vector3Config] = Field(description="The position of the object, it should be a list of positions that the object can be placed at. Make sure the length of the list should match the number of the objects specified")
    type: Literal['platform',  'collectable',  'npc', 'enemy'] = Field(description="The type of the object, it should be a type of the object")
    size: List[Vector3Config] = Field(description="The size of the object, it should be a list of sizes that the object can be placed at. Make sure the length of the list should match the length of the position list")
    material: MaterialParams
    physics: PhysicsParams

    @model_validator(mode='before')
    def check_patrol_fields(cls, values):
        obj_type = values.get('type')
        if obj_type == 'npc':
            if values.get('patrolWaypoints') is None:
                raise ValueError('patrolWaypoints is required for npc type')
            if values.get('patrolSpeed') is None:
                raise ValueError('patrolSpeed is required for npc type')
            if values.get('patrolPauseTime') is None:
                raise ValueError('patrolPauseTime is required for npc type')
        return values

class SettingConfig(BaseModel):
    world: WorldParams
    player: PlayerParams
    objects: List[ObjectParams] 

###############################
#### New Separated Schemas ####
###############################

class GameSettingObjectParams(BaseModel):
    """Object parameters without size and position information"""
    name: str = Field(description="The unique name identifier for the object")
    type: Literal['platform', 'collectable', 'npc', 'enemy'] = Field(description="The type of the object")
    material: MaterialParams
    physics: PhysicsParams

class UIParams(BaseModel):
    instructions: str = Field(description="Based on the goal and the settings of the game, give a short instructions to the user as if you are talking to the user and introducing them to the game world, make it engaging and concise.")
    variables: List[str] = Field(description="List of variables that track the users status. It should be cohesive with the game setting and the goal of the game")

class GameSettingConfig(BaseModel):
    """Game settings configuration without object layout information"""
    world: WorldParams
    player: PlayerParams
    objects: List[GameSettingObjectParams]
    ui: UIParams

class GameLayoutObjectParams(BaseModel):
    """Object layout parameters with size and position information"""
    name: str = Field(description="The unique name identifier for the object matching the GameSettingConfig")
    position: List[Vector3Config] = Field(description="The position of the object instances, considering the 100x100 ground size and realistic spacing")
    size: List[Vector3Config] = Field(description="The size of the object instances, should match gaming experience and real-world proportions")
    
    @model_validator(mode='before')
    def validate_position_size_match(cls, values):
        positions = values.get('position', [])
        sizes = values.get('size', [])
        if len(positions) != len(sizes):
            raise ValueError('Number of positions must match number of sizes')
        return values

class GameLayoutConfig(BaseModel):
    """Game layout configuration with object positions and sizes"""
    objects: List[GameLayoutObjectParams] = Field(description="Layout information for all objects, ensuring proper spacing and realistic proportions on the 100x100 ground") 



###############################
##### Interaction Config ######
###############################
class KeyboardBindingConfig(BaseModel):
    type: Literal['keyboard'] = Field(description="Keyboard input device")
    inputbind: str = Field(description="The keycode for keyboard input (e.g., 'W', 'A', 'S', 'D', 'Space', 'Enter')")
    
    model_config = ConfigDict(extra="forbid")

class MouseBindingConfig(BaseModel):
    type: Literal['mouse'] = Field(description="Mouse input device")
    inputbind: Literal['continuous', 'trigger'] = Field(description="Mouse input mode - 'continuous' for held actions or 'trigger' for single clicks")
    
    model_config = ConfigDict(extra="forbid")

class VoiceBindingConfig(BaseModel):
    type: Literal['voice'] = Field(description="Voice input device")
    inputbind: str = Field(description="The word or phrase that triggers the action when spoken")
    
    model_config = ConfigDict(extra="forbid")

class DisabledBindingConfig(BaseModel):
    type: Literal['disabled'] = Field(description="Disabled input - this action cannot be performed")
    inputbind: None = Field(description="No input binding for disabled actions")
    
    model_config = ConfigDict(extra="forbid")

# Union type for different binding configurations
BindingConfig = Union[KeyboardBindingConfig, MouseBindingConfig, VoiceBindingConfig, DisabledBindingConfig]

class PlayerControllerConfig(BaseModel):
    move_up:BindingConfig
    move_down: BindingConfig
    move_left: BindingConfig
    move_right: BindingConfig
    jump: BindingConfig
    interact: BindingConfig 

class ControlConfig(BaseModel):
    player: PlayerControlsConfig

###############################
### Narrative Analysis Schema ##
###############################

class NarrativeAnalysisRequest(BaseModel):
    prompt: str = Field(description="User's prompt for the new narrative direction")
    existing_narrative: List[str] = Field(description="Existing narrative content from the blocks")

class NarrativeAnalysisResponse(BaseModel):
    narrative_text: str = Field(description="Generated narrative block that maintains space invader mechanism")
    mechanism_sentence: str = Field(description="Type of game mechanism (e.g., 'space-invaders', 'shoot-em-up')")
    name: str = Field(description="Explanation of how the narrative maintains the game mechanism")
    game_id: str = Field(description="Explanation of how the narrative maintains the game mechanism")
    
    model_config = ConfigDict(extra="forbid")


###############################
#### Game2 DSL Schema ########
###############################

class Game2DSL(BaseModel):
    world: WorldConfig
    player: SIPlayerConfig
    objects: List[SIObjectConfig] = Field(
        description="List of interactive objects in the game world with their properties and behaviors",
        max_length=3
    )
    possibleNext: List[StoryChange] = Field(description="a list of change of the story that can happen next, construct it with an operation and the change, ")
    model_config = ConfigDict(extra="forbid")

###############################
### Low-Level Game DSL Config ##
###############################

class ColorConfig(BaseModel):
    r: float = Field(description="Red component (0-1)")
    g: float = Field(description="Green component (0-1)")
    b: float = Field(description="Blue component (0-1)")
    model_config = ConfigDict(extra="forbid")

class AssetModelConfig(BaseModel):
    player: str = Field(description="Player model filename")
    aliens: List[str] = Field(description="List of alien model filenames")
    mothership: str = Field(description="Mothership model filename")
    model_config = ConfigDict(extra="forbid")

class AssetSoundConfig(BaseModel):
    ambient: str = Field(description="Ambient sound path")
    lazer: str = Field(description="Laser sound path")
    alienMove: str = Field(description="Alien movement sound path")
    alienExplosion: str = Field(description="Alien explosion sound path")
    model_config = ConfigDict(extra="forbid")

class RotationConfig(BaseModel):
    x: Optional[float] = Field(default=0, description="X-axis rotation in radians")
    y: Optional[float] = Field(default=0, description="Y-axis rotation in radians")
    z: Optional[float] = Field(default=0, description="Z-axis rotation in radians")
    model_config = ConfigDict(extra="forbid")

class AssetRotationConfig(BaseModel):
    player: Optional[RotationConfig] = None
    aliens: Optional[RotationConfig] = None
    mothership: Optional[RotationConfig] = None
    model_config = ConfigDict(extra="forbid")

class GameAssetConfig(BaseModel):
    models: AssetModelConfig
    sounds: AssetSoundConfig
    rotation: Optional[AssetRotationConfig] = None
    model_config = ConfigDict(extra="forbid")

class MovementMomentumConfig(BaseModel):
    acceleration: float = Field(description="Movement acceleration")
    friction: float = Field(description="Movement friction")
    maxVelocity: float = Field(description="Maximum velocity")
    model_config = ConfigDict(extra="forbid")


class PlayerMovementConfig(BaseModel):
    speed: float = Field(description="Base movement speed; 0.7 is considered slow; 1.0 is considered normal; 1.2 is considered fast")
    momentum: MovementMomentumConfig
    smoothing: float = Field(description="Movement smoothing factor (0-1)")
    model_config = ConfigDict(extra="forbid")

class BulletShapeConfig(BaseModel):
    width: float = Field(description="Bullet width")
    height: float = Field(description="Bullet height")
    depth: float = Field(description="Bullet depth")
    model_config = ConfigDict(extra="forbid")

class BulletTrailConfig(BaseModel):
    enabled: bool = Field(description="Whether trail is enabled")
    length: int = Field(description="Trail length")
    opacity: float = Field(description="Trail opacity")
    model_config = ConfigDict(extra="forbid")

class PlayerBulletConfig(BaseModel):
    speed: float = Field(description="Bullet speed")
    maxCount: int = Field(description="Maximum number of bullets")
    cooldown: int = Field(description="Cooldown between shots in milliseconds")
    shape: BulletShapeConfig
    maxDistance: float = Field(description="Maximum bullet travel distance")
    color: ColorConfig
    opacity: float = Field(description="Bullet opacity (0-1)")
    model_config = ConfigDict(extra="forbid")

class PlayerPhysicsConfig(BaseModel):
    mass: float = Field(description="Player mass")
    restitution: float = Field(description="Bounciness (0-1)")
    damping: float = Field(description="Air resistance")
    model_config = ConfigDict(extra="forbid")

class PlayerVisualConfig(BaseModel):
    scale: float = Field(description="Player scale")
    rotationEffect: float = Field(description="Rotation effect when moving")
    bobbing: bool = Field(description="Whether bobbing is enabled")
    material: Literal['none', 'standard', 'cell'] = Field(description="Material type")
    color: ColorConfig = Field(description="Player color")
    glow: ColorConfig = Field(description="Player glow color")
    model_config = ConfigDict(extra="forbid")

class StandardMaterialConfig(BaseModel):
    diffuseColor: Optional[ColorConfig] = None
    emissiveColor: Optional[ColorConfig] = None
    alpha: Optional[float] = None
    specularColor: Optional[ColorConfig] = None
    model_config = ConfigDict(extra="forbid")

class GameMaterialConfig(BaseModel):
    type: Literal['none', 'standard'] = Field(description="Material type")
    standard: Optional[StandardMaterialConfig] = None
    model_config = ConfigDict(extra="forbid")

class GamePlayerConfig(BaseModel):
    movement: PlayerMovementConfig
    bullets: PlayerBulletConfig
    physics: PlayerPhysicsConfig
    visual: PlayerVisualConfig
    model_config = ConfigDict(extra="forbid")

class AlienThemeConfig(BaseModel):
    name: str = Field(description="Theme name (e.g., 'aliens', 'jellyfish', 'fairies')")
    description: str = Field(description="Theme description")
    model_config = ConfigDict(extra="forbid")

class OpacityReductionConfig(BaseModel):
    amount: float = Field(description="Opacity change per hit (0-1)")
    minOpacity: float = Field(description="Minimum opacity before destruction")
    initialOpacity: Optional[float] = Field(default=1.0, description="Starting opacity")
    visualEffect: Optional[dict] = Field(default=None, description="Visual effect configuration")
    model_config = ConfigDict(extra="forbid")

class PokemonInteractionConfig(BaseModel):
    escapeChance: float = Field(description="Probability of escaping (0-1)")
    dialogueChance: float = Field(description="Probability of dialogue (0-1)")
    escapeAnimation: Optional[dict] = Field(default=None, description="Escape animation config")
    dialogue: Optional[dict] = Field(default=None, description="Dialogue configuration")
    model_config = ConfigDict(extra="forbid")

class AlienDialogueConfig(BaseModel):
    messages: List[str] = Field(description="Possible dialogue messages")
    likelyHood: float = Field(description="How likely the dialogue is to happen (0-1)")
    model_config = ConfigDict(extra="forbid")

class AlienCollisionBehaviorConfig(BaseModel):
    onBulletHit: Literal['destroy', 'reduceOpacity', 'pokemonInteraction'] = Field(description="Collision behavior type")
    dialogue: Optional[AlienDialogueConfig] = None
    model_config = ConfigDict(extra="forbid")

class FormationSpacingConfig(BaseModel):
    x: float = Field(description="Horizontal spacing")
    y: float = Field(description="Vertical spacing")
    model_config = ConfigDict(extra="forbid")

class AlienFormationConfig(BaseModel):
    columns: int = Field(description="Number of columns")
    rows: int = Field(description="Number of rows")
    spacing: FormationSpacingConfig
    useFormation: bool = Field(description="Whether to use formation movement")
    model_config = ConfigDict(extra="forbid")

class FreeMovementConfig(BaseModel):
    speed: float = Field(description="Movement speed")
    wanderRadius: float = Field(description="Wander radius from spawn")
    directionChangeInterval: int = Field(description="Direction change interval in ms")
    smoothness: float = Field(description="Movement smoothness (0-1)")
    model_config = ConfigDict(extra="forbid")

class OscillationAmplitudeConfig(BaseModel):
    x: float = Field(description="Horizontal oscillation range")
    y: float = Field(description="Vertical oscillation range")
    model_config = ConfigDict(extra="forbid")

class OscillationFrequencyConfig(BaseModel):
    x: float = Field(description="Horizontal oscillation speed")
    y: float = Field(description="Vertical oscillation speed")
    model_config = ConfigDict(extra="forbid")

class OscillationConfig(BaseModel):
    amplitude: OscillationAmplitudeConfig
    frequency: OscillationFrequencyConfig
    phaseOffset: bool = Field(description="Whether each alien has random phase offset")
    model_config = ConfigDict(extra="forbid")

class AlienMovementBoundariesConfig(BaseModel):
    minX: float = Field(description="Minimum X boundary")
    maxX: float = Field(description="Maximum X boundary")
    minY: float = Field(description="Minimum Y boundary")
    maxY: Optional[float] = Field(default=None, description="Maximum Y boundary")
    model_config = ConfigDict(extra="forbid")

class AlienMovementConfig(BaseModel):
    pattern: Literal['formation', 'freeSwim', 'oscillate', 'swarm'] = Field(description="Movement pattern type")
    model_config = ConfigDict(extra="forbid")

class IdleAnimationConfig(BaseModel):
    enabled: bool = Field(description="Whether idle animation is enabled")
    type: Literal['bob', 'pulse', 'rotate', 'undulate'] = Field(description="Animation type")
    speed: float = Field(description="Animation speed")
    intensity: float = Field(description="Animation intensity")
    model_config = ConfigDict(extra="forbid")

class MovementAnimationConfig(BaseModel):
    enabled: bool = Field(description="Whether movement animation is enabled")
    type: Literal['trail', 'wobble', 'spiral'] = Field(description="Animation type")
    intensity: float = Field(description="Animation intensity")
    model_config = ConfigDict(extra="forbid")

class AlienAnimationConfig(BaseModel):
    idleAnimation: IdleAnimationConfig
    model_config = ConfigDict(extra="forbid")

class FlockingConfig(BaseModel):
    enabled: bool = Field(description="Whether flocking is enabled")
    cohesionRadius: float = Field(description="Distance to consider neighbors")
    separationRadius: float = Field(description="Minimum distance from neighbors")
    alignmentWeight: float = Field(description="Alignment with neighbors weight")
    cohesionWeight: float = Field(description="Cohesion weight")
    separationWeight: float = Field(description="Separation weight")
    model_config = ConfigDict(extra="forbid")

class AlienBehaviorConfig(BaseModel):
    fireRate: float = Field(description="Bullets per second")
    aggression: float = Field(description="Aggression level (0-1)")
    flocking: Optional[FlockingConfig] = None
    model_config = ConfigDict(extra="forbid")

class ScaleVariationConfig(BaseModel):
    enabled: bool = Field(description="Whether variation is enabled")
    range: float = Field(description="Variation range")
    type: Literal['uniform', 'perRow', 'individual'] = Field(description="Variation type")
    model_config = ConfigDict(extra="forbid")

class ScaleAnimationConfig(BaseModel):
    enabled: bool = Field(description="Whether animation is enabled")
    type: Literal['pulse', 'breathe', 'wobble'] = Field(description="Animation type")
    speed: float = Field(description="Animation speed")
    intensity: float = Field(description="Animation intensity")
    model_config = ConfigDict(extra="forbid")

class AlienScaleConfig(BaseModel):
    base: float = Field(description="Base scale")
    reduction: float = Field(description="Scale reduction per row")
    variation: Optional[ScaleVariationConfig] = None
    animation: Optional[ScaleAnimationConfig] = None
    model_config = ConfigDict(extra="forbid")

class AlienTypeConfig(BaseModel):
    lives: int = Field(description="Number of lives")
    scoreValue: int = Field(description="Score value when destroyed")
    scale: AlienScaleConfig
    material: Optional[GameMaterialConfig] = None
    movementModifier: Optional[float] = Field(default=1.0, description="Movement speed modifier")
    model_config = ConfigDict(extra="forbid")

class BarrierPositionConfig(BaseModel):
    y: float = Field(description="Y position of barriers")
    model_config = ConfigDict(extra="forbid")

class AlienBarrierConfig(BaseModel):
    count: int = Field(description="Number of barriers")
    position: BarrierPositionConfig
    model_config = ConfigDict(extra="forbid")

class AlienAudioConfig(BaseModel):
    moveVolume: float = Field(description="Movement sound volume")
    bulletVolume: float = Field(description="Bullet sound volume")
    explosionVolume: float = Field(description="Explosion sound volume")
    model_config = ConfigDict(extra="forbid")

class GameAlienConfig(BaseModel):
    collisionBehavior: AlienCollisionBehaviorConfig
    movement: AlienMovementConfig
    animation: AlienAnimationConfig
    types: Dict[str, AlienTypeConfig] = Field(description="Alien type configurations")
    model_config = ConfigDict(extra="forbid")

class StarfieldPositioningConfig(BaseModel):
    minY: float = Field(description="Minimum Y position")
    maxY: float = Field(description="Maximum Y position")
    z: float = Field(description="Z position")
    model_config = ConfigDict(extra="forbid")

class StarfieldSizeConfig(BaseModel):
    min: float = Field(description="Minimum star size")
    max: float = Field(description="Maximum star size")
    model_config = ConfigDict(extra="forbid")

class StarfieldOscillationConfig(BaseModel):
    amplitude: float = Field(description="Oscillation amplitude")
    frequency: float = Field(description="Oscillation frequency")
    model_config = ConfigDict(extra="forbid")

class StarfieldDriftConfig(BaseModel):
    horizontalVariation: float = Field(description="Horizontal drift variation")
    verticalVariation: float = Field(description="Vertical drift variation")
    model_config = ConfigDict(extra="forbid")

class StarfieldMovementConfig(BaseModel):
    pattern: Literal['scroll', 'float', 'oscillate', 'drift'] = Field(description="Movement pattern")
    direction: Literal['up', 'down', 'left', 'right'] = Field(description="Movement direction")
    speed: float = Field(description="Movement speed")
    oscillation: Optional[StarfieldOscillationConfig] = None
    drift: Optional[StarfieldDriftConfig] = None
    model_config = ConfigDict(extra="forbid")

class StarfieldBlinkingConfig(BaseModel):
    minInterval: int = Field(description="Minimum blink interval in ms")
    maxInterval: int = Field(description="Maximum blink interval in ms")
    model_config = ConfigDict(extra="forbid")

class StarfieldTextureConfig(BaseModel):
    path: str = Field(description="Texture path")
    dimensions: Dict[str, int] = Field(description="Texture dimensions")
    model_config = ConfigDict(extra="forbid")

class StarfieldThemeConfig(BaseModel):
    particleType: Literal['stars', 'bubbles', 'fairies', 'particles'] = Field(description="Particle type")
    name: str = Field(description="Theme name")
    model_config = ConfigDict(extra="forbid")

class GameStarfieldConfig(BaseModel):
    maxStars: int = Field(description="Maximum number of stars")
    ratioOfBlinkers: float = Field(description="Ratio of blinking stars")
    positioning: StarfieldPositioningConfig
    size: StarfieldSizeConfig
    colors: List[List[float]] = Field(description="Star colors as RGBA arrays")
    movement: StarfieldMovementConfig
    blinking: StarfieldBlinkingConfig
    texture: StarfieldTextureConfig
    theme: StarfieldThemeConfig
    model_config = ConfigDict(extra="forbid")

class SkyboxConfig(BaseModel):
    texture: str = Field(description="Skybox texture path")
    model_config = ConfigDict(extra="forbid")

class AtmosphereBackgroundConfig(BaseModel):
    type: Literal['clearColor', 'skybox'] = Field(description="Background type")
    clearColor: Optional[List[float]] = Field(default=None, description="Clear color as RGBA")
    skybox: Optional[SkyboxConfig] = None
    model_config = ConfigDict(extra="forbid")

class AtmosphereFogConfig(BaseModel):
    enabled: bool = Field(description="Whether fog is enabled")
    color: List[float] = Field(description="Fog color as RGB")
    start: float = Field(description="Fog start distance")
    end: float = Field(description="Fog end distance")
    mode: str = Field(description="Fog mode")
    model_config = ConfigDict(extra="forbid")

class AtmosphereLightingConfig(BaseModel):
    intensity: float = Field(description="Light intensity")
    direction: List[float] = Field(description="Light direction as XYZ")
    position: List[float] = Field(description="Light position as XYZ")
    diffuse: List[float] = Field(description="Diffuse color as RGB")
    specular: List[float] = Field(description="Specular color as RGB")
    model_config = ConfigDict(extra="forbid")

class GameAtmosphereConfig(BaseModel):
    background: AtmosphereBackgroundConfig
    fog: AtmosphereFogConfig
    lighting: AtmosphereLightingConfig
    model_config = ConfigDict(extra="forbid")

class LowLevelGameDSLConfig(BaseModel):
    """Complete low-level game configuration matching the TypeScript GameDSLConfig structure"""
    id: str = Field(description="Unique game identifier")
    name: str = Field(description="Game name")
    camera: Literal['action', 'follow', 'fixed'] = Field(description="Camera type")
    assets: GameAssetConfig
    player: GamePlayerConfig
    aliens: GameAlienConfig
    starfield: GameStarfieldConfig
    atmosphere: GameAtmosphereConfig
    model_config = ConfigDict(extra="forbid")

###############################
#### Image Analysis Schema ####
###############################

class ImageAnalysisRequest(BaseModel):
    image_data: str = Field(description="Base64 encoded image data")
    game_id: Optional[str] = None
    current_game_dsl: Optional[Dict[str, Any]] = None
    current_setting_config: Optional[Dict[str, Any]] = None

class ObjectStyleUpdate(BaseModel):
    object_name: str = Field(description="Name of the object to update")
    color: str = Field(description="New color that matches the image style")
    reasoning: str = Field(description="Why this color matches the image style")
    
    model_config = ConfigDict(extra="forbid")

class ImageAnalysisResponse(BaseModel):
    message: str = Field(description="Response message status")
    description: str = Field(description="Brief visual description of the image")
    render_type: Literal['skybox', 'ground', 'object'] = Field(description="Recommended rendering type for the image")
    confidence: float = Field(description="Confidence score for the recommendation (0-1)")
    
    # Flattened game recommendation fields to avoid $ref issues
    game_type: str = Field(description="WarioWare-style mini-game recommendation based on image")
    game_scale: Literal['small', 'medium', 'large'] = Field(description="Game scale appropriate for WarioWare-style gameplay")
    game_mechanics: List[str] = Field(description="Suggested game mechanics that fit the image style")
    game_duration: str = Field(description="Estimated game duration in WarioWare style (e.g., '5-10 seconds', '10-15 seconds')")
    
    # Flattened camera recommendation fields
    camera_type: Literal['THIRD_PERSON', 'SIDE_VIEW', 'TOP_DOWN', 'CHASE'] = Field(description="Recommended camera type based on image style and game mechanics")
    camera_reasoning: str = Field(description="Brief explanation for the camera choice")
    
    # Use proper object array instead of generic dict
    object_style_updates: List[ObjectStyleUpdate] = Field(description="Color and style updates for existing objects to match image style")
    
    model_config = ConfigDict(extra="forbid")

class SceneDescriptionRequest(BaseModel):
    image_data: str = Field(description="Base64 encoded image data from canvas screenshot")
    game_id: Optional[str] = None

class SceneDescriptionResponse(BaseModel):
    message: str
    description: str = Field(description="Detailed description of what's happening in the game scene")
    timestamp: str = Field(description="Timestamp when the analysis was performed")
    
    model_config = ConfigDict(extra="forbid")

###############################
## Game2DSL Generation Schema ##
###############################

class Game2DSLRequest(BaseModel):
    game_id: str = Field(description="Game ID")
    narrative_text: str = Field(description="Narrative text")
    mechanism_sentence: str = Field(description="Mechanism sentence")
    name: str = Field(description="Name of the game")
    
    model_config = ConfigDict(extra="forbid")

class Game2DSLResponse(BaseModel):
    message: str = Field(description="Response message status")
    game2_dsl: Dict[str, Any] = Field(description="The generated high-level Game2DSL")
    
    model_config = ConfigDict(extra="forbid")

###############################
## Asset Generation Schema ##
###############################

class AssetGenerationRequest(BaseModel):
    game2_dsl: Dict[str, Any] = Field(description="The high-level Game2DSL configuration")
    game_id: str = Field(description="Game ID")
    game_name: str = Field(description="Game name")
    model_config = ConfigDict(extra="forbid")

class AssetGenerationResponse(BaseModel):
    message: str = Field(description="Response message status")
    assets: List[Dict[str, Any]] = Field(description="Generated assets data")
    
    model_config = ConfigDict(extra="forbid")

###############################
## Low-Level Config Generation ##
###############################

class LowLevelConfigRequest(BaseModel):
    game2_dsl: Dict[str, Any] = Field(description="The high-level Game2DSL configuration")
    game_id: str = Field(description="Game ID")
    game_name: str = Field(description="Game name")
    
    model_config = ConfigDict(extra="forbid")

class LowLevelConfigResponse(BaseModel):
    message: str = Field(description="Response status message")
    complete_config: Dict[str, Any] = Field(description="Complete low-level configuration")
    config_id: str = Field(description="Unique identifier for the generated configuration")
    
    model_config = ConfigDict(extra="forbid")