'use client'

import React from 'react'
import type { DrawingTool } from './StrategyCanvas'

// ---------------------------------------------------------------------------
// Preset colors
// ---------------------------------------------------------------------------

const PRESET_COLORS = [
  { label: 'Blue', value: '#1E90FF' },
  { label: 'Red', value: '#FF4444' },
  { label: 'Yellow', value: '#FFD700' },
  { label: 'Green', value: '#22C55E' },
  { label: 'White', value: '#FFFFFF' },
]

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid extra deps)
// ---------------------------------------------------------------------------

function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <line x1="5" y1="19" x2="19" y2="5" />
      <polyline points="9 5 19 5 19 15" />
    </svg>
  )
}

function BrawlerIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function ZoneIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <circle cx="12" cy="12" r="8" strokeDasharray="4 2" />
    </svg>
  )
}

function UndoIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M3 10h10a5 5 0 0 1 0 10H7" />
      <polyline points="3 6 3 10 7 10" />
    </svg>
  )
}

function SelectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-5 h-5">
      <path d="M5 3l14 9-7 1-4 6z" />
    </svg>
  )
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ToolbarProps {
  activeTool: DrawingTool
  activeColor: string
  onToolChange: (tool: DrawingTool) => void
  onColorChange: (color: string) => void
  onUndo: () => void
  canUndo: boolean
}

// ---------------------------------------------------------------------------
// Tool button
// ---------------------------------------------------------------------------

function ToolBtn({
  active,
  onClick,
  title,
  children,
  disabled,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
  disabled?: boolean
}) {
  return (
    <button
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex items-center justify-center w-10 h-10 rounded-lg transition-colors',
        active
          ? 'bg-brand-yellow text-black shadow-lg shadow-yellow-900/30'
          : 'text-gray-400 hover:bg-[#21262D] hover:text-white',
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer',
      ].join(' ')}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function Toolbar({
  activeTool,
  activeColor,
  onToolChange,
  onColorChange,
  onUndo,
  canUndo,
}: ToolbarProps) {
  return (
    <>
      {/* Desktop: vertical left sidebar */}
      <aside className="hidden md:flex flex-col items-center gap-2 py-3 px-2 bg-[#161B22] border border-gray-700 rounded-xl h-fit">
        <ToolBtn active={activeTool === 'select'} onClick={() => onToolChange('select')} title="Select / Pan">
          <SelectIcon />
        </ToolBtn>

        <div className="w-6 border-t border-gray-700 my-1" />

        <ToolBtn active={activeTool === 'arrow'} onClick={() => onToolChange('arrow')} title="Draw Arrow">
          <ArrowIcon />
        </ToolBtn>
        <ToolBtn active={activeTool === 'brawler'} onClick={() => onToolChange('brawler')} title="Place Brawler">
          <BrawlerIcon />
        </ToolBtn>
        <ToolBtn active={activeTool === 'zone'} onClick={() => onToolChange('zone')} title="Draw Zone">
          <ZoneIcon />
        </ToolBtn>

        <div className="w-6 border-t border-gray-700 my-1" />

        {/* Color swatches */}
        <div className="flex flex-col items-center gap-1.5">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => onColorChange(c.value)}
              className={[
                'w-6 h-6 rounded-full transition-transform border-2',
                activeColor === c.value
                  ? 'scale-125 border-white'
                  : 'border-transparent hover:scale-110',
              ].join(' ')}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <div className="w-6 border-t border-gray-700 my-1" />

        <ToolBtn disabled={!canUndo} onClick={onUndo} title="Undo">
          <UndoIcon />
        </ToolBtn>
      </aside>

      {/* Mobile: horizontal bottom bar */}
      <nav className="flex md:hidden items-center justify-around px-2 py-2 bg-[#161B22] border-t border-gray-700 w-full">
        <ToolBtn active={activeTool === 'select'} onClick={() => onToolChange('select')} title="Select">
          <SelectIcon />
        </ToolBtn>
        <ToolBtn active={activeTool === 'arrow'} onClick={() => onToolChange('arrow')} title="Arrow">
          <ArrowIcon />
        </ToolBtn>
        <ToolBtn active={activeTool === 'brawler'} onClick={() => onToolChange('brawler')} title="Brawler">
          <BrawlerIcon />
        </ToolBtn>
        <ToolBtn active={activeTool === 'zone'} onClick={() => onToolChange('zone')} title="Zone">
          <ZoneIcon />
        </ToolBtn>

        {/* Inline color row on mobile */}
        <div className="flex items-center gap-1.5 px-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c.value}
              title={c.label}
              onClick={() => onColorChange(c.value)}
              className={[
                'w-5 h-5 rounded-full border-2 transition-transform',
                activeColor === c.value
                  ? 'scale-125 border-white'
                  : 'border-transparent',
              ].join(' ')}
              style={{ backgroundColor: c.value }}
            />
          ))}
        </div>

        <ToolBtn disabled={!canUndo} onClick={onUndo} title="Undo">
          <UndoIcon />
        </ToolBtn>
      </nav>
    </>
  )
}
