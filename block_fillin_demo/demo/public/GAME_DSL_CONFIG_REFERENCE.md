# World

Defines the game world environment including physics, camera, lighting, and atmosphere.

### Basic World Configurations

---

#### `hasGround`

**Type:** `boolean`
Whether a physical ground plane exists in the game world. Note that this only affect the whether the ground is **visible**. d

- `true`: the ground is visibly rendered
- `false`: the ground is not visible, but the player will still stop at the ground

#### `ground` (optional)

**Type:** **`GroundConfig`**
Additional ground configurations. The ground is essentially a box.
**`width`**(number): default 500
**`height`**(number): default 5
**`depth`**(number): default 500
**`posY`**(number): default -6. -6 unit of the vertical center.

#### `skyboxType`

**Type:** `'box' | 'sphere'`
Skybox geometry type:

- `'box'`: Six-sided cube for environments
- `'sphere'`: Seamless dome for skies

#### `gravityMultiplier`

**Type:** `number`
Multiplier for gravity strength. 1.0 represents Earth-like gravity. typical value is 1.3.
**Example:** `0.5` (low gravity, floaty), `1.3` (nearly earth gravity), `3` (heavy gravity, fast falling)
**Code** on initiate gravity

```javascript
const hk = new HavokPlugin(true, havokInstance);
const gravityMultiplier = worldConfig.gravityMultiplier;
scene.enablePhysics(new Vector3(0, -90 * gravityMultiplier, 0), hk);
```

### Camera Configurations

---

#### `cameraType`

**Type:** `'ortho' | 'action' | 'normal' | 'birdeye'`
Camera perspective type. All cameras are implemented with [Arc Rotate Camera](https://doc.babylonjs.com/features/featuresDeepDive/cameras/camera_introduction#arc-rotate-camera) with code:

```javascript}
this._camera = new ArcRotateCamera('camera', cameraAlpha, cameraBeta, radius, cameraTarget, this.scene);
```

Each type of camera has its default configuration values, which can be modified by the camera modifiers.

- `'ortho'`: 2D orthographic view (like Flappy Bird): `{alpha: 4.7, beta: Math.PI / 2, radius: 100, fov: Math.PI / 4}`
- `'action'`: Close follow camera, it placed at the side of scene: `{alpha: -Math.PI, beta: Math.PI / 2, radius: 100, fov: Math.PI / 6}`
- `'normal'`: Standard 3D perspective: `{alpha: -Math.PI / 2, beta: Math.PI / 2.4, radius: 100, fov: Math.PI / 3.5}`
- `'birdeye'`: Top-down view: `{alpha: 4.7, beta: 0, radius: 133.3, fov: Math.PI / 3.5}`
  For `'ortho'` camera, the camera mode is set to 1, others are 0.
  The camera target is by default set to `[0,0,0]`

**Example:** `'ortho'` (flappy bird game), `'normal'` (3D platformer)

#### `cameraAlphaDelta`, `cameraBetaDelta` (optional)

**Type**: `number` (in degree)
This will be applied to the camera alpha/beta value by:

```javascript
cameraAlpha = defaultAlpha + (cameraAlphaDelta / 180) * Math.PI;
cameraBeta = defaultBeta + (cameraBetaDelta / 180) * Math.PI;
```

#### `cameraRadiusDelta` (optional)

**Type**: `number`
This will be applied to the camera radius value by:

```javascript
cameraRadius = defaultRadius + cameraRadiusDelta;
```

#### `cameraTargetDelta` (optional)

**Type:** `Array[3]`
Offset for camera look-at target (x, y, z). The camera target is by default set to `[0,0,0]`
This will be applied to the camera target value by:

```javascript
cameraTarget = cameraTarget.add(
  new Vector3(cameraTargetDelta[0], cameraTargetDelta[1], cameraTargetDelta[2])
);
```

#### `cameraFovScale` (optional)

**Type:** `number`
Offset for camera look-at target (x, y, z). The camera target is by default set to `[0,0,0]`
This will be applied to the camera target value by:

```javascript
cameraFov = defaultFov * cameraFovScale;
```

### Lightening Configurations

---

SmallGami uses three light systems. A `Hemesipheric Light`, and a `Directional Light` and a `Bottom Light`

#### `HemisphericLight`

Ambient environment light.
**Type:** **`LightConfig`**
**`intensity`**(`number`): Light intensity level, usually between 0.3-1.0
**`color`**(`Array[3]`]: Light color (e.g., [1, 1, 0.9] for warm white), number are RGB, ranging 0-1. it can be >1 reflecting light intensity
**`direction`**(`Array[3]`): in hemispheric light, the direction is the reflection direction rather than incoming direction

#### `DirectionalLight`

A directional light is defined by a direction. The light is emitted from everywhere in the specified direction, and has an infinite range. The directional light will influence where the shadow would be
**Type:** **`LightConfig`**
**`intensity`**(`number`): Light intensity level, usually between 0.1-0.8
**`color`**(`Array[3]`]: Light color (e.g., [1, 1, 0.9] for warm white), number are RGB, ranging 0-1. it can be >1 reflecting light intensity
**`direction`**(`Array[3]`): the light incoming direction. Light in a downward direction will light the top of an object.

#### `BottomLight`

A bottom light is a low-intensity directional light aimed upward. We include it to improve readability and material legibility.
**Type:** **`LightConfig`**
**`intensity`**(`number`): Light intensity level, usually between 0.05-0.25
**`color`**(`Array[3]`]: Light color (e.g., [1, 1, 0.9] for warm white), number are RGB, ranging 0-1. it can be >1 reflecting light intensity
**`direction`**(`Array[3]`): the light incoming direction. Typically it should be upward (e.g., `[0, 1, 0]` or slightly angled).

### Atmosphere Configurations

---

#### `particles`

The particle system that creates certain vibe for the scene.
**Type:** **`ParticlesConfig`**
The following parameters are within the **`ParticlesConfig`**:
**`maxStars`**(`number`): Maximum number of particle instances in the scene (e.g., 10 for sparse, 200 for dense)
**`ratioOfBlinkers`**(`number`): 0-1, Proportion of particles that blink/twinkle (0.0 = none, 1.0 = all, 0.4 = 40% blink)
**`blinking.minInterval`**(`number`): Minimum milliseconds between blinks (e.g., 800ms for frequent)
**`blinking.maxInterval`**(`number`): Maximum milliseconds between blinks (e.g., 2000ms for occasional twinkling). The interval will be randomly decide between the min and max specified.
**`ratioOfBlinkers`**(`number`):
**`size.min`**(`number`): Minimum particle size in world units
**`size.max`**(`number`): Maximum particle size in world units. The max should not be smaller than 0.5.
**`colors`**(`number[][4]`): Array of RGBA color arrays for particles (e.g., `[[1,1,1,0.6]]` for semi-transparent white), if multiple colors are provided in the array, they will be chose randomly with:

```javascript
colorIndex = Math.floor(Math.random() * colors.length);
star.color = new Color4(
  colors[colorIndex][0],
  colors[colorIndex][1],
  colors[colorIndex][2],
  colors[colorIndex][3] || 1
);
```

**`movement.pattern`** (`'scroll' | 'float' | 'oscillate' | 'drift'` ):
The different movement style, which is important for establishing different vibes of the world. Different patterns require different configurations
`scroll`: linear movement of the particles. need to config **`movement.direction`** to specify the scroll direction. For example, scroll down maybe resemble a snowy scene, scroll left/right might be useful when constructing a moving scene (like in the flappy bird game), etc.
`float`: floating up with drift. Need to config the **`movement.drift`** to specify the drifting intensity. For example in an ocean scene, this may allow you to have the particles and floating up bubbles.
`oscillate`: each particle oscillates around a base center. Need to config **`movement.oscillation`**. For example, in a ancient forest scene, this may allow you to have the particles as fairies or fireflies.
`drift`: random wandering within the space. Need to config the **`movement.drift`** to specify the drifting intensity.
**`movement.speed`**(number): the movement speed of the particles. The number means the world unit the particle travels per rendering frame (based off 60FPS rendering rate). 0.05 would be very slow and 1.5 would be very fast.
(optional)**`movement.direction`** (`'up' | 'down' | 'left' | 'right'` ): movement direction for `scroll` pattern.
(optional)**`movement.drift.horizontalVariation`** (`number`): Random horizontal movement range for `drift` and `float` patterns, the number of the variable is of the same unit as the **`movement.speed`**
(optional)**`movement.drift.verticalVariation`** (`number`): Random vertical movement range for `drift` and `float` patterns
(optional)**`movement.oscillation.amplitude`** (`number`): Distance of oscillation (how far to wave), 1 would be fairly small oscillation and 10 would be big.
(optional)**`movement.oscillation.frequency`** (`number`): Speed of oscillation cycle (how fast to wave; e.g., 0.02 for slow, 0.1 for fast
(optional)**`texture.path`**(`number`): Image file path for particle sprite (e.g., `'/texture/star.png'`), for now, specify this string as the path.
(optional)**`texture.dimensions`**(`object: {width: number, height: number}` ): Texture dimensions in pixels (e.g., `{width: 128, height: 128}` this will be the default dimensions)

#### `fog`

Fog effect configuration for atmosphere. Uses [Babylon.JS's built-in fog system](https://doc.babylonjs.com/features/featuresDeepDive/environment/environment_introduction#fog).
**Type:** **`FogConfig
	`enabled`**(`boolean`): Whether fog effect is active in the scene
**`color`**(`Array[3]`]: Fog color as RGB values (0-1 each; e.g., `[0.5, 0.5, 0.6]` for gray-blue fog)
**`mode`**(`'linear' | 'exponential' | 'exponential2'` ): whether the fog density is following a LINEAR or EXP or EXP2 function d
(optional)**`start, end`**(`number`):  if you choose `'linear'` mode, then you can define where fog starts and where fog ends. by default the `start` is `0` and the `end` is `800`
(optional)**`density`**(`number`): if you choose `'exponential'` or `'exponential2'` mode, you can define the density option. default is 0.3, usually 0.05 would be very light and 1 would be very strong.

# Player

Player character settings controlling appearance, physics, animation, and shooting mechanics.

### Basic Configurations

---

#### `size`

**Type:** `number`
Player visual size and collision box dimensions in world units. Usually around `5`.

#### `startPosition`

**Type:** Object `{x:number, y:number, z:number}`
Initial spawn position in 3D world space. The player will be created at this location when the game starts.
**Note:** The actual Y position is adjusted internally by adding `size/2` to ensure the player sits properly on the ground.

```javascript
playerStartPosition = new Vector3(
  startPosition.x,
  startPosition.y + this.playerConfig.size / 2,
  startPosition.z
);
```

#### `initialRotation` (optional)

**Type:** `Array[3]` (in radius)
Initial rotation angles for the player. If not specified, the rotation from the loaded asset is preserved.
**Example:** `{"x": 0, "y": 1.57, "z": 0}` (rotates player 90 degrees around Y axis)

### Motion Configurations

---

#### `mass`

**Type:** `number`
Player mass affecting physics interactions and momentum. Higher mass makes the player heavier and affects how forces are applied. Mass affects both movement responsiveness and jump behavior.
**Example:** `1` (light), `10` (medium), `20` (heavy)

#### `restitution`

**Type:** `number` `(0-1)`
Bounciness when colliding with surfaces. 0 means no bounce, 1 means perfect bounce (ball-like).
**Example:** `0.2` (minimal bounce), `0.4` (moderate bounce), `0.8` (very bouncy)

#### `friction`

**Type:** `number`
Apply to horizontal moving speed deceleration (not jumping).
**Example:** `3` (slow stop/slippery), `7` (quick stop), `15` (instant stop)

#### `moveSpeed`

**Type:** `number`
Horizontal movement speed when player moves left/right. Higher values make the player move faster.
**Example:** `25` (slow movement), `50` (moderate movement), `100` (fast movement)
The horizontal moving speed is applied as force to the physics body:

```javascript
const forceX = velocityDifferenceX * playerConfig.mass * 2;
playerAggregate.body.applyForce(new Vector3(forceX, 0, 0), position);
```

#### `jumpPower`

**Type:** `number`
Initial upward velocity when jumping. Higher values result in higher jumps.
**Example:** `30` (low jump), `50` (moderate jump), `70` (high jump)

#### `jumpOnlyOnGround`

**Type:** `boolean`
Whether to restrict jumping to when player is touching the ground.

- `true`: Player can only jump when on ground
- `false`: Allows air jumps up to `maxJumpCount`

#### `maxJumpCount` (optional)

**Type:** `number`
Maximum number of jumps allowed in the air before landing. Only applies when `jumpOnlyOnGround` is `false`.
**Example:** `1` (single jump only), `2` (double jump), `3` (triple jump)
**Default:** `Infinity` (unlimited air jumps if `jumpOnlyOnGround` is false)

#### `jumpInterval` (optional)

**Type:** `number` (milliseconds)
Minimum time interval required between consecutive jumps. Prevents spam jumping.
**Example:** `200` (0.2 seconds between jumps), the user can only execute the second jump after 200ms cooldown
**Default:** `200` milliseconds

#### `jumpAnimationDuration`

**Type:** `number` (milliseconds)
Total duration of the jump squish/stretch animation cycle. Usually between `300-800`
The jump animation has two phases:

- Phase 1 (first half): Squish and stretch (anticipation)
- Phase 2 (second half): Return to normal scale (recovery)
  this parameter can control how squishy the player visually looks like. Along with the **`jumpSquishScale`** and **`jumpStretchScale`** parameters.
  **Example:** `300` (quick animation), `500` (moderate animation), `800` (slow/exaggerated animation)

#### `jumpSquishScale`

**Type:** `number`
Horizontal compression ratio during jump takeoff. Values less than 1 create a squished appearance. usually between `0.85-0.95`

#### `jumpStretchScale`

**Type:** `number`
Vertical stretch ratio during jump. Values greater than 1 create a stretched appearance. Technically this should be calculated based on the **`jumpSquishScale`**, here we simply allow customization for more or less exaggerated visual effect. Usually between `1.02-1.2`
**Example:** `1.05` (subtle 5% stretch), `1.1` (moderate 10% stretch), `1.2` (strongly exaggerated 20% stretch)

### Player Equipment Configurations

---

In this version of **SmallGami**, the only supported player equipment (tool) is a **projectile emitter**. This configuration defines how the player shoots projectiles during gameplay.

#### `bullets` (optional)

Only specify this configuration if the player has the **`fireBullet`** ability enabled in **Controls Configurations**.
Although referred to as _bullets_, this configuration is **narrative-agnostic**. A “bullet” represents any projectile the player emits, and its interpretation depends on the game’s theme:

- A fish → rising bubbles
- A magician → magical beams or sparks
- A spaceship → laser shots
  **Type:** **`BulletsConfig`**
  **`speed`** (`number`): Projectile velocity in world units per frame. Usually between `1-10`
  **`maxCount`** (`number`): Maximum number of projectiles that can exist simultaneously. Controls fire rate limitation.
  **`cooldown`** (`number` in milliseconds): Minimum time between consecutive shots.
  **`maxDistance`** (`number`): Maximum travel distance before projectile is automatically destroyed.
  **`shape`** (`{width:number, height:number, depth: numbner}`): Projectile's size in world unit.
  **`color`** (`{r:number, g:number, b:number`): Specify the RGB value of the projectile, each number should be between `0-1`
  **`opacity`** (`number`): Projectile transparency from 0.0 (invisible) to 1.0 (fully opaque)
  **`direction`** (`'up' | 'down' | 'left' | 'right' | 'inside'`) Not implemented yet. I n the current implementation, the bullet is always emitted upwards.

# (Play) Object

The play objects define what are the objects that will be interacting with the player and its equipment (in the initial version, it means the projectile)
in the configuration, it will be an array of different types of objects. For each play object it is specified as below.

#### `name`

**Type:** `string`
The name of the object, what it is.

#### `id`

**Type:** `string`
A unique identifier of the object. which will be used as reference in the **`Spawn Config`** and **`Assets Config`**

#### `size`

**Type:** `{x:number, y:number, z:number}`
The base size of the object in world unit. The object can have variations in size, specified in the **`Spawn Config`**
Note that the size is applied as `scale` to the original object model:

```javascript
playObject.scaling = new Vector3(x, y, z);
```

Therefore, when config the size, it can make the object distorted.

#### `score` (optional)

The score of the object, will be applied when the collision between the player and the object (specified with **`onPlayerCollision`**) or collision between the player's projectile and the object (specified with **`onProjectileCollision`**) happen. Note that the score can be positive (as a reward) or negative (as a penalty) number.

#### `onPlayerCollision`

This defines when the player and the object collision happens, how the `player` and `object` will be affected respectively.
Additionally, the sound with id `'collision_player_' + playobjectConfigId` will be played (specified in **`AssetConfig`**)
**Type:** **`PlayerCollisionConfig`**
**`player`** (`jump | die | score`):
`jump`: when player hits the object, the player will jump. The jump will be applied with double `jumpPower` as specified in the `playerConfig`. If the `score` is specified, then this will also be applied.
`die`: the player's `live --`
`score`: affects the player's the player's `score` ONLY. If the playerObject's score is specified, then apply the specified score, otherwise, score will be by default `+1`
**`object`** (`dispose | none`): In the current version, we only support whether the object will dispose or not after the collision.

#### `onProjectileCollision`

Additionally, the sound with id `'collision_projectile_' + playobjectConfigId` will be played (specified in **`AssetConfig`**)
This defines when the player's projectile hits the object, how the `player's projectile` and `object` will be affected respectively.
**Type:** **`ProjectileCollisionConfig`**
**`projectile`** (`dispose`): In the current version, the projectile will always got disposed after the collision with the object.
**`object`** (`dispose | score | none`): whether the object will dispose and apply the score, or nothing happened.

#### `onGroundCollision`

**Type:** `dispose | disappearing | none`
This defines what will happen if an object hits the ground:
`dispose`: directly dispose when hits the ground;
`disappearing`: dispose after `1200ms`
`none`: nothing happens, the object will stay on the ground. This means its effect will remains if the player or the player's projectile hits it.

#### `motionType`

**Type:** `0 | 1 | 2`
The objects's physical motion type defined in [babylon.JS's physics body](https://doc.babylonjs.com/typedoc/classes/BABYLON.PhysicsBody)
`0: PhysicsMotionType.STATIC` - Static bodies are not moving and unaffected by forces or collisions. They are good for level boundaries or terrain.
`1: PhysicsMotionType.DYNAMIC` - Dynamic bodies are fully simulated. They can move and collide with other objects.
`2: PhysicsMotionType.ANIMATED` - They behave like dynamic bodies, but they won't be affected by other bodies, but still push other bodies out of the way.

#### `initialSpeed`

**Type:** `{x: number, y: number, z: number}`
Starting velocity (x, y, z) for moving object, for static objects, specify the speed to be `{x:0, y:0, z:0}`. Only apply for objects those motion type is 1 or 2:

```javascript
this.physicsAggregate.body.setLinearVelocity(initialSpeed);
```

This configuration defines the object’s starting velocity in world space `(x, y, z)`, relative to the object’s spawn position specified in **`SpawnConfig`**.
**Use cases:**

- **Simulating thrown or launched objects (motionType = 2)**  
   For example, `{ x: 0, y: 10, z: 0 }` will cause the object to be thrown upward from its spawn position.
- **Initializing continuous motion (motionType = 1)**  
   This is useful for objects that should start moving immediately upon spawning.
- **Creating scrolling environments in fixed-camera setups**  
   In side-scrolling games (e.g., a Flappy Bird–style game), obstacles can be given a constant velocity such as `{ x: -30, y: 0, z: 0 }`. This creates the illusion that the player character is moving forward at `+30` units along the x-axis, while the camera remains stationary.

#### `initialRotation`(optional)

**Type:** `{x: number, y: number, z: number}`
Starting rotation angles in radians (x, y, z).

# Spawn

This defines the spawn mechanism of the play object. Combined with the specifications for `(play) Object` , this is essential for specifying the gaming mechanism.

The `Spawn` for the game, is a list of spawn controllers that are specified with the following configurations. These spawn controllers will be working in parallel.

#### `spawnTrigger`

**Type:** `timer | scheduled | once`
`timer`: object spawned with a specific time interval specified in `spawnTriggerTime`. This is useful for a regular time based trigger. such as in flappy bird game, the display of the tubes.
`scheduled`: object spawned at a scheduled time sequence as specified by timestamp, this will need to be specified in `spawnTriggerSchedule` configuration.
`once`: object will only be spawned once, at the `spawnTriggerTime`

#### `spawnTriggerTime`(optional)

**Type:** `number`
In milliseconds, this needs to be specified if the `spawnTrigger` type is `timer` (the time interval) or `once` (the one-time spawned time).

#### `spawnTriggerSchedule`(optional)

**Type:** **`scheduleConfig`**
**`schedule`**(`number[]`) : the sequence of timestamps in milliseconds when the object is spawned.
**`recurrent`**(`boolean`) : if `true`, the sequence will start over when it ends; if `false`, then this is a one time sequence.
**`parseFrom`**(`string`, optional): currently not supported but as an envisioned parameter. A path to a file will the scheduled timestamp sequence will be parse from; for exmaple, it can be parse from an background audio file to match the drum beats.

#### `spawnLikelihood`

**Type:** `{[objectId: string]: number}`
TThis configuration specifies two things: **which play objects are controlled by this spawn controller** and **the spawn probability for each object**. Each object is identified by its `playObject` ID, used as the key in the dictionary. The corresponding value is a number in the range `[0, 1]` that represents the object’s spawn likelihood: `0` → the object is never spawned; `1` → the object is always spawned whenever the spawn trigger fires.

#### `spawnXrange`, `spawnYrange`, `spawnZrange`

**Type:** **`[number, number]`**
Specify the min and max X/Y/Z coordinates for spawn location `[min, max]` in world unit. The spawn controller will choose a random number between the range. If want to spawn at a fixed position, specify the min and max to be the same number.

#### `spawnOffset`(optional)

**Type:** `{[objectId: string]: {x:number, y:number, z:number}}`
Applies a fixed positional offset on top of the randomly sampled spawn position. This is useful when a single spawn controller manages multiple objects that must maintain a consistent spatial relationship. For example:

- Top and bottom pipes in a Flappy Bird–style game
- A coin that should always appear above a platform
-

#### `scaleRangeX,  `scaleRangeY`,  `scaleRangeZ`

**Type:** **`[number, number]`**
Specify the min and max X/Y/Z scale for the spawned object. For fixed scale, specify the min and max to be the same number.
