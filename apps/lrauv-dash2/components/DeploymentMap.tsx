import dynamic from 'next/dynamic'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useManagedWaypoints } from '@mbari/react-ui'
import type { MapProps } from '@mbari/react-ui/dist/Map/Map'
import { useGoogleElevator } from '../lib/useGoogleElevator'
import { VPosDetail } from '@mbari/api-client'
import { StationsListModal } from './StationsListModal'
import { useSelectedStations } from './SelectedStationContext'
import MapClickHandler from './MapClickHandler'
import toast from 'react-hot-toast'
import 'leaflet.gridlayer.googlemutant'

// This is a tricky workaround to prevent leaflet from crashing next.js
// SSR. If we don't do this, the leaflet map will be loaded server side
// and throw a window error.
const Map = dynamic(() => import('@mbari/react-ui/dist/Map/Map'), {
  ssr: false,
})
const DraggableMarker = dynamic(() => import('./DraggableMarker'), {
  ssr: false,
})
const ClickableMapPoint = dynamic(() => import('./ClickableMapPoint'), {
  ssr: false,
})
const VehiclePath = dynamic(() => import('./VehiclePath'), {
  ssr: false,
})
const WaypointPreviewPath = dynamic(() => import('./WaypointPreviewPath'), {
  ssr: false,
})
const StationMarker = dynamic(() => import('../components/StationMarker'), {
  ssr: false,
})

interface DeploymentMapProps {
  vehicleName?: string | null
  indicatorTime?: number | null
  onScrub?: (time?: number | null) => void
  startTime?: number | null
  endTime?: number | null
}

const DeploymentMap: React.FC<DeploymentMapProps> = ({
  vehicleName,
  indicatorTime,
  onScrub: handleScrub,
  startTime,
  endTime,
}) => {
  const {
    updatedWaypoints,
    handleWaypointsUpdate,
    editable,
    focusedWaypointIndex,
  } = useManagedWaypoints()

  // Add state for marker mode
  const [isAddingMarkers, setIsAddingMarkers] = useState(false)
  const [newMarkerId, setNewMarkerId] = useState<number | null>(null)
  const { handleDepthRequest } = useGoogleElevator()
  const [center, setCenter] = useState<undefined | [number, number]>()
  const [centerZoom, setCenterZoom] = useState<number | undefined>(undefined)
  const [bounds, setBounds] = useState<
    [[number, number], [number, number]] | undefined
  >()
  const [latestGPS, setLatestGPS] = useState<VPosDetail | undefined>()
  const [viewMode, setViewMode] = useState<'center' | 'bounds' | null>(null)
  const [showStations, setShowStations] = useState(false)
  const { selectedStations } = useSelectedStations()
  const [customMarkers, setCustomMarkers] = useState<
    Array<{
      id: number
      lat: number
      lng: number
      index: number
      label?: string
      iconColor?: string
    }>
  >([])

  // Handler for toggling marker mode
  const handleToggleMarkerMode = useCallback(() => {
    setIsAddingMarkers((prev) => !prev)
  }, [])

  // Handler for adding markers when map is clicked
  const handleAddMarker = useCallback(
    (lat: number, lng: number) => {
      if (isAddingMarkers) {
        const newId = Date.now()

        setCustomMarkers((prev) => [
          ...prev,
          {
            id: newId,
            lat: lat,
            lng: lng,
            index: prev.length % 19,
            label: `Marker ${prev.length + 1}`,
            iconColor: '#E53935',
          },
        ])

        // Set as new marker and clear after delay
        setNewMarkerId(newId)
        setTimeout(() => setNewMarkerId(null), 300)

        return newId
      }
    },
    [isAddingMarkers]
  )

  // Reference to the map instance
  const mapRef = useRef<L.Map | null>(null)

  // Add state for selected waypoint
  const [selectedWaypointIndex, setSelectedWaypointIndex] = useState<
    number | null
  >(null)

  const handleDragEnd = useCallback(
    (index: number, { lat, lng }: { lat: number; lng: number }) =>
      handleWaypointsUpdate(
        updatedWaypoints.map((m, i) =>
          i === index ? { ...m, lat: lat.toString(), lon: lng.toString() } : m
        )
      ),
    [updatedWaypoints, handleWaypointsUpdate]
  )

  // Add handler for waypoint clicks
  const handleWaypointClick = useCallback(
    (index: number) => {
      setSelectedWaypointIndex(index === selectedWaypointIndex ? null : index)
    },
    [selectedWaypointIndex]
  )

  // Filter out NaN waypoints
  const plottedWaypoints = updatedWaypoints.filter(
    (wp) => ![wp.lat?.toLowerCase(), wp.lon?.toLowerCase()].includes('nan')
  )

  //  Track the latest vehicle name to reset state when it changes
  const latestVehicle = useRef(vehicleName)
  useEffect(() => {
    if (vehicleName !== latestVehicle.current) {
      setLatestGPS(undefined)
      setCenter(undefined)
      latestVehicle.current = vehicleName
    }
  }, [vehicleName, setLatestGPS])

  // Update the map center when latestGPS changes
  useEffect(() => {
    if (!latestGPS?.latitude || !latestGPS?.longitude) return

    if (
      !center ||
      center[0] !== latestGPS.latitude ||
      center[1] !== latestGPS.longitude
    ) {
      setCenter([latestGPS.latitude, latestGPS.longitude])
    }
  }, [latestGPS]) // Intentionally omitting center from dependencies to avoid infinite loop

  // Load markers from localStorage on mount
  useEffect(() => {
    const savedMarkers = localStorage.getItem('deploymentMapMarkers')
    if (savedMarkers) {
      try {
        setCustomMarkers(JSON.parse(savedMarkers))
      } catch (e) {
        toast.error(
          `Failed to load saved markers: ${(e as Error)?.message || e}`
        )
      }
    }
  }, [])

  // Save markers when they change
  useEffect(() => {
    toast(`Saving markers to localStorage: ${customMarkers.length}`)
    if (customMarkers.length > 0) {
      localStorage.setItem(
        'deploymentMapMarkers',
        JSON.stringify(customMarkers)
      )
    } else {
      localStorage.removeItem('deploymentMapMarkers')
    }
  }, [customMarkers])

  // TODO: Add functionality if needed, forcefully remove all markers
  const forceRemoveAllMarkers = useCallback(() => {
    // Clear all markers from state
    setCustomMarkers([])

    // Clear localStorage
    localStorage.removeItem('deploymentMapMarkers')

    // Force refresh map if needed
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current?.invalidateSize()
      }, 100)
    }

    toast('All markers forcefully removed')
  }, [])

  // Store positions of all vehicles to calculate center
  const vehiclePosition = useRef<Array<[number, number]>>([])
  // Track vehicle path points for bounds calculation
  const pathPoints = useRef<Array<[number, number]>>([])
  // Handler for GPS fix updates
  const handleGPSFix = useCallback(
    (gps: VPosDetail) => {
      // Reset the array if this is a different vehicle
      if ((latestGPS?.isoTime ?? 0) > gps.isoTime || !latestGPS) {
        vehiclePosition.current = []
        setLatestGPS(gps)
      }
      // Store position for path bounds calculation
      if (gps.latitude && gps.longitude) {
        pathPoints.current.push([gps.latitude, gps.longitude])
      }
      // Limit stored positions to prevent memory issues
      if (pathPoints.current.length > 1000) {
        pathPoints.current = pathPoints.current.slice(-1000)
      }
      // Store position for centering
      const position: [number, number] = [gps.latitude, gps.longitude]
      vehiclePosition.current.push(position)
    },
    [latestGPS, setLatestGPS]
  )

  // Calculate bounds for the entire vehicle path
  const calculatePathBounds = useCallback(() => {
    if (pathPoints.current.length === 0) {
      toast('No path points available for bounds calculation')
      return
    }

    // Find min/max lat/lon
    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180

    pathPoints.current.forEach((pos) => {
      minLat = Math.min(minLat, pos[0])
      maxLat = Math.max(maxLat, pos[0])
      minLng = Math.min(minLng, pos[1])
      maxLng = Math.max(maxLng, pos[1])
    })

    // Add padding (0.05 degrees)
    const padding = 0.05
    const newBounds: [[number, number], [number, number]] = [
      [minLat - padding, minLng - padding],
      [maxLat + padding, maxLng + padding],
    ]

    setBounds(newBounds)
    setCenter(undefined) // Clear center when using bounds
    // Set the view mode to force a re-render
    setViewMode('bounds')
  }, [])

  // Handler for depth request
  const handleCoordinateRequest = useCallback(() => {
    if (latestGPS) {
      setCenter([latestGPS.latitude, latestGPS.longitude])
      setCenterZoom(17)
      setBounds(undefined)
      setViewMode('center')
    } else {
      // If no latestGPS, try to use the last point in pathPoints if available
      const lastPoint = pathPoints.current[pathPoints.current.length - 1]
      if (lastPoint) {
        setCenter(lastPoint)
        setCenterZoom(17)
        setBounds(undefined)
        setViewMode('center')
      } else {
        toast('DeploymentMap - No position available to center on')
      }
    }
  }, [latestGPS])

  // Handler for fitting bounds to entire path
  const handleFitBoundsRequest = useCallback(() => {
    calculatePathBounds()
  }, [calculatePathBounds])

  //  Handler for requesting stations
  const handleMarkerRequest = useCallback(() => {
    // TODO: Implement the logic to handle marker requests here
    // This could involve fetching marker data from an API or other data source
    // For now, logging a message to indicate the function was called
    toast('Marker request initiated')
  }, [])

  // Handler for editing marker labels
  const handleEditMarkerLabel = useCallback((id: string, newLabel: string) => {
    toast(`Editing marker ${id} label to: ${newLabel}`)

    setCustomMarkers((prev) =>
      prev.map((marker) =>
        marker.id.toString() === id ? { ...marker, label: newLabel } : marker
      )
    )
  }, [])

  // Handler for changing marker color
  const handleColorChange = useCallback((id: string, newColor: string) => {
    toast(`Changing marker ${id} color to: ${newColor}`)

    setCustomMarkers((prev) =>
      prev.map((marker) =>
        marker.id.toString() === id
          ? { ...marker, iconColor: newColor }
          : marker
      )
    )
  }, [])

  // Handler for requesting stations
  const handleStationsRequest = useCallback(() => {
    setShowStations(true)
  }, [])

  //  Handler for closing the stations modal
  const handleCloseStations = useCallback(() => {
    setShowStations(false)
  }, [])

  //  TODO: Handler for requesting platforms - placeholder
  const handlePlatformsRequest = useCallback(() => {
    toast('Platforms request initiated')
    // TODO: Implement the logic to handle platform requests here
    // This could involve fetching platform data from an API or other data source
    // For now, logging a message to indicate the function was called
  }, [])

  return (
    <>
      {showStations ? (
        <StationsListModal onClose={handleCloseStations} />
      ) : null}
      <Map
        className="h-full w-full"
        maxZoom={17}
        onRequestDepth={handleDepthRequest}
        center={center}
        centerZoom={centerZoom}
        fitBounds={bounds}
        viewMode={viewMode}
        onRequestCoordinate={handleCoordinateRequest}
        onRequestPlatforms={handlePlatformsRequest}
        onRequestFitBounds={handleFitBoundsRequest}
        onRequestStations={handleStationsRequest}
        onRequestMarkers={handleMarkerRequest}
        isAddingMarkers={isAddingMarkers}
        onToggleMarkerMode={handleToggleMarkerMode}
        ref={(mapInstance) => {
          mapRef.current = mapInstance
        }}
      >
        <MapClickHandler
          isAddingMarkers={isAddingMarkers}
          isEditingMarker={false}
          onAddMarker={handleAddMarker}
        />
        {customMarkers.map((marker) => (
          <DraggableMarker
            key={`marker-${marker.id}-${marker.lat.toFixed(
              5
            )}-${marker.lng.toFixed(5)}`}
            id={String(marker.id)}
            position={[marker.lat, marker.lng]}
            label={marker.label || `Marker ${marker.id}`}
            index={marker.index}
            isSelected={false}
            isNew={marker.id === newMarkerId}
            iconColor={marker.iconColor || '#E53935'}
            onDragEnd={(pos) => {
              // Preserve ALL properties, not just update position
              setCustomMarkers((prev) =>
                prev.map((m) =>
                  m.id === marker.id
                    ? {
                        ...m, // Keep all existing properties (including iconColor)
                        lat: pos[0],
                        lng: pos[1],
                      }
                    : m
                )
              )
            }}
            onEdit={(newLabel) =>
              handleEditMarkerLabel(String(marker.id), newLabel)
            }
            onColorChange={(newColor) =>
              handleColorChange(String(marker.id), newColor)
            }
            onDelete={() => {
              // Log the marker being deleted
              toast(`Attempting to delete marker with ID: ${marker.id}`)

              // Explicitly convert IDs to same type when comparing
              setCustomMarkers((prev) => {
                const newMarkers = prev.filter((m) => m.id !== marker.id)
                toast(`Markers remaining after deletion: ${newMarkers.length}`)
                return newMarkers
              })

              // Force an update to localStorage immediately
              setTimeout(() => {
                const remaining = customMarkers.filter(
                  (m) => m.id !== marker.id
                )
                if (remaining.length > 0) {
                  localStorage.setItem(
                    'deploymentMapMarkers',
                    JSON.stringify(remaining)
                  )
                } else {
                  localStorage.removeItem('deploymentMapMarkers')
                }
              }, 0)
            }}
          />
        ))}
        {selectedStations.map((station) => {
          const lng = station.geojson.geometry.coordinates[0]
          const lat = station.geojson.geometry.coordinates[1]

          if (!lng || !lat) return null
          return (
            <StationMarker
              key={station.name}
              name={station.name}
              lat={lat}
              lng={lng}
            />
          )
        })}
        {plottedWaypoints?.length ? (
          <>
            {plottedWaypoints.map((m, i) => {
              const index = Number(m.latName.match(/\d+/)?.[0] ?? i)
              const isSelected = selectedWaypointIndex === i

              return (
                <DraggableMarker
                  key={`${m.latName}-${m.lonName}-${m.lat}-${m.lon}`}
                  id={String(i)}
                  position={[Number(m.lat), Number(m.lon)]}
                  label={`Waypoint ${index}`}
                  index={index - 1}
                  isSelected={isSelected}
                  draggable={editable && !focusedWaypointIndex}
                  onDragEnd={(pos) =>
                    handleDragEnd(i, { lat: pos[0], lng: pos[1] })
                  }
                  onClick={() => handleWaypointClick(i)}
                />
              )
            })}
            {!!focusedWaypointIndex && (
              <ClickableMapPoint
                lat={Number(plottedWaypoints[focusedWaypointIndex].lat)}
                lng={Number(plottedWaypoints[focusedWaypointIndex].lon)}
              />
            )}
            <WaypointPreviewPath
              waypoints={plottedWaypoints.map((wp) => ({
                lat: Number(wp.lat),
                lon: Number(wp.lon),
              }))}
            />
          </>
        ) : (
          <VehiclePath
            name={vehicleName as string}
            key={`path${vehicleName}`}
            from={startTime as number}
            to={endTime as number}
            indicatorTime={indicatorTime}
            onScrub={handleScrub}
            onGPSFix={handleGPSFix}
          />
        )}
      </Map>
    </>
  )
}

export default DeploymentMap
