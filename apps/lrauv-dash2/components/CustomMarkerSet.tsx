import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useMap } from 'react-leaflet'
import toast from 'react-hot-toast'
import DraggableMarker from './DraggableMarker'
import ClickableMapPoint from './ClickableMapPoint'
import MapClickHandler from './MapClickHandler'

interface CustomMarkerSetProps {
  isAddingMarkers: boolean
  setIsAddingMarkers: React.Dispatch<React.SetStateAction<boolean>>
}

interface MarkerData {
  id: number
  lat: number
  lng: number
  index: number
  label: string
  iconName?: 'mapMarker' | 'mapMarkerAlt' | 'locationDot' | 'locationPin'
  iconColor?: string
}

interface ClickablePointData {
  id: number
  lat: number
  lng: number
}

const CustomMarkerSet: React.FC<CustomMarkerSetProps> = ({
  isAddingMarkers,
  setIsAddingMarkers,
}) => {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [clickablePoints, setClickablePoints] = useState<ClickablePointData[]>(
    []
  )
  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)

  // Get access to the Leaflet map instance
  const map = useMap()

  const handleAddMarker = useCallback(
    (latlng: { lat: number; lng: number }) => {
      const newMarkerId = Date.now() + Math.random()
      setMarkers((prev) => [
        ...prev,
        {
          id: newMarkerId,
          lat: latlng.lat,
          lng: latlng.lng,
          index: prev.length % 19,
          label: `Marker ${prev.length + 1}`,
        },
      ])
      return newMarkerId
    },
    []
  )

  const handleAddClickablePoint = useCallback(
    (latlng: { lat: number; lng: number }) => {
      setClickablePoints((prev) => [
        ...prev,
        {
          id: Date.now() + Math.random(),
          lat: latlng.lat,
          lng: latlng.lng,
        },
      ])
    },
    []
  )

  const handleMarkerDragEnd = useCallback(
    (id: number, latlng: { lat: number; lng: number }) => {
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === id
            ? { ...marker, lat: latlng.lat, lng: latlng.lng }
            : marker
        )
      )
      toast.success(
        `Marker moved to (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`
      )
    },
    []
  )

  const handleMarkerClick = useCallback((id: number) => {
    setSelectedMarkerId(id)
  }, [])

  const handleEditMarkerLabel = useCallback((id: number, newLabel: string) => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, label: newLabel } : marker
      )
    )
    toast.success(`Marker renamed to "${newLabel}"`)
  }, [])

  const handleDeleteMarker = useCallback((id: number) => {
    setMarkers((prev) => prev.filter((marker) => marker.id !== id))
    toast.success('Marker deleted')
    setSelectedMarkerId(null)
  }, [])

  useEffect(() => {
    if (!map) return

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (isAddingMarkers) {
        const newMarkerId = handleAddMarker({
          lat: e.latlng.lat,
          lng: e.latlng.lng,
        })
        setSelectedMarkerId(newMarkerId)
        toast.success(
          `Marker added at (${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
            5
          )})`
        )
      }
    }

    if (isAddingMarkers) {
      map.on('click', handleMapClick)
      map.getContainer().style.cursor = 'crosshair'
      toast('Click on the map to add markers')
    } else {
      map.off('click', handleMapClick)
      map.getContainer().style.cursor = ''
    }

    return () => {
      map.off('click', handleMapClick)
      map.getContainer().style.cursor = ''
    }
  }, [isAddingMarkers, handleAddMarker, map])

  return (
    <>
      {markers.map((marker) => (
        <DraggableMarker
          key={marker.id}
          id={marker.id}
          position={[marker.lat, marker.lng]}
          label={marker.label}
          index={marker.index}
          isSelected={selectedMarkerId === marker.id}
          onDragEnd={(pos) =>
            handleMarkerDragEnd(marker.id, { lat: pos[0], lng: pos[1] })
          }
          onClick={() => handleMarkerClick(marker.id)}
          onEdit={(newLabel) => handleEditMarkerLabel(marker.id, newLabel)}
          onDelete={() => handleDeleteMarker(marker.id)}
        />
      ))}
    </>
  )
}

export default CustomMarkerSet
