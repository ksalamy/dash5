import dynamic from 'next/dynamic'
import React, { useCallback, useState, useRef, useEffect } from 'react'
import { useManagedWaypoints } from '@mbari/react-ui'
import type { MapProps } from '@mbari/react-ui/dist/Map/Map'
import { useGoogleElevator } from '../lib/useGoogleElevator'
import { VPosDetail } from '@mbari/api-client'
import { StationsListModal } from './StationsListModal'
import { useSelectedStations } from './SelectedStationContext'
import { useMapEvents } from 'react-leaflet'
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
// const GoogleMapLayer = dynamic(
//   () => import('@mbari/react-ui/dist/Map/maLayer'),
//   {
//     ssr: false,
//   }
// )
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
// Type assertion to ensure MapProps has the expected properties
type CustomMapProps = MapProps & {
  isAddingMarkers?: boolean
  onToggleMarkerMode?: () => void
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
  const [customMarkers, setCustomMarkers] = useState<
    Array<{
      id: number
      lat: number
      lng: number
      index: number
    }>
  >([])

  // Handler for toggling marker mode
  const handleToggleMarkerMode = useCallback(() => {
    setIsAddingMarkers((prev) => !prev)
  }, [])

  // Handler for adding markers when map is clicked
  const handleAddMarker = useCallback(
    (e: L.LeafletMouseEvent) => {
      if (isAddingMarkers) {
        setCustomMarkers((prev) => [
          ...prev,
          {
            id: Date.now(),
            lat: e.latlng.lat,
            lng: e.latlng.lng,
            index: prev.length % 19, // Cycle through icon styles
          },
        ])
      }
    },
    [isAddingMarkers]
  )

  // Reference to the map instance
  const mapRef = useRef<L.Map | null>(null)

  // Set up click handler when marker mode changes
  const MapClickHandler = () => {
    const map = useMapEvents({
      click: (e) => {
        if (isAddingMarkers) {
          setCustomMarkers((prev) => [
            ...prev,
            {
              id: Date.now(),
              lat: e.latlng.lat,
              lng: e.latlng.lng,
              index: prev.length % 19,
            },
          ])
        }
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

  const plottedWaypoints = updatedWaypoints.filter(
    (wp) => ![wp.lat?.toLowerCase(), wp.lon?.toLowerCase()].includes('nan')
  )

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

  const latestVehicle = useRef(vehicleName)
  useEffect(() => {
    if (vehicleName !== latestVehicle.current) {
      setLatestGPS(undefined)
      setCenter(undefined)
      latestVehicle.current = vehicleName
    }
  }, [vehicleName, setLatestGPS])

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

  // Store positions of all vehicles to calculate center
  const vehiclePosition = useRef<Array<[number, number]>>([])
  // Track vehicle path points for bounds calculation
  const pathPoints = useRef<Array<[number, number]>>([])

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
      console.warn('No path points available for bounds calculation')
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
        console.warn('DeploymentMap - No position available to center on')
      }
    }
  }, [latestGPS])

  // Handler for fitting bounds to entire path
  const handleFitBoundsRequest = useCallback(() => {
    calculatePathBounds()
  }, [calculatePathBounds])

  const handleMarkerRequest = useCallback(() => {
    // Implement the logic to handle marker requests here
    // This could involve fetching marker data from an API or other data source
    // For now, we'll just log a message to indicate the function was called
    console.log('Marker request initiated')
  }, [])

  const handleStationsRequest = useCallback(() => {
    setShowStations(true)
  }, [])

  const handleCloseStations = useCallback(() => {
    setShowStations(false)
  }, [])

  const handlePlatformsRequest = useCallback(() => {
    console.log('Platforms request initiated')
    // Implement the logic to handle platform requests here
    // This could involve fetching platform data from an API or other data source
    // For now, we'll just log a message to indicate the function was called
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
        // Add new props
        onRequestMarkers={handleMarkerRequest}
        // isAddingMarkers={isAddingMarkers} // Ensure MapProps is extended to include this
        onToggleMarkerMode={handleToggleMarkerMode}
        ref={(mapInstance) => {
          mapRef.current = mapInstance
        }}
      >
        <MapClickHandler />
        {/* <GoogleMapLayer /> */}
        {/* Custom markers */}
        {customMarkers.map((marker) => (
          <DraggableMarker
            key={marker.id}
            id={marker.id}
            position={[marker.lat, marker.lng]}
            label={`Marker ${marker.id}`}
            index={marker.index}
            isSelected={false}
            onDragEnd={(pos) => {
              setCustomMarkers((prev) =>
                prev.map((m) =>
                  m.id === marker.id ? { ...m, lat: pos[0], lng: pos[1] } : m
                )
              )
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
                  id={i}
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
