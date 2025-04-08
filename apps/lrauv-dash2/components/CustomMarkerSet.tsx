import React, { useCallback, useEffect, useState, useRef } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'
import toast from 'react-hot-toast'
import DraggableMarker from './DraggableMarker'
import MapClickHandler from './MapClickHandler'

interface CustomMarkerSetProps {
  isAddingMarkers: boolean
  setIsAddingMarkers: (adding: boolean) => void
}
interface MarkerData {
  id: number
  lat: number
  lng: number
  index: number
  label: string
  iconName?: string
  iconColor?: string
}

const CustomMarkerSet: React.FC<CustomMarkerSetProps> = ({
  isAddingMarkers,
  setIsAddingMarkers,
}) => {
  const map = useMap()
  const [markers, setMarkers] = useState<
    Array<{
      id: number
      lat: number
      lng: number
      label: string
      index: number
      iconColor: string
    }>
  >([])

  const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
  const [isAnyMarkerEditing, setIsAnyMarkerEditing] = useState(false)
  const [newMarkerId, setNewMarkerId] = useState<number | null>(null)

  // Add a handler to track marker edit status
  const handleMarkerEditStateChange = useCallback(
    (id: number, isEditing: boolean) => {
      setIsAnyMarkerEditing(isEditing)
    },
    []
  )
  // Color options for markers
  const colorOptions = [
    '#E53935',
    '#D81B60',
    '#8E24AA',
    '#5E35B1',
    '#3949AB',
    '#1E88E5',
    '#039BE5',
    '#00ACC1',
    '#00897B',
    '#43A047',
    '#7CB342',
    '#C0CA33',
    '#FDD835',
    '#FFB300',
    '#FB8C00',
  ]

  // Load markers from localStorage on mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem('mapMarkers')
    if (savedMarkers) {
      try {
        setMarkers(JSON.parse(savedMarkers))
      } catch (e) {
        toast.error(`Failed to load saved markers: ${(e as Error).message}`)
      }
    }
  }, [])

  // Save markers when they change
  useEffect(() => {
    if (markers.length > 0) {
      localStorage.setItem('mapMarkers', JSON.stringify(markers))
    }
  }, [markers])

  // Simple function to add a marker
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      if (isAddingMarkers) {
        const newId = Date.now()

        setMarkers((prev) => [
          ...prev,
          {
            id: newId,
            lat: lat,
            lng: lng,
            index: prev.length,
            label: `Marker ${prev.length + 1}`,
            iconColor: '#E53935', // Default color
          },
        ])

        // Set this as the new marker ID
        setNewMarkerId(newId)

        // Clear the new marker ID after a short delay
        setTimeout(() => {
          setNewMarkerId(null)
        }, 300)

        toast.success('Marker added')
        return newId
      }
    },
    [isAddingMarkers]
  )

  // Handle marker drag
  const handleMarkerDragEnd = useCallback(
    (id: number, position: { lat: number; lng: number }) => {
      // Find the current marker to get its label
      const marker = markers.find((m) => m.id.toString() === id.toString())
      const label = marker?.label || 'Marker'

      // Update marker position
      setMarkers((prev) =>
        prev.map((marker) =>
          marker.id === id
            ? { ...marker, lat: position.lat, lng: position.lng }
            : marker
        )
      )

      // Display toast notification with formatted coordinates
      toast.success(
        `${label} moved to (${position.lat.toFixed(5)}, ${position.lng.toFixed(
          5
        )})`,
        {
          duration: 2000,
          style: {
            border: '1px solid #1E3A8A',
            padding: '16px',
            color: '#1E3A8A',
          },
          iconTheme: {
            primary: '#1E3A8A',
            secondary: '#FFFAEE',
          },
        }
      )
    },
    [markers]
  )

  // Handle marker click
  const handleMarkerClick = useCallback(
    (id: number) => {
      setSelectedMarkerId(id === selectedMarkerId ? null : id)
    },
    [selectedMarkerId]
  )

  // Handle editing the marker label
  const handleEditMarkerLabel = useCallback((id: string, newLabel: string) => {
    toast(`Editing marker ${id} label to: ${newLabel}`)

    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id.toString() === id ? { ...marker, label: newLabel } : marker
      )
    )
  }, [])

  // Handle changing marker color
  const handleColorChange = useCallback((id: number, newColor: string) => {
    setMarkers((prev) =>
      prev.map((marker) =>
        marker.id === id ? { ...marker, iconColor: newColor } : marker
      )
    )
  }, [])

  // Handle deleting a marker
  const handleDeleteMarker = useCallback(
    (id: number) => {
      toast(`Deleting marker with ID: ${id}`)

      // Force update the markers array
      setMarkers((prevMarkers) => {
        const newMarkers = prevMarkers.filter((marker) => marker.id !== id)
        toast(`Markers after deletion: ${newMarkers.length}`)

        // If you're storing markers in localStorage, update that too
        localStorage.setItem('mapMarkers', JSON.stringify(newMarkers))

        return newMarkers
      })

      // Clear selected marker if needed
      if (selectedMarkerId && selectedMarkerId.toString() === id.toString()) {
        setSelectedMarkerId(null)
      }

      // Show confirmation
      toast.success('Marker deleted')
    },
    [selectedMarkerId]
  )

  // Set up map events
  useMapEvents({
    click: (e) => {
      if (isAddingMarkers) {
        // Ensure we're not clicking on a control element
        const target = e.originalEvent.target as HTMLElement
        if (
          target.closest('.leaflet-control') ||
          target.closest('.leaflet-popup')
        ) {
          return
        }

        // Add marker at click location
        handleAddMarker(e.latlng.lat, e.latlng.lng)
      }
    },
  })

  // Update cursor based on marker mode
  useEffect(() => {
    if (!map) return

    if (isAddingMarkers) {
      map.getContainer().style.cursor = 'crosshair'
    } else {
      map.getContainer().style.cursor = ''
    }
  }, [isAddingMarkers, map])

  return (
    <>
      {markers.map((marker) => (
        <DraggableMarker
          key={marker.id}
          id={marker.id.toString()}
          position={[marker.lat, marker.lng]}
          label={marker.label}
          index={marker.index}
          isSelected={selectedMarkerId === marker.id}
          isNew={marker.id === newMarkerId} // Pass isNew prop here
          onClick={() => handleMarkerClick(marker.id)}
          onDragEnd={(pos) =>
            handleMarkerDragEnd(marker.id, { lat: pos[0], lng: pos[1] })
          }
          onEdit={(newLabel) =>
            handleEditMarkerLabel(marker.id.toString(), newLabel)
          }
          onDelete={() => handleDeleteMarker(marker.id)}
          onColorChange={(newColor) => handleColorChange(marker.id, newColor)}
          onEditStateChange={(isEditing) => setIsAnyMarkerEditing(isEditing)}
          iconColor={marker.iconColor}
          iconName="locationDot"
        />
      ))}
      <MapClickHandler
        isAddingMarkers={isAddingMarkers}
        isEditingMarker={isAnyMarkerEditing}
        onAddMarker={handleAddMarker}
      />
    </>
  )
}

export default CustomMarkerSet
