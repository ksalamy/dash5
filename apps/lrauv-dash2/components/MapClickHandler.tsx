import React, { useEffect, useRef } from 'react'
import { useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import toast from 'react-hot-toast'

interface MapClickHandlerProps {
  isAddingMarkers: boolean
  onAddMarker: (lat: number, lng: number) => void
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  isAddingMarkers,
  onAddMarker,
}) => {
  // Use a ref to track the latest value and avoid stale closures
  const isAddingMarkersRef = useRef(isAddingMarkers)

  // Update the ref when the prop changes
  useEffect(() => {
    isAddingMarkersRef.current = isAddingMarkers
  }, [isAddingMarkers])

  // Track click targets to avoid adding markers when clicking controls
  const clickTargetRef = useRef<EventTarget | null>(null)

  // Set up event handler for mousedown to track what was initially clicked
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      clickTargetRef.current = e.target
    }

    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
    }
  }, [])

  // Use Leaflet's map events
  const map = useMapEvents({
    click: (e) => {
      // First check if we're in marker adding mode
      if (!isAddingMarkersRef.current) return

      // Get the original DOM event target
      const target = e.originalEvent.target as HTMLElement
      const initialTarget = clickTargetRef.current as HTMLElement

      // Check if click started or ended on a control
      const isControlClick =
        target.closest('.leaflet-control') ||
        (initialTarget && initialTarget.closest('.leaflet-control')) ||
        target.classList.contains('toggle-markers') ||
        target.parentElement?.classList.contains('toggle-markers') ||
        (initialTarget && initialTarget.classList.contains('toggle-markers')) ||
        (initialTarget &&
          initialTarget.parentElement?.classList.contains('toggle-markers'))

      // Don't add marker if clicking controls
      if (isControlClick) {
        console.log('Click on control detected, not adding marker')
        return
      }

      // Add marker when clicking map
      onAddMarker(e.latlng.lat, e.latlng.lng)

      // Optional: Show toast notification
      toast.success(
        `Marker added at (${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
          5
        )})`
      )
    },
  })

  // Set cursor style based on mode
  useEffect(() => {
    if (!map) return

    const container = map.getContainer()
    if (container) {
      container.style.cursor = isAddingMarkers ? 'crosshair' : ''
    }

    return () => {
      if (container) {
        container.style.cursor = ''
      }
    }
  }, [map, isAddingMarkers])

  return null
}

export default MapClickHandler
