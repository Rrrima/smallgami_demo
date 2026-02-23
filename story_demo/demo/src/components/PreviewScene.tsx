/**
 * @file PreviewScene.tsx
 * @description BabylonJS mini-scene for previewing CompositeObject assets.
 * Renders a transparent-background canvas with a glass ground plane, supports
 * loading composite JSON via file upload, and can accept a generated asset prop.
 *
 * Key exports:
 *  - PreviewScene: React component (default export)
 */

import { useRef, useEffect, useState } from 'react';
import {
  Engine,
  Scene,
  ArcRotateCamera,
  HemisphericLight,
  DirectionalLight,
  MeshBuilder,
  PBRMaterial,
  Color3,
  Color4,
  Vector3,
  Mesh,
} from '@babylonjs/core';
import { createSoftbox, defaultCompositeObject, CompositeObject } from '@smallgami/engine';
import { Save, Upload } from 'lucide-react';
import '../styles/preview-scene.scss';

interface PreviewSceneProps {
  generatedAsset?: CompositeObject | null;
}

export default function PreviewScene({ generatedAsset }: PreviewSceneProps) {
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewEngineRef = useRef<Engine | null>(null);
  const previewSceneRef = useRef<Scene | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [currentComposite, setCurrentComposite] =
    useState<CompositeObject | null>(null);
  const [time, setTime] = useState(0);

  // Handle generated asset from ChatWindow
  useEffect(() => {
    if (generatedAsset && previewSceneRef.current) {
      // Clear existing objects
      const scene = previewSceneRef.current;
      const existingMeshes = scene.meshes.filter(m =>
        m.name.startsWith('composite')
      );
      existingMeshes.forEach(m => m.dispose());

      // Create new composite object
      createCompositeFromData(scene, generatedAsset);
      setCurrentComposite(generatedAsset);
    }
  }, [generatedAsset]);

  // Initialize preview scene
  useEffect(() => {
    if (!previewCanvasRef.current) return;

    // Create engine
    const engine = new Engine(previewCanvasRef.current, true);
    previewEngineRef.current = engine;

    // Create scene
    const scene = new Scene(engine);
    previewSceneRef.current = scene;

    // Make scene background transparent
    scene.clearColor = new Color4(0, 0, 0, 0);

    // Create camera
    const camera = new ArcRotateCamera(
      'previewCamera',
      -Math.PI / 2,
      Math.PI / 2.5,
      5,
      new Vector3(0, 1, 0),
      scene
    );
    camera.attachControl(previewCanvasRef.current, true);

    // Create directional light (like sunlight)
    const light = new DirectionalLight(
      'directionalLight',
      new Vector3(-1, -2, -1), // Direction from which light comes
      scene
    );
    light.intensity = 1.2;

    // Keep some ambient light for better overall illumination
    const ambientLight = new HemisphericLight(
      'ambientLight',
      new Vector3(0, 1, 0),
      scene
    );
    ambientLight.intensity = 0.3;

    // Create a simple preview scene with basic shapes
    createPreviewScene(scene);

    // Start render loop
    engine.runRenderLoop(() => {
      if (previewSceneRef.current) {
        previewSceneRef.current.render();
      }
    });

    // Handle window resize
    const handleResize = () => {
      engine.resize();
    };
    window.addEventListener('resize', handleResize);

    // Cleanup function
    return () => {
      window.removeEventListener('resize', handleResize);
      if (previewSceneRef.current) {
        previewSceneRef.current.dispose();
        previewSceneRef.current = null;
      }
      if (previewEngineRef.current) {
        previewEngineRef.current.dispose();
        previewEngineRef.current = null;
      }
    };
  }, []);

  const handleSave = () => {
    if (!currentComposite) {
      setCurrentComposite(defaultCompositeObject);
    }

    if (currentComposite) {
      const dataStr = JSON.stringify(currentComposite, null, 2);
      const dataUri =
        'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

      const exportFileDefaultName = `${currentComposite.name.toLowerCase()}.json`;

      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
    }
  };

  const handleUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = e => {
        try {
          const compositeData: CompositeObject = JSON.parse(
            e.target?.result as string
          );
          setCurrentComposite(compositeData);

          // Update the scene with the loaded composite (preserve ground and background)
          if (previewSceneRef.current) {
            const scene = previewSceneRef.current;

            // Remove existing composite object (keep ground and lighting)
            const existingComposite = scene.getMeshByName('composite');
            if (existingComposite) {
              existingComposite.dispose();
            }

            // Create the new composite object from JSON
            const compositeMesh = createCompositeFromData(scene, compositeData);
            compositeMesh.name = 'composite'; // Give it a consistent name for future removal

            // Reset time for new animation
            setTime(0);

            // Clear existing animation observables to prevent multiple animations
            scene.onBeforeRenderObservable.clear();

          }
        } catch (error) {
          console.error('Error parsing JSON file:', error);
          alert('Invalid JSON file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const createCompositeFromData = (
    scene: Scene,
    data: CompositeObject
  ): Mesh => {
    const compositeMesh = MeshBuilder.CreateBox(
      'composite',
      { size: 0.1 },
      scene
    );
    compositeMesh.isVisible = false;

    data.parts.forEach(part => {
      let partMesh: Mesh;

      if (part.type === 'softbox') {
        partMesh = createSoftbox(part.softboxOptions, scene);
      } else if (part.type === 'cylinder') {
        partMesh = MeshBuilder.CreateCylinder(
          part.name,
          part.cylinderOptions,
          scene
        );
      } else if (part.type === 'sphere') {
        partMesh = MeshBuilder.CreateSphere(
          part.name,
          part.sphereOptions,
          scene
        );
      } else if (part.type === 'box') {
        const size = part.boxOptions.size || 1;
        const width = part.boxOptions.width || size;
        const height = part.boxOptions.height || size;
        const depth = part.boxOptions.depth || size;
        partMesh = MeshBuilder.CreateBox(
          part.name,
          { width, height, depth },
          scene
        );
      } else {
        return; // Skip unknown types
      }

      // Apply material
      const material = new PBRMaterial(`${part.name}Material`, scene);
      material.albedoColor = new Color3(...part.material.albedoColor);
      material.metallic = part.material.metallic;
      material.roughness = part.material.roughness;
      partMesh.material = material;

      // Apply transform
      partMesh.position = new Vector3(...part.transform.position);
      partMesh.rotation = new Vector3(...part.transform.rotation);
      // partMesh.rotationQuaternion = new Quaternion(...part.transform.rotation);
      if (part.transform.scale) {
        partMesh.scaling = new Vector3(...part.transform.scale);
      }

      // Parent to composite
      partMesh.parent = compositeMesh;
    });

    // Apply overall transform if specified
    if (data.overallTransform) {
      if (data.overallTransform.position) {
        compositeMesh.position = new Vector3(...data.overallTransform.position);
      }
      if (data.overallTransform.rotation) {
        compositeMesh.rotation = new Vector3(...data.overallTransform.rotation);
      }
      if (data.overallTransform.scale) {
        compositeMesh.scaling = new Vector3(...data.overallTransform.scale);
      }
    }

    return compositeMesh;
  };

  const createBasicSceneElements = (scene: Scene) => {
    // Create ground plane
    const ground = MeshBuilder.CreateGround(
      'ground',
      { width: 6, height: 6 },
      scene
    );
    const groundMaterial = new PBRMaterial('groundMaterial', scene);

    // Glass-like properties
    groundMaterial.albedoColor = new Color3(0.9, 0.95, 1.0); // Very light blue-white tint
    groundMaterial.alpha = 0.3; // Semi-transparent
    groundMaterial.metallic = 0.1; // Slight metallic for reflectivity
    groundMaterial.roughness = 0.1; // Smooth surface
    groundMaterial.indexOfRefraction = 1.5; // Glass refraction index
    groundMaterial.directIntensity = 0.8; // Some direct lighting
    groundMaterial.environmentIntensity = 1.2; // Boost environment reflections
    groundMaterial.transparencyMode = PBRMaterial.PBRMATERIAL_ALPHABLEND; // Enable alpha blending

    ground.material = groundMaterial;

    // Position the ground lower
    ground.position.y = 0;
  };

  const createPreviewScene = (scene: Scene) => {
    // Create basic scene elements (ground)
    createBasicSceneElements(scene);

    // Create the default composite object
    const compositeMesh = createCompositeFromData(
      scene,
      defaultCompositeObject
    );
    compositeMesh.name = 'composite'; // Give it a name for identification

    // Set the current composite to the default object
    setCurrentComposite(defaultCompositeObject);

  };

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={previewCanvasRef}
        className='preview-canvas'
        style={{ width: '100%', height: '100%', outline: 'none' }}
      />
      <div className='preview-controls'>
        <div onClick={handleSave} className='preview-btn save-btn'>
          <Save />
        </div>
        <div
          onClick={() => fileInputRef.current?.click()}
          className='preview-btn upload-btn'
        >
          <Upload />
        </div>
        <input
          ref={fileInputRef}
          type='file'
          accept='.json'
          onChange={handleUpload}
          style={{ display: 'none' }}
        />
      </div>
    </div>
  );
}
