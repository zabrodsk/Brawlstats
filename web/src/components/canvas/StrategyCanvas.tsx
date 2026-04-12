'use client'

import React, {
  useRef,
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react'
import { flushSync } from 'react-dom'
import {
  Stage,
  Layer,
  Image as KonvaImage,
  Arrow,
  Circle,
  Ring,
  Rect,
  Text,
} from 'react-konva'
import useImage from 'use-image'
import type Konva from 'konva'
import type {
  StrategyElement,
  BrawlerElement,
  ArrowElement,
  ZoneElement,
} from '@/types/strategy'
import { getMapImageURL } from '@/types/map'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REFERENCE_WIDTH = 1080
const REFERENCE_HEIGHT = 1920
const MIN_SCALE = 0.2
const MAX_SCALE = 5

// ---------------------------------------------------------------------------
// Sub-component: MapBackground
// ---------------------------------------------------------------------------

function MapBackground({
  mapId,
  width,
  height,
}: {
  mapId: string
  width: number
  height: number
}) {
  const url = useMemo(() => getMapImageURL(mapId), [mapId])
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [failed, setFailed] = useState(false)
  const imageLayout = useMemo(() => {
    if (!image) return null
    const sourceWidth = image.naturalWidth || image.width
    const sourceHeight = image.naturalHeight || image.height
    if (sourceWidth === 0 || sourceHeight === 0) return null

    // Keep map image aspect ratio to avoid stretch/squish in the canvas frame.
    const scale = Math.min(width / sourceWidth, height / sourceHeight)
    const drawWidth = sourceWidth * scale
    const drawHeight = sourceHeight * scale

    return {
      x: (width - drawWidth) / 2,
      y: (height - drawHeight) / 2,
      width: drawWidth,
      height: drawHeight,
    }
  }, [height, image, width])

  // Load outside `use-image`: that helper calls `img.decode()` after load. On some Safari
  // builds the decode Promise can stall, so `loaded` never fires and the map never appears.
  useEffect(() => {
    let cancelled = false
    setImage(null)
    setFailed(false)

    const load = (crossOrigin: 'anonymous' | undefined) => {
      const img = new window.Image()
      if (crossOrigin) img.crossOrigin = crossOrigin
      img.onload = () => {
        if (cancelled) return
        setFailed(false)
        setImage(img)
      }
      img.onerror = () => {
        if (cancelled) return
        if (crossOrigin) {
          load(undefined)
        } else {
          setImage(null)
          setFailed(true)
        }
      }
      img.src = url
    }

    load('anonymous')
    return () => {
      cancelled = true
    }
  }, [url])

  return (
    <>
      <Rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="#0D1117"
        listening={false}
      />
      {image && imageLayout && (
        <KonvaImage
          key={url}
          image={image}
          x={imageLayout.x}
          y={imageLayout.y}
          width={imageLayout.width}
          height={imageLayout.height}
          listening={false}
        />
      )}
      {failed && (
        <Text
          text="Map image unavailable"
          x={0}
          y={height / 2 - 10}
          width={width}
          align="center"
          fill="#8B949E"
          fontSize={24}
          listening={false}
        />
      )}
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: BrawlerNode
// ---------------------------------------------------------------------------

function BrawlerNode({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  element: BrawlerElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const url = `https://cdn.brawlify.com/brawlers/borderless/${element.brawlerId}.png`
  const [image] = useImage(url, 'anonymous')
  const SIZE = 80
  const HALF = SIZE / 2
  const teamColor = element.team === 'blue' ? '#1E90FF' : '#FF4444'

  return (
    <>
      {/* Team color ring */}
      <Ring
        x={element.position.x}
        y={element.position.y}
        innerRadius={HALF + 2}
        outerRadius={HALF + 8}
        fill={teamColor}
        listening={false}
      />
      {/* Selection ring */}
      {isSelected && (
        <Ring
          x={element.position.x}
          y={element.position.y}
          innerRadius={HALF + 10}
          outerRadius={HALF + 16}
          fill="#FFD700"
          listening={false}
        />
      )}
      <KonvaImage
        image={image}
        x={element.position.x - HALF}
        y={element.position.y - HALF}
        width={SIZE}
        height={SIZE}
        draggable
        onClick={() => onSelect(element.id)}
        onTap={() => onSelect(element.id)}
        onDragEnd={(e) => {
          onDragEnd(element.id, e.target.x() + HALF, e.target.y() + HALF)
        }}
      />
    </>
  )
}

// ---------------------------------------------------------------------------
// Sub-component: ArrowNode
// ---------------------------------------------------------------------------

function ArrowNode({
  element,
  isSelected,
  onSelect,
}: {
  element: ArrowElement
  isSelected: boolean
  onSelect: (id: string) => void
}) {
  return (
    <Arrow
      points={[
        element.from.x,
        element.from.y,
        element.to.x,
        element.to.y,
      ]}
      stroke={element.color}
      strokeWidth={element.strokeWidth}
      fill={element.color}
      pointerLength={16}
      pointerWidth={14}
      tension={0}
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      shadowColor={isSelected ? '#FFD700' : undefined}
      shadowBlur={isSelected ? 12 : 0}
      shadowEnabled={isSelected}
    />
  )
}

// ---------------------------------------------------------------------------
// Sub-component: ZoneNode
// ---------------------------------------------------------------------------

function ZoneNode({
  element,
  isSelected,
  onSelect,
  onDragEnd,
}: {
  element: ZoneElement
  isSelected: boolean
  onSelect: (id: string) => void
  onDragEnd: (id: string, x: number, y: number) => void
}) {
  const radius = Math.max(element.width, element.height) / 2
  return (
    <Circle
      x={element.position.x}
      y={element.position.y}
      radius={radius}
      fill={element.color}
      opacity={element.opacity}
      stroke={isSelected ? '#FFD700' : element.color}
      strokeWidth={isSelected ? 3 : 2}
      draggable
      onClick={() => onSelect(element.id)}
      onTap={() => onSelect(element.id)}
      onDragEnd={(e) => onDragEnd(element.id, e.target.x(), e.target.y())}
    />
  )
}

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export type DrawingTool = 'select' | 'arrow' | 'brawler' | 'zone'

export interface StrategyCanvasProps {
  mapId: string
  elements: StrategyElement[]
  activeTool: DrawingTool
  activeColor: string
  onElementsChange: (elements: StrategyElement[]) => void
}

export interface StrategyCanvasHandle {
  exportPNG: () => string | null
  getStageScale: () => number
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const StrategyCanvas = forwardRef<StrategyCanvasHandle, StrategyCanvasProps>(
  function StrategyCanvas(
    { mapId, elements, activeTool, activeColor, onElementsChange },
    ref
  ) {
    const containerRef = useRef<HTMLDivElement>(null)
    const stageRef = useRef<Konva.Stage>(null)

    // Canvas display dimensions (full container — map uses contain scale inside)
    const [canvasSize, setCanvasSize] = useState({ width: 400, height: 711 })

    const baseScale = useMemo(
      () =>
        Math.min(
          canvasSize.width / REFERENCE_WIDTH,
          canvasSize.height / REFERENCE_HEIGHT
        ),
      [canvasSize.width, canvasSize.height]
    )

    // Stage pan offset (screen px) and user zoom multiplier on top of baseScale
    const [stagePos, setStagePos] = useState({ x: 0, y: 0 })
    const [stageScale, setStageScale] = useState(1)

    const pinchRef = useRef<{
      startDist: number
      startStageScale: number
      startStagePos: { x: number; y: number }
      focal: { x: number; y: number }
    } | null>(null)

    const stagePosRef = useRef(stagePos)
    const stageScaleRef = useRef(stageScale)
    useEffect(() => {
      stagePosRef.current = stagePos
    }, [stagePos])
    useEffect(() => {
      stageScaleRef.current = stageScale
    }, [stageScale])

    // Selection
    const [selectedId, setSelectedId] = useState<string | null>(null)

    // In-progress drawing state
    const [drawingArrow, setDrawingArrow] = useState<{
      from: { x: number; y: number }
      current: { x: number; y: number }
    } | null>(null)

    const [drawingZone, setDrawingZone] = useState<{
      center: { x: number; y: number }
      radius: number
    } | null>(null)

    // ---------------------------------------------------------------------------
    // Resize observer
    // ---------------------------------------------------------------------------

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const measure = () => {
        const w = container.clientWidth
        const h = container.clientHeight
        if (w === 0 || h === 0) return
        setCanvasSize({ width: Math.floor(w), height: Math.floor(h) })
      }

      measure()
      const ro = new ResizeObserver(measure)
      ro.observe(container)
      return () => ro.disconnect()
    }, [])

    // ---------------------------------------------------------------------------
    // Fit entire map in view (contain) when container size or map changes
    // ---------------------------------------------------------------------------

    useEffect(() => {
      if (canvasSize.width === 0 || canvasSize.height === 0) return
      const bs = Math.min(
        canvasSize.width / REFERENCE_WIDTH,
        canvasSize.height / REFERENCE_HEIGHT
      )
      setStageScale(1)
      const total = bs * 1
      setStagePos({
        x: (canvasSize.width - REFERENCE_WIDTH * total) / 2,
        y: (canvasSize.height - REFERENCE_HEIGHT * total) / 2,
      })
    }, [canvasSize.width, canvasSize.height, mapId])

    // ---------------------------------------------------------------------------
    // Keyboard: delete selected element
    // ---------------------------------------------------------------------------

    useEffect(() => {
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (selectedId) {
            onElementsChange(elements.filter((el) => el.id !== selectedId))
            setSelectedId(null)
          }
        }
      }
      window.addEventListener('keydown', handleKey)
      return () => window.removeEventListener('keydown', handleKey)
    }, [selectedId, elements, onElementsChange])

    // ---------------------------------------------------------------------------
    // Imperative handle
    // ---------------------------------------------------------------------------

    useImperativeHandle(ref, () => ({
      exportPNG: () => {
        const stage = stageRef.current
        if (!stage) return null

        // Hide selection decorations for a clean export.
        flushSync(() => setSelectedId(null))

        const old = {
          width: stage.width(),
          height: stage.height(),
          scaleX: stage.scaleX(),
          scaleY: stage.scaleY(),
          x: stage.x(),
          y: stage.y(),
        }

        // Full reference frame (same coordinate space as map / drawings).
        stage.width(REFERENCE_WIDTH)
        stage.height(REFERENCE_HEIGHT)
        stage.scale({ x: 1, y: 1 })
        stage.position({ x: 0, y: 0 })
        stage.batchDraw()

        const dataURL = stage.toDataURL({
          mimeType: 'image/png',
          pixelRatio: 2,
        })

        stage.width(old.width)
        stage.height(old.height)
        stage.scale({ x: old.scaleX, y: old.scaleY })
        stage.position({ x: old.x, y: old.y })
        stage.batchDraw()

        return dataURL
      },
      getStageScale: () => stageScale,
    }))

    // ---------------------------------------------------------------------------
    // Coordinate helpers
    // ---------------------------------------------------------------------------

    // Convert stage pointer position → reference coordinate space
    const pointerToRef = useCallback(
      (stagePointerPos: { x: number; y: number }) => {
        const total = baseScale * stageScale
        return {
          x: (stagePointerPos.x - stagePos.x) / total,
          y: (stagePointerPos.y - stagePos.y) / total,
        }
      },
      [stagePos, baseScale, stageScale]
    )

    // ---------------------------------------------------------------------------
    // Stage event handlers
    // ---------------------------------------------------------------------------

    const handleWheel = useCallback(
      (e: Konva.KonvaEventObject<WheelEvent>) => {
        e.evt.preventDefault()
        const stage = stageRef.current
        if (!stage) return

        const scaleBy = 1.08
        const oldUserScale = stageScale
        const pointer = stage.getPointerPosition()
        if (!pointer) return

        const newUserScale = e.evt.deltaY < 0
          ? Math.min(oldUserScale * scaleBy, MAX_SCALE)
          : Math.max(oldUserScale / scaleBy, MIN_SCALE)

        const oldTotal = baseScale * oldUserScale
        const newTotal = baseScale * newUserScale
        const mousePointTo = {
          x: (pointer.x - stagePos.x) / oldTotal,
          y: (pointer.y - stagePos.y) / oldTotal,
        }

        setStageScale(newUserScale)
        setStagePos({
          x: pointer.x - mousePointTo.x * newTotal,
          y: pointer.y - mousePointTo.y * newTotal,
        })
      },
      [stageScale, stagePos, baseScale]
    )

    const handleMouseDown = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        // Deselect when clicking on stage background
        if (e.target === e.target.getStage()) {
          setSelectedId(null)
        }

        if (activeTool === 'arrow' || activeTool === 'zone') {
          const stage = stageRef.current
          if (!stage) return
          const pos = stage.getPointerPosition()
          if (!pos) return
          const refPos = pointerToRef(pos)

          if (activeTool === 'arrow') {
            setDrawingArrow({ from: refPos, current: refPos })
          } else {
            setDrawingZone({ center: refPos, radius: 0 })
          }
        }
      },
      [activeTool, pointerToRef]
    )

    const handleMouseMove = useCallback(
      (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!drawingArrow && !drawingZone) return
        const stage = stageRef.current
        if (!stage) return
        const pos = stage.getPointerPosition()
        if (!pos) return
        const refPos = pointerToRef(pos)

        if (drawingArrow) {
          setDrawingArrow((prev) => prev ? { ...prev, current: refPos } : null)
        }
        if (drawingZone) {
          const dx = refPos.x - drawingZone.center.x
          const dy = refPos.y - drawingZone.center.y
          setDrawingZone((prev) =>
            prev ? { ...prev, radius: Math.sqrt(dx * dx + dy * dy) } : null
          )
        }
      },
      [drawingArrow, drawingZone, pointerToRef]
    )

    const handleMouseUp = useCallback(() => {
      if (drawingArrow) {
        const dx = drawingArrow.current.x - drawingArrow.from.x
        const dy = drawingArrow.current.y - drawingArrow.from.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist > 10) {
          const newArrow: ArrowElement = {
            type: 'arrow',
            id: `arrow-${Date.now()}`,
            from: drawingArrow.from,
            to: drawingArrow.current,
            color: activeColor,
            strokeWidth: 5,
          }
          onElementsChange([...elements, newArrow])
        }
        setDrawingArrow(null)
      }

      if (drawingZone) {
        if (drawingZone.radius > 10) {
          const newZone: ZoneElement = {
            type: 'zone',
            id: `zone-${Date.now()}`,
            position: drawingZone.center,
            width: drawingZone.radius * 2,
            height: drawingZone.radius * 2,
            color: activeColor,
            opacity: 0.3,
          }
          onElementsChange([...elements, newZone])
        }
        setDrawingZone(null)
      }
    }, [drawingArrow, drawingZone, activeColor, elements, onElementsChange])

    const touchDistance = (t0: Touch, t1: Touch) => {
      const dx = t1.clientX - t0.clientX
      const dy = t1.clientY - t0.clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const touchCenterInStage = (
      e: Konva.KonvaEventObject<TouchEvent>
    ): { x: number; y: number } | null => {
      const stage = stageRef.current
      const t = e.evt.touches
      if (!stage || t.length < 2) return null
      const rect = stage.container().getBoundingClientRect()
      const x = (t[0].clientX + t[1].clientX) / 2 - rect.left
      const y = (t[0].clientY + t[1].clientY) / 2 - rect.top
      return { x, y }
    }

    const handleTouchStart = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const t = e.evt.touches
      if (
        activeTool === 'select' &&
        t.length >= 2
      ) {
        const d = touchDistance(t[0], t[1])
        if (d < 8) return
        const focal = touchCenterInStage(e)
        if (!focal) return
        pinchRef.current = {
          startDist: d,
          startStageScale: stageScaleRef.current,
          startStagePos: { ...stagePosRef.current },
          focal,
        }
        return
      }
      handleMouseDown(e as unknown as Konva.KonvaEventObject<MouseEvent>)
    }

    const handleTouchMove = (e: Konva.KonvaEventObject<TouchEvent>) => {
      const t = e.evt.touches
      const pinching = pinchRef.current
      if (pinching && activeTool === 'select' && t.length >= 2) {
        e.evt.preventDefault()
        const d = touchDistance(t[0], t[1])
        if (d < 1) return
        const factor = d / pinching.startDist
        const newUserScale = Math.min(
          Math.max(pinching.startStageScale * factor, MIN_SCALE),
          MAX_SCALE
        )
        const oldTotal = baseScale * pinching.startStageScale
        const newTotal = baseScale * newUserScale
        const mx =
          (pinching.focal.x - pinching.startStagePos.x) / oldTotal
        const my =
          (pinching.focal.y - pinching.startStagePos.y) / oldTotal
        setStageScale(newUserScale)
        setStagePos({
          x: pinching.focal.x - mx * newTotal,
          y: pinching.focal.y - my * newTotal,
        })
        return
      }
      handleMouseMove(e as unknown as Konva.KonvaEventObject<MouseEvent>)
    }

    const handleTouchEnd = (e: Konva.KonvaEventObject<TouchEvent>) => {
      if (e.evt.touches.length < 2) {
        pinchRef.current = null
      }
      handleMouseUp()
    }

    // ---------------------------------------------------------------------------
    // Element mutation helpers
    // ---------------------------------------------------------------------------

    const handleBrawlerDragEnd = (id: string, x: number, y: number) => {
      onElementsChange(
        elements.map((el) =>
          el.id === id && el.type === 'brawler'
            ? { ...el, position: { x, y } }
            : el
        )
      )
    }

    const handleZoneDragEnd = (id: string, x: number, y: number) => {
      onElementsChange(
        elements.map((el) =>
          el.id === id && el.type === 'zone'
            ? { ...el, position: { x, y } }
            : el
        )
      )
    }

    const handleSelect = (id: string) => setSelectedId(id)

    // ---------------------------------------------------------------------------
    // Determine stage cursor
    // ---------------------------------------------------------------------------

    const cursor =
      activeTool === 'arrow'
        ? 'crosshair'
        : activeTool === 'zone'
        ? 'crosshair'
        : activeTool === 'select'
        ? 'default'
        : 'default'

    // ---------------------------------------------------------------------------
    // Render
    // ---------------------------------------------------------------------------

    const totalScale = baseScale * stageScale

    return (
      <div
        ref={containerRef}
        className="relative h-full min-h-0 w-full overflow-hidden bg-[#0D1117] rounded-lg"
        style={{ cursor }}
      >
        <Stage
          ref={stageRef}
          width={canvasSize.width}
          height={canvasSize.height}
          scaleX={totalScale}
          scaleY={totalScale}
          x={stagePos.x}
          y={stagePos.y}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          draggable={activeTool === 'select'}
          onDragEnd={(e) => {
            setStagePos({ x: e.target.x(), y: e.target.y() })
          }}
        >
          <Layer>
            {/* Map background */}
            <MapBackground
              mapId={mapId}
              width={REFERENCE_WIDTH}
              height={REFERENCE_HEIGHT}
            />

            {/* Strategy elements */}
            {elements.map((el) => {
              if (el.type === 'arrow') {
                return (
                  <ArrowNode
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onSelect={handleSelect}
                  />
                )
              }
              if (el.type === 'zone') {
                return (
                  <ZoneNode
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onSelect={handleSelect}
                    onDragEnd={handleZoneDragEnd}
                  />
                )
              }
              if (el.type === 'brawler') {
                return (
                  <BrawlerNode
                    key={el.id}
                    element={el}
                    isSelected={selectedId === el.id}
                    onSelect={handleSelect}
                    onDragEnd={handleBrawlerDragEnd}
                  />
                )
              }
              return null
            })}

            {/* In-progress arrow preview */}
            {drawingArrow && (
              <Arrow
                points={[
                  drawingArrow.from.x,
                  drawingArrow.from.y,
                  drawingArrow.current.x,
                  drawingArrow.current.y,
                ]}
                stroke={activeColor}
                strokeWidth={5}
                fill={activeColor}
                pointerLength={16}
                pointerWidth={14}
                opacity={0.7}
                listening={false}
              />
            )}

            {/* In-progress zone preview */}
            {drawingZone && drawingZone.radius > 0 && (
              <Circle
                x={drawingZone.center.x}
                y={drawingZone.center.y}
                radius={drawingZone.radius}
                fill={activeColor}
                opacity={0.3}
                stroke={activeColor}
                strokeWidth={2}
                listening={false}
              />
            )}
          </Layer>
        </Stage>
      </div>
    )
  }
)

export default StrategyCanvas
