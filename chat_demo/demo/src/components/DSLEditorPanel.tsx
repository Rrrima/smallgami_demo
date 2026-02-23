/**
 * @file DSLEditorPanel.tsx
 * @description Side panel for inspecting and live-editing the full GameDSLConfig
 * JSON. Changes are pushed into the global game store so the running game
 * reloads with the new configuration.
 *
 * Key exports:
 *  - DSLEditorPanel: React component (default export)
 */

import { useState, useEffect } from 'react';
import {
  useGameStore,
  WorldConfig,
  PlayerConfig,
  PlayObjectConfig,
  SpawnConfig,
  ControlConfig,
  AssetConfig,
} from '@smallgami/engine';
import Editor from 'react-simple-code-editor';
import { highlight, languages } from 'prismjs';
import 'prismjs/components/prism-json';
import 'prismjs/themes/prism.css';
import '../styles/dsl-editor-panel.scss';
import { BookOpen } from 'lucide-react';
import {
  saveGameConfig,
  listConfigFiles,
  loadConfigFile,
  ConfigFileInfo,
} from '../api/gameApi';

type ConfigSection =
  | 'world'
  | 'player'
  | 'objects'
  | 'spawn'
  | 'controls'
  | 'assets';

export default function DSLEditorPanel() {
  const gameConfig = useGameStore(state => state.gameConfig);
  const gameName = useGameStore(state => state.gameName);
  const setWorldConfig = useGameStore(state => state.setWorldConfig);
  const setPlayerConfig = useGameStore(state => state.setPlayerConfig);
  const updateObjects = useGameStore(state => state.updateObjects);
  const updateSpawn = useGameStore(state => state.updateSpawn);
  const updateControls = useGameStore(state => state.updateControls);
  const updateAssets = useGameStore(state => state.updateAssets);

  const [activeSection, setActiveSection] = useState<ConfigSection>('world');
  const [sectionConfigs, setSectionConfigs] = useState({
    world: '',
    player: '',
    objects: '',
    spawn: '',
    controls: '',
    assets: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [saveFilename, setSaveFilename] = useState('');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [configFiles, setConfigFiles] = useState<ConfigFileInfo[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  // Initialize the editor with the game config sections whenever gameConfig changes
  useEffect(() => {
    if (gameConfig) {
      setSectionConfigs({
        world: JSON.stringify(gameConfig.world, null, 2),
        player: JSON.stringify(gameConfig.player, null, 2),
        objects: JSON.stringify(gameConfig.objects, null, 2),
        spawn: JSON.stringify(gameConfig.spawn, null, 2),
        controls: JSON.stringify(gameConfig.controls, null, 2),
        assets: JSON.stringify(gameConfig.assets, null, 2),
      });
    }
  }, [gameConfig]);

  const handleSectionConfigChange = (value: string) => {
    setSectionConfigs(prev => ({
      ...prev,
      [activeSection]: value,
    }));
  };

  // Handle Cmd+S / Ctrl+S to auto-apply
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd+S (Mac) or Ctrl+S (Windows/Linux)
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault(); // Prevent browser's default save dialog
        handleSectionRun();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup listener on unmount
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [sectionConfigs, activeSection]); // Re-bind when section configs or active section changes

  const handleSectionRun = () => {
    const configValue = sectionConfigs[activeSection];

    try {
      const parsedConfig = JSON.parse(configValue);
      console.log('Parsed config:', parsedConfig);

      switch (activeSection) {
        case 'world':
          setWorldConfig(parsedConfig as WorldConfig);
          break;
        case 'player':
          setPlayerConfig(parsedConfig as PlayerConfig);
          break;
        case 'objects':
          updateObjects(parsedConfig as PlayObjectConfig[]);
          break;
        case 'spawn':
          updateSpawn(parsedConfig as SpawnConfig[]);
          break;
        case 'controls':
          updateControls(parsedConfig as ControlConfig);
          break;
        case 'assets':
          updateAssets(parsedConfig as AssetConfig);
          break;
      }
    } catch (err) {
      console.error(`${activeSection} config error:`, err);
    }
  };

  const handleSectionReset = () => {
    if (gameConfig) {
      const originalConfig = {
        world: JSON.stringify(gameConfig.world, null, 2),
        player: JSON.stringify(gameConfig.player, null, 2),
        objects: JSON.stringify(gameConfig.objects, null, 2),
        spawn: JSON.stringify(gameConfig.spawn, null, 2),
        controls: JSON.stringify(gameConfig.controls, null, 2),
        assets: JSON.stringify(gameConfig.assets, null, 2),
      };

      setSectionConfigs(prev => ({
        ...prev,
        [activeSection]: originalConfig[activeSection],
      }));
    }
  };

  // Custom highlight function with line wrapping
  const highlightWithLineNumbers = (code: string) => {
    const highlighted = highlight(code, languages.json, 'json');
    const lines = highlighted.split('\n');
    return lines
      .map(line => `<span class="token-line">${line}</span>`)
      .join('\n');
  };

  const handleOpenDocs = () => {
    window.open('/docs.html', '_blank');
  };

  const handleSaveConfig = () => {
    if (!gameConfig || !gameName) {
      alert('No game configuration to save');
      return;
    }

    // Set default filename and show dialog
    const defaultFilename = gameName.trim().replace(/\s+/g, '_').toLowerCase();
    setSaveFilename(defaultFilename);
    setShowSaveDialog(true);
  };

  const handleSaveToServer = async () => {
    if (!gameConfig || !saveFilename) {
      alert('Please enter a filename');
      return;
    }

    try {
      setIsSaving(true);
      const response = await saveGameConfig(gameConfig, saveFilename);
      alert(
        `Game configuration saved to server config folder as ${response.filename}`
      );
      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error saving game config:', error);
      alert('Failed to save game configuration to server. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadLocal = () => {
    if (!gameConfig || !saveFilename) {
      alert('Please enter a filename');
      return;
    }

    try {
      // Create a blob with the game config JSON
      const jsonString = JSON.stringify(gameConfig, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${saveFilename}.json`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setShowSaveDialog(false);
    } catch (error) {
      console.error('Error downloading game config:', error);
      alert('Failed to download game configuration. Please try again.');
    }
  };

  const handleCancelSave = () => {
    setShowSaveDialog(false);
    setSaveFilename('');
  };

  const handleUploadClick = async () => {
    setShowUploadDialog(true);
    await loadConfigFileList();
  };

  const loadConfigFileList = async () => {
    try {
      setIsLoadingFiles(true);
      const response = await listConfigFiles();
      setConfigFiles(response.files);
    } catch (error) {
      console.error('Error loading config files:', error);
      // If server fails, just show empty list - user can still upload local file
      setConfigFiles([]);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  const handleLoadFromServer = async (filename: string) => {
    try {
      setIsLoadingConfig(true);
      const response = await loadConfigFile(filename);
      const config = response.config;

      // Validate that it's a valid game config structure
      if (!config.world || !config.player || !config.objects) {
        alert('Invalid game configuration file. Missing required sections.');
        return;
      }

      // Update all sections of the game config
      setWorldConfig(config.world);
      setPlayerConfig(config.player);
      updateObjects(config.objects);
      updateSpawn(config.spawn || []);
      updateControls(config.controls || {});
      updateAssets(config.assets || {});

      // Update the section configs display
      setSectionConfigs({
        world: JSON.stringify(config.world, null, 2),
        player: JSON.stringify(config.player, null, 2),
        objects: JSON.stringify(config.objects, null, 2),
        spawn: JSON.stringify(config.spawn || [], null, 2),
        controls: JSON.stringify(config.controls || {}, null, 2),
        assets: JSON.stringify(config.assets || {}, null, 2),
      });

      setShowUploadDialog(false);
      alert(`Configuration loaded from ${filename}`);
    } catch (error) {
      console.error('Error loading config from server:', error);
      alert('Failed to load configuration from server. Please try again.');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const handleUploadLocalFile = () => {
    // Create a file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        handleFileUpload(file);
      }
    };
    input.click();
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      const config = JSON.parse(text);

      // Validate that it's a valid game config structure
      if (!config.world || !config.player || !config.objects) {
        alert('Invalid game configuration file. Missing required sections.');
        return;
      }

      // Update all sections of the game config
      setWorldConfig(config.world);
      setPlayerConfig(config.player);
      updateObjects(config.objects);
      updateSpawn(config.spawn || []);
      updateControls(config.controls || {});
      updateAssets(config.assets || {});

      // Update the section configs display
      setSectionConfigs({
        world: JSON.stringify(config.world, null, 2),
        player: JSON.stringify(config.player, null, 2),
        objects: JSON.stringify(config.objects, null, 2),
        spawn: JSON.stringify(config.spawn || [], null, 2),
        controls: JSON.stringify(config.controls || {}, null, 2),
        assets: JSON.stringify(config.assets || {}, null, 2),
      });

      setShowUploadDialog(false);
      alert(`Configuration loaded from ${file.name}`);
    } catch (error) {
      console.error('Error loading config file:', error);
      alert(
        'Failed to load configuration file. Please ensure it is a valid JSON file.'
      );
    }
  };

  const handleCancelUpload = () => {
    setShowUploadDialog(false);
    setConfigFiles([]);
  };

  return (
    <>
      {/* Upload Dialog Modal */}
      {showUploadDialog && (
        <div className='save-dialog-overlay' onClick={handleCancelUpload}>
          <div
            className='save-dialog upload-dialog'
            onClick={e => e.stopPropagation()}
          >
            <h3>Load Game Configuration</h3>

            <div className='save-dialog-content'>
              <div className='upload-options'>
                <button
                  className='upload-option-btn'
                  onClick={handleUploadLocalFile}
                >
                  Upload Local File
                </button>
              </div>

              <div className='config-files-section'>
                <label>Or select from server config folder:</label>
                {isLoadingFiles ? (
                  <div className='loading-message'>Loading config files...</div>
                ) : configFiles.length === 0 ? (
                  <div className='no-files-message'>
                    No config files found in server folder
                  </div>
                ) : (
                  <div className='config-files-list'>
                    {configFiles.map(file => (
                      <button
                        key={file.filename}
                        className='config-file-item'
                        onClick={() => handleLoadFromServer(file.filename)}
                        disabled={isLoadingConfig}
                      >
                        <div className='file-info'>
                          <div className='file-name'>{file.filename}</div>
                          <div className='file-meta'>
                            {(file.size / 1024).toFixed(1)} KB • {file.modified}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className='save-dialog-actions'>
              <button
                className='dialog-btn cancel'
                onClick={handleCancelUpload}
                disabled={isLoadingConfig}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog Modal */}
      {showSaveDialog && (
        <div className='save-dialog-overlay' onClick={handleCancelSave}>
          <div className='save-dialog' onClick={e => e.stopPropagation()}>
            <h3>Save Game Configuration</h3>

            <div className='save-dialog-content'>
              <label htmlFor='filename-input'>Filename:</label>
              <div className='filename-input-group'>
                <input
                  id='filename-input'
                  type='text'
                  value={saveFilename}
                  onChange={e => setSaveFilename(e.target.value)}
                  placeholder='Enter filename...'
                  autoFocus
                />
                <span className='file-extension'>.json</span>
              </div>

              <div className='save-location-info'>
                <p>
                  <strong>Server Config Folder:</strong> demo/src/config/
                </p>
                <p>
                  <strong>Local Download:</strong> Your browser's download
                  folder
                </p>
              </div>
            </div>

            <div className='save-dialog-actions'>
              <button
                className='dialog-btn cancel'
                onClick={handleCancelSave}
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                className='dialog-btn secondary'
                onClick={handleDownloadLocal}
                disabled={isSaving || !saveFilename.trim()}
              >
                Download Local
              </button>
              <button
                className='dialog-btn primary'
                onClick={handleSaveToServer}
                disabled={isSaving || !saveFilename.trim()}
              >
                {isSaving ? 'Saving...' : 'Save to Server'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className='dsl-editor-panel'>
        <div className='dsl-header'>
          <div className='dsl-header-title'>
            <span className='game-name'>
              {gameName?.replace(/_/g, ' ') || 'Game'}
            </span>{' '}
            <span className='game-id'>Specification</span>
          </div>
          <button
            className='docs-btn'
            onClick={handleOpenDocs}
            title='Open DSL Reference Documentation'
          >
            <BookOpen size={16} />
          </button>
        </div>

        {/* Section Tabs */}
        <div className='dsl-tabs'>
          {(
            [
              'world',
              'player',
              'objects',
              'spawn',
              'controls',
              'assets',
            ] as ConfigSection[]
          ).map(section => (
            <button
              key={section}
              className={`dsl-tab ${activeSection === section ? 'active' : ''}`}
              onClick={() => setActiveSection(section)}
            >
              {section.charAt(0).toUpperCase() + section.slice(1)}
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className='dsl-content'>
          <Editor
            value={sectionConfigs[activeSection]}
            onValueChange={handleSectionConfigChange}
            highlight={highlightWithLineNumbers}
            padding={0}
            placeholder={`Enter ${activeSection} configuration in JSON format...`}
            className='dsl-code-editor'
            textareaClassName='dsl-textarea'
            preClassName='dsl-pre'
          />
        </div>

        <div className='dsl-actions'>
          <button className='dsl-btn secondary' onClick={handleUploadClick}>
            Upload
          </button>
          <button
            className='dsl-btn secondary'
            onClick={handleSaveConfig}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </button>
          <button className='dsl-btn primary' onClick={handleSectionRun}>
            Apply{' '}
            <span style={{ fontSize: '10px', color: '#555' }}>(cmd+s)</span>
          </button>
        </div>
      </div>
    </>
  );
}
