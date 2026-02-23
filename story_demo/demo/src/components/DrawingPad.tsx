/**
 * @file DrawingPad.tsx
 * @description Modal canvas drawing pad. Lets the user sketch a reference image
 * that is exported as a base64 PNG and handed back to the parent via onSave.
 * Supports undo, erase, and stroke color.
 *
 * Key exports:
 *  - DrawingPad: React component (default export)
 */

import { useState, useRef, useEffect } from 'react';
import { Eraser, Undo, Check, X } from 'lucide-react';
import './DrawingPad.scss';

interface DrawingPadProps {
  isOpen: boolean;
  blockId: string | null;
  onClose: () => void;
  onSave: (base64: string, blockId: string) => Promise<void>;
}

export default function DrawingPad({
  isOpen,
  blockId,
  onClose,
  onSave,
}: DrawingPadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawingHistory, setDrawingHistory] = useState<ImageData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = 600;
    canvas.height = 400;

    // Fill with white background
    ctx.fillStyle = '#fef9f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set drawing style
    ctx.strokeStyle = '#2c2c2c';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Save initial state
    setDrawingHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(false);
    ctx.closePath();

    // Save state for undo
    setDrawingHistory(prev => [
      ...prev,
      ctx.getImageData(0, 0, canvas.width, canvas.height),
    ]);
  };

  const handleUndo = () => {
    if (drawingHistory.length <= 1) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const newHistory = [...drawingHistory];
    newHistory.pop(); // Remove current state
    setDrawingHistory(newHistory);

    // Restore previous state
    const previousState = newHistory[newHistory.length - 1];
    ctx.putImageData(previousState, 0, 0);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#fef9f3';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Save cleared state
    setDrawingHistory([ctx.getImageData(0, 0, canvas.width, canvas.height)]);
  };

  const handleSaveDrawing = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !blockId) return;

    setIsSaving(true);

    // Convert canvas to base64
    const base64 = canvas.toDataURL('image/png');

    // Close modal immediately before generation starts
    onClose();

    // Call the save callback (generation happens in background)
    try {
      await onSave(base64, blockId);
    } catch (error) {
      console.error('Error saving drawing:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClose = () => {
    if (isSaving) return; // Prevent closing while saving
    onClose();
  };

  // Initialize canvas when modal opens and clean up when closed
  useEffect(() => {
    if (isOpen && canvasRef.current) {
      initializeCanvas();
    } else if (!isOpen) {
      // Reset state when modal closes
      setDrawingHistory([]);
      setIsDrawing(false);
    }
  }, [isOpen]);

  if (!isOpen || !blockId) return null;

  return (
    <div className='drawing-modal-overlay' onClick={handleClose}>
      <div className='drawing-modal' onClick={e => e.stopPropagation()}>
        <div className='drawing-modal-header'>
          <h3 className='handwriting'>Draw your {blockId}</h3>
          <button
            className='close-btn'
            onClick={handleClose}
            disabled={isSaving}
            title='Close'
          >
            <X size={20} />
          </button>
        </div>
        <div className='drawing-canvas-wrapper'>
          <canvas
            ref={canvasRef}
            className='drawing-canvas'
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
        <div className='drawing-modal-actions'>
          <button
            className='drawing-btn'
            onClick={handleUndo}
            disabled={drawingHistory.length <= 1 || isSaving}
            title='Undo'
          >
            <Undo size={16} />
            <span>Undo</span>
          </button>
          <button
            className='drawing-btn'
            onClick={handleClearCanvas}
            disabled={isSaving}
            title='Clear'
          >
            <Eraser size={16} />
            <span>Clear</span>
          </button>
          <button
            className='drawing-btn primary'
            onClick={handleSaveDrawing}
            disabled={isSaving}
            title='Save & Generate'
          >
            <Check size={16} />
            <span>{isSaving ? 'Saving...' : 'Save & Generate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
