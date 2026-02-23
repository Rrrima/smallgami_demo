/**
 * @file StickyBlock.tsx
 * @description Pure presentational component for a single sticky-block card.
 * Renders the card frame, header (title + optional object counter), content slot,
 * navigation arrows (object type only), and hover action buttons.
 *
 * Key exports:
 *  - StickyBlock: card wrapper; receives content as `children`
 */

import React from 'react';
import { Upload, LockOpen, Lock, Sparkles, Pencil, ChevronLeft, ChevronRight } from 'lucide-react';

export interface StickyBlockProps {
  /** Unique block identifier (e.g. 'player', 'world', 'object', 'mechanism') */
  id: string;
  /** Display label shown in the card header */
  label: string;
  /** Whether the block content is locked from editing */
  isLocked: boolean;
  /** Whether the block is currently generating (shows overlay) */
  isGenerating: boolean;
  /** Whether the cursor is over this block */
  isHovered: boolean;
  /** Whether the block is currently being edited (hides action buttons) */
  isEditing: boolean;
  /** Whether this block is highlighted by the narrative hover */
  isNarrativeHighlighted: boolean;

  // --- Container event handlers ---
  onDoubleClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;

  // --- Action button handlers (shown on hover) ---
  onUpload: (e: React.MouseEvent) => void;
  onDraw: (e: React.MouseEvent) => void;
  onLock: (e: React.MouseEvent) => void;
  onAI: (e: React.MouseEvent) => void;

  // --- Object navigation (only for 'object' block with multiple objects) ---
  objectCount?: number;
  currentObjectIndex?: number;
  onPreviousObject?: (e: React.MouseEvent) => void;
  onNextObject?: (e: React.MouseEvent) => void;

  /** Content to render inside the card body */
  children: React.ReactNode;
}

export default function StickyBlock({
  id,
  label,
  isLocked,
  isGenerating,
  isHovered,
  isEditing,
  isNarrativeHighlighted,
  onDoubleClick,
  onMouseEnter,
  onMouseLeave,
  onUpload,
  onDraw,
  onLock,
  onAI,
  objectCount,
  currentObjectIndex,
  onPreviousObject,
  onNextObject,
  children,
}: StickyBlockProps) {
  const showObjectNav =
    id === 'object' && objectCount !== undefined && objectCount > 1;

  return (
    <div
      className={[
        'sticky-block',
        isLocked ? 'locked' : '',
        isGenerating ? 'generating' : '',
        isNarrativeHighlighted ? 'narrative-highlighted' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDoubleClick={onDoubleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Generating overlay */}
      {isGenerating && <div className='generating-overlay' />}

      {/* Card header */}
      <div className='sticky-block-title'>
        {label}
        {showObjectNav && currentObjectIndex !== undefined && (
          <span className='object-counter'>
            {currentObjectIndex + 1}/{objectCount}
          </span>
        )}
      </div>

      {/* Content slot */}
      <div className='sticky-block-content-wrapper'>{children}</div>

      {/* Object navigation arrows */}
      {showObjectNav && onPreviousObject && onNextObject && (
        <div className='sticky-block-navigation'>
          <button
            className='nav-btn nav-btn-left'
            onClick={onPreviousObject}
            title='Previous object'
          >
            <ChevronLeft size={16} />
          </button>
          <button
            className='nav-btn nav-btn-right'
            onClick={onNextObject}
            title='Next object'
          >
            <ChevronRight size={16} />
          </button>
        </div>
      )}

      {/* Hover action buttons */}
      {isHovered && !isEditing && (
        <div className='sticky-block-actions'>
          <div
            className='action-btn'
            onClick={onUpload}
            title='Upload'
          >
            <Upload size={12} />
          </div>
          <div
            className='action-btn'
            onClick={onDraw}
            title='Draw'
          >
            <Pencil size={12} />
          </div>
          <div
            className={`action-btn ${isLocked ? 'active' : ''}`}
            onClick={onLock}
            title={isLocked ? 'Unlock' : 'Lock'}
          >
            {isLocked ? <Lock size={12} /> : <LockOpen size={12} />}
          </div>
          <div
            className='action-btn'
            onClick={onAI}
            title='AI Generate'
          >
            <Sparkles size={12} />
          </div>
        </div>
      )}
    </div>
  );
}
