import dynamic from 'next/dynamic'
import { useCallback, useRef, useMemo } from 'react'
import { useManagedWaypoints } from '@mbari/react-ui'
import { useJsApiLoader } from '@react-google-maps/api'

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

interface DeploymentMapProps {
  vehicleName?: string | null
  indicatorTime?: number | null
  onScrub?: (time?: number | null) => void
  startTime?: number | null
  endTime?: number | null
  googleMapsApiKey: string
}

const DeploymentMap: React.FC<DeploymentMapProps> = ({
  vehicleName,
  indicatorTime,
  onScrub: handleScrub,
  startTime,
  endTime,
  googleMapsApiKey,
}) => {
  const {
    updatedWaypoints,
    handleWaypointsUpdate,
    editable,
    focusedWaypointIndex,
  } = useManagedWaypoints()
  const handleDragEnd = useCallback(
    (index: number, { lat, lng }: { lat: number; lng: number }) =>
      handleWaypointsUpdate(
        updatedWaypoints.map((m, i) =>
          i === index ? { ...m, lat: lat.toString(), lon: lng.toString() } : m
        )
      ),
    [updatedWaypoints, handleWaypointsUpdate]
  )
  const plottedWaypoints = updatedWaypoints.filter(
    (wp) => ![wp.lat?.toLowerCase(), wp.lon?.toLowerCase()].includes('nan')
  )

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey,
  })
  const elevator = useMemo(
    () => (isLoaded ? new google.maps.ElevationService() : null),
    [isLoaded]
  )

  const depthLoading = useRef(false)
  const lastKnownDepth = useRef<number | null>(null)
  const handleDepthRequest = useCallback(
    async (lat: number, lng: number) => {
      if (depthLoading.current) return lastKnownDepth.current ?? 0
      const r: google.maps.LocationElevationRequest = {
        locations: [
          {
            lat,
            lng,
          },
        ],
      }
      depthLoading.current = true
      const result = await elevator?.getElevationForLocations(r)
      lastKnownDepth.current = result?.results[0].elevation ?? null
      depthLoading.current = false
      return lastKnownDepth.current ?? 0
    },
    [elevator, lastKnownDepth, depthLoading]
  )

  return (
    <Map
      className="h-full w-full"
      maxZoom={17}
      onRequestDepth={handleDepthRequest}
    >
      {plottedWaypoints?.length ? (
        <>
          {plottedWaypoints.map((m, i) => {
            const index = Number(m.latName.match(/\d+/)?.[0] ?? i)
            return (
              <DraggableMarker
                lat={Number(m.lat)}
                lng={Number(m.lon)}
                key={`${m.latName}-${m.lonName}-${m.lat}-${m.lon}`}
                index={index - 1}
                draggable={editable && !focusedWaypointIndex}
                onDragEnd={handleDragEnd}
              />
            )
          })}
          {!!focusedWaypointIndex && <ClickableMapPoint />}
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
          from={startTime as number}
          to={endTime as number}
          indicatorTime={indicatorTime}
          onScrub={handleScrub}
        />
      )}
    </Map>
  )
}

export default DeploymentMap
