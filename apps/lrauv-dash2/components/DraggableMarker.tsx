import React, { useState, useRef, useEffect } from 'react'
import { Marker, Popup, Tooltip } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMapMarker,
  faMapMarkerAlt,
  faLocationDot,
  faLocationPin,
} from '@fortawesome/free-solid-svg-icons'
import { renderToString } from 'react-dom/server'
import mapMarker from './markers/mapMarker.svg'
import mapMarker1 from './markers/mapMarker1.svg'
import mapMarker2 from './markers/mapMarker2.svg'
import mapMarker3 from './markers/mapMarker3.svg'
import mapMarker4 from './markers/mapMarker4.svg'
import mapMarker5 from './markers/mapMarker5.svg'
import mapMarker6 from './markers/mapMarker6.svg'
import mapMarker7 from './markers/mapMarker7.svg'
import mapMarker8 from './markers/mapMarker8.svg'
import mapMarker9 from './markers/mapMarker9.svg'
import mapMarker10 from './markers/mapMarker10.svg'
import mapMarker11 from './markers/mapMarker11.svg'
import mapMarker12 from './markers/mapMarker12.svg'
import mapMarker13 from './markers/mapMarker13.svg'
import mapMarker14 from './markers/mapMarker14.svg'
import mapMarker15 from './markers/mapMarker15.svg'
import mapMarker16 from './markers/mapMarker16.svg'
import mapMarker17 from './markers/mapMarker17.svg'
import mapMarker18 from './markers/mapMarker18.svg'
import mapMarker19 from './markers/mapMarker19.svg'

const mapMarkerIcons = [
  mapMarker1,
  mapMarker2,
  mapMarker3,
  mapMarker4,
  mapMarker5,
  mapMarker6,
  mapMarker7,
  mapMarker8,
  mapMarker9,
  mapMarker10,
  mapMarker11,
  mapMarker12,
  mapMarker13,
  mapMarker14,
  mapMarker15,
  mapMarker16,
  mapMarker17,
  mapMarker18,
  mapMarker19,
]

interface DraggableMarkerProps {
  id: number
  position: [number, number]
  label: string
  index: number
  isSelected?: boolean
  draggable?: boolean
  onClick?: () => void
  onDragEnd?: (position: [number, number]) => void
  onEdit?: (newLabel: string) => void
  onDelete?: () => void
  iconName?: 'mapMarker' | 'mapMarkerAlt' | 'locationDot' | 'locationPin'
  iconColor?: string
}

// Map of icon names to Font Awesome icons
const iconMap = {
  mapMarker: faMapMarker,
  mapMarkerAlt: faMapMarkerAlt,
  locationDot: faLocationDot,
  locationPin: faLocationPin,
}

// Function to create a Font Awesome div icon
const createFaIcon = (
  iconName: keyof typeof iconMap = 'mapMarkerAlt',
  color = '#1E88E5',
  size = '2x',
  isSelected = false
) => {
  const icon = iconMap[iconName] || faMapMarkerAlt
  const iconHtml = renderToString(
    <FontAwesomeIcon
      icon={icon}
      style={{
        color,
        filter: isSelected ? 'drop-shadow(0 0 4px rgba(0,0,0,0.5))' : 'none',
      }}
      size={size as any}
    />
  )

  return L.divIcon({
    html: iconHtml,
    className: 'custom-fa-marker',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
    popupAnchor: [0, -35],
  })
}

const DraggableMarker: React.FC<DraggableMarkerProps> = ({
  id,
  position,
  label,
  index,
  isSelected = false,
  onClick,
  onDragEnd,
  onEdit,
  onDelete,
  iconName = 'mapMarkerAlt',
  iconColor,
}) => {
  const markerRef = useRef<L.Marker>(null)
  const [editMode, setEditMode] = useState(false)
  const [inputValue, setInputValue] = useState(label)
  const [markerPosition, setMarkerPosition] =
    useState<[number, number]>(position)

  // Determine icon color based on index or provided color
  const color = iconColor || getColorFromIndex(index)

  // Create marker icon
  const icon = createFaIcon(
    iconName,
    color,
    isSelected ? '3x' : '2x',
    isSelected
  )

  useEffect(() => {
    setMarkerPosition(position)
  }, [position])

  const handleDragEnd = () => {
    const marker = markerRef.current
    if (marker != null) {
      const newPos = marker.getLatLng()
      setMarkerPosition([newPos.lat, newPos.lng])
      onDragEnd?.([newPos.lat, newPos.lng])
    }
  }

  const handleSaveEdit = () => {
    setEditMode(false)
    if (inputValue !== label && onEdit) {
      onEdit(inputValue)
    }
  }

  // Generate a color based on the index
  function getColorFromIndex(index: number): string {
    const colors = [
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
      '#F4511E',
      '#6D4C41',
      '#757575',
      '#546E7A',
    ]
    return colors[index % colors.length]
  }

  return (
    <Marker
      ref={markerRef}
      position={markerPosition}
      draggable={true}
      icon={icon}
      eventHandlers={{
        dragend: handleDragEnd,
        click: () => {
          onClick?.()
        },
      }}
    >
      <Tooltip direction="top" offset={[0, -20]} opacity={1} permanent>
        {label}
      </Tooltip>

      <Popup>
        <div className="flex flex-col gap-2">
          <p>
            <strong>Position:</strong> {markerPosition[0].toFixed(5)},{' '}
            {markerPosition[1].toFixed(5)}
          </p>

          {editMode ? (
            <div className="flex gap-1">
              <input
                type="text"
                title="Label"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                className="border px-1 py-0.5 text-sm"
                autoFocus
              />
              <button
                onClick={handleSaveEdit}
                className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white"
              >
                Save
              </button>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              <button
                onClick={() => setEditMode(true)}
                className="rounded bg-blue-500 px-2 py-1 text-xs text-white"
              >
                Edit Label
              </button>
              <button
                onClick={onDelete}
                className="rounded bg-red-500 px-2 py-1 text-xs text-white"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  )
}

export default DraggableMarker
