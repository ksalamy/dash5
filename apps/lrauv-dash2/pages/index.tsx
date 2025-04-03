import { OverviewToolbar } from '@mbari/react-ui'
import { NextPage } from 'next'
import Layout from '../components/Layout'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import VehicleDeploymentDropdown from '../components/VehicleDeploymentDropdown'
import VehicleList from '../components/VehicleList'
import useTrackedVehicles from '../lib/useTrackedVehicles'
import { SharedPathContextProvider } from '../components/SharedPathContextProvider'
import { SelectedPlatformsProvider } from '../components/SelectedPlatformContext'
import { SelectedStationsProvider } from '../components/SelectedStationContext'
import { useRouter } from 'next/router'
import useGlobalModalId from '../lib/useGlobalModalId'
import { useGoogleElevator } from '../lib/useGoogleElevator'
import { Allotment, LayoutPriority } from 'allotment'
import { useGoogleMaps } from '../lib/useGoogleMaps'
import { VPosDetail } from '@mbari/api-client'
import 'allotment/dist/style.css'
import toast, { useToaster } from 'react-hot-toast'
import { StationsListModal } from '../components/StationsListModal'
import { useSelectedStations } from '../components/SelectedStationContext'
import type { MapProps } from '@mbari/react-ui/dist/Map/Map'
// import { CustomMarker } from '../components/CustomMarker'
import { useMap } from 'react-leaflet'

// This is a tricky workaround to prevent leaflet from crashing next.js
// SSR. If we don't do this, the leaflet map will be loaded server side
// and throw a window error.
const Map = dynamic(() => import('@mbari/react-ui/dist/Map/Map'), {
  ssr: false,
})

const VehiclePath = dynamic(() => import('../components/VehiclePath'), {
  ssr: false,
})

const StationMarker = dynamic(() => import('../components/StationMarker'), {
  ssr: false,
})

const DraggableMarker = dynamic(() => import('../components/DraggableMarker'), {
  ssr: false,
})

const CustomMarkerSet = dynamic(() => import('../components/CustomMarkerSet'), {
  ssr: false,
})

const ClickableMapPoint = dynamic(
  () => import('../components/ClickableMapPoint'),
  { ssr: false }
)
// TODO: Set up Draggable Marker and ClickableMapPoint

const styles = {
  content: 'flex flex-shrink flex-grow flex-row overflow-hidden',
  primary: 'flex flex-shrink flex-grow flex-col h-full',
  mapContainer: 'flex flex-shrink flex-grow bg-blue-300 h-full',
  secondary:
    'flex w-full flex-shrink-0 flex-col bg-white border-t-2 border-secondary-300/60',
}
type CustomMapProps = MapProps &
  React.RefAttributes<L.Map> & {
    isAddingMarkers?: boolean
    onToggleMarkerMode?: () => void
  }

// interface CustomMarkerSetProps {
//   isAddingMarkers: boolean
//   setIsAddingMarkers: React.Dispatch<React.SetStateAction<boolean>>
// }

// interface MarkerData {
//   id: number
//   lat: number
//   lng: number
//   index: number
//   label: string
// }

// interface ClickablePointData {
//   id: number
//   lat: number
//   lng: number
// }

// const CustomMarkerSet: React.FC<CustomMarkerSetProps> = ({
//   isAddingMarkers,
//   setIsAddingMarkers,
// }) => {
//   console.log('CustomMarkerSet rendered', { isAddingMarkers })
//   const [clickablePoints, setClickablePoints] = useState<ClickablePointData[]>(
//     []
//   )
//   const [selectedMarkerId, setSelectedMarkerId] = useState<number | null>(null)
//   const [markers, setMarkers] = useState<MarkerData[]>([])
//   console.log('Markers:', markers)
//   console.log('Clickable points:', clickablePoints)
//   // Get access to the Leaflet map instance
//   const map = useMap()

//   const handleAddMarker = useCallback(
//     (latlng: { lat: number; lng: number }) => {
//       const newMarkerId = Date.now() + Math.random()
//       setMarkers((prev) => [
//         ...prev,
//         {
//           id: newMarkerId,
//           lat: latlng.lat,
//           lng: latlng.lng,
//           index: prev.length % 19,
//           label: `Marker ${prev.length + 1}`,
//         },
//       ])
//       return newMarkerId
//     },
//     []
//   )
//   const handleAddClickablePoint = useCallback(
//     (latlng: { lat: number; lng: number }) => {
//       setClickablePoints((prev) => [
//         ...prev,
//         {
//           id: Date.now() + Math.random(),
//           lat: latlng.lat,
//           lng: latlng.lng,
//         },
//       ])
//     },
//     []
//   )

//   const handleMarkerDragEnd = useCallback(
//     (id: number, latlng: { lat: number; lng: number }) => {
//       setMarkers((prev) =>
//         prev.map((marker) =>
//           marker.id === id
//             ? { ...marker, lat: latlng.lat, lng: latlng.lng }
//             : marker
//         )
//       )
//       toast.success(
//         `Marker moved to (${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)})`
//       )
//     },
//     []
//   )

//   const handleMarkerClick = useCallback((id: number) => {
//     setSelectedMarkerId(id)
//   }, [])

//   const handleEditMarkerLabel = useCallback((id: number, newLabel: string) => {
//     setMarkers((prev) =>
//       prev.map((marker) =>
//         marker.id === id ? { ...marker, label: newLabel } : marker
//       )
//     )
//     toast.success(`Marker renamed to "${newLabel}"`)
//   }, [])

//   const handleDeleteMarker = useCallback((id: number) => {
//     setMarkers((prev) => prev.filter((marker) => marker.id !== id))
//     toast.success('Marker deleted')
//     setSelectedMarkerId(null)
//   }, [])

//   useEffect(() => {
//     if (!map) return

//     const handleMapClick = (e: L.LeafletMouseEvent) => {
//       if (isAddingMarkers) {
//         const newMarkerId = handleAddMarker({
//           lat: e.latlng.lat,
//           lng: e.latlng.lng,
//         })
//         setSelectedMarkerId(newMarkerId)
//         toast.success(
//           `Marker added at (${e.latlng.lat.toFixed(5)}, ${e.latlng.lng.toFixed(
//             5
//           )})`
//         )
//       }
//     }

//     if (isAddingMarkers) {
//       map.on('click', handleMapClick)
//       map.getContainer().style.cursor = 'crosshair'
//       toast('Click on the map to add markers')
//     } else {
//       map.off('click', handleMapClick)
//       map.getContainer().style.cursor = ''
//     }

//     return () => {
//       map.off('click', handleMapClick)
//       map.getContainer().style.cursor = ''
//     }
//   }, [isAddingMarkers, handleAddMarker, map])

//   return (
//     <>
//       {markers.map((marker) => (
//         <DraggableMarker
//           key={marker.id}
//           id={marker.id}
//           position={[marker.lat, marker.lng]}
//           label={marker.label}
//           index={marker.index}
//           isSelected={selectedMarkerId === marker.id}
//           onDragEnd={(pos) =>
//             handleMarkerDragEnd(marker.id, { lat: pos[0], lng: pos[1] })
//           }
//           onClick={() => handleMarkerClick(marker.id)}
//           onEdit={(newLabel) => handleEditMarkerLabel(marker.id, newLabel)}
//           onDelete={() => handleDeleteMarker(marker.id)}
//         />
//       ))}
//     </>
//   )
// }

// export default CustomMarkerSet

////////////////   OVERVIEWMAP   //////////////////////
//////////////////////////////////////////////////////
const OverViewMap: React.FC<{
  trackedVehicles: string[]
}> = ({ trackedVehicles }) => {
  // Add mapRef to store the Leaflet map instance
  const mapRef = useRef<L.Map | null>(null)
  const { handleDepthRequest } = useGoogleElevator()
  const [center, setCenter] = useState<undefined | [number, number]>()
  const [centerZoom, setCenterZoom] = useState<number | undefined>(undefined)
  const [bounds, setBounds] = useState<
    [[number, number], [number, number]] | undefined
  >()
  const [latestGPS, setLatestGPS] = useState<VPosDetail | undefined>()
  const [showStations, setShowStations] = useState(false)
  const [viewMode, setViewMode] = useState<'center' | 'bounds' | null>(null)
  const { selectedStations } = useSelectedStations()
  const [isAddingMarkers, setIsAddingMarkers] = useState(false)

  // Debugging: Log trackedVehicles
  console.log('Tracked vehicles:', trackedVehicles)

  // Debugging: Ensure trackedVehicles contains unique values
  const uniqueTrackedVehicles = Array.from(new Set(trackedVehicles))
  console.log('Unique tracked vehicles:', uniqueTrackedVehicles)

  // Store all vehicle positions for bounds calculation
  const vehiclePositions = useRef<Array<[number, number]>>([])

  useEffect(() => {
    // Reset positions when component unmounts or tracked vehicles change
    return () => {
      vehiclePositions.current = []
    }
  }, [trackedVehicles])

  const handleGPSFix = useCallback(
    (gps: VPosDetail) => {
      if ((latestGPS?.isoTime ?? 0) > gps.isoTime || !latestGPS) {
        setLatestGPS(gps)
      }
      // Store position for bounds calculation
      vehiclePositions.current.push([gps.latitude, gps.longitude])
      // Limit stored positions to prevent memory issues
      if (vehiclePositions.current.length > 1000) {
        vehiclePositions.current = vehiclePositions.current.slice(-1000)
      }
    },
    [latestGPS, setLatestGPS]
  )

  const calculateBounds = useCallback(() => {
    if (vehiclePositions.current.length === 0) {
      // console.warn('No vehicle positions available for bounds calculation')
      return
    }

    let minLat = 90,
      maxLat = -90,
      minLng = 180,
      maxLng = -180

    vehiclePositions.current.forEach((pos) => {
      minLat = Math.min(minLat, pos[0])
      maxLat = Math.max(maxLat, pos[0])
      minLng = Math.min(minLng, pos[1])
      maxLng = Math.max(maxLng, pos[1])
    })

    const padding = 0.1
    const newBounds: [[number, number], [number, number]] = [
      [minLat - padding, minLng - padding],
      [maxLat + padding, maxLng + padding],
    ]
    setBounds(newBounds)
  }, [])

  const handleCoordinateRequest = useCallback(() => {
    if (latestGPS) {
      setCenter([latestGPS.latitude, latestGPS.longitude])
      setCenterZoom(15)
      setBounds(undefined)
      setViewMode('center')
    }
  }, [latestGPS])

  const handleFitBoundsRequest = useCallback(() => {
    calculateBounds()
    setCenter(undefined)
    setViewMode('bounds')
  }, [calculateBounds])

  const handleMarkersRequest = useCallback(() => {
    console.log('Markers requested')
  }, [])

  const handleStationsRequest = useCallback(() => {
    setShowStations(true)
  }, [setShowStations])

  const handleCloseStations = useCallback(() => {
    setShowStations(false)
  }, [setShowStations])

  const handleToggleMarkerMode = useCallback(() => {
    setIsAddingMarkers((prev) => {
      const newValue = !prev
      toast(`Marker mode ${newValue ? 'enabled' : 'disabled'}`)
      return newValue
    })
  }, [])

  useEffect(() => {
    console.log('mapRef.current in OverViewMap:', mapRef.current)
  }, [mapRef])

  return (
    console.log('Rendering Map with children'),
    (
      <>
        {showStations ? (
          <StationsListModal onClose={handleCloseStations} />
        ) : null}

        <Map
          className="h-full w-full"
          onRequestDepth={handleDepthRequest}
          center={center}
          centerZoom={centerZoom}
          fitBounds={bounds}
          viewMode={viewMode}
          onRequestCoordinate={handleCoordinateRequest}
          onRequestFitBounds={handleFitBoundsRequest}
          onRequestStations={handleStationsRequest}
          onRequestMarkers={handleMarkersRequest}
          isAddingMarkers={isAddingMarkers}
          onToggleMarkerMode={handleToggleMarkerMode}
        >
          {uniqueTrackedVehicles.map((name, index) => (
            <VehiclePath
              name={name}
              key={`path-${name}-${index}`}
              onGPSFix={handleGPSFix}
              grouped
            />
          ))}
          {selectedStations.map((station) => {
            const lng = station.geojson?.geometry?.coordinates[0]
            const lat = station.geojson?.geometry?.coordinates[1]

            if (!lng || !lat) {
              return null
            }

            return (
              <StationMarker
                key={station.name}
                name={station.name}
                lat={lat}
                lng={lng}
              />
            )
          })}
          <CustomMarkerSet
            isAddingMarkers={isAddingMarkers}
            setIsAddingMarkers={setIsAddingMarkers}
          />
        </Map>
      </>
    )
  )
}

const OverviewPage: NextPage = () => {
  const { mapsLoaded } = useGoogleMaps()
  const router = useRouter()
  const { trackedVehicles } = useTrackedVehicles()
  const mounted = useRef(false)
  const { setGlobalModalId } = useGlobalModalId()
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      setGlobalModalId(null)
    }
  })
  const handleSelectedVehicle = (vehicle: string) => {
    router.push(`/vehicle/${vehicle}`)
  }

  return (
    <SharedPathContextProvider>
      <SelectedPlatformsProvider>
        <SelectedStationsProvider>
          <div className={styles.content}>
            <Layout>
              {trackedVehicles?.length ? (
                <>
                  <OverviewToolbar deployment={{ name: 'Overview', id: '0' }} />

                  <div
                    className={styles.content}
                    data-testid="vehicle-dashboard"
                  >
                    <Allotment
                      separator
                      snap
                      defaultSizes={[75, 25]}
                      proportionalLayout
                    >
                      <Allotment.Pane>
                        <section className={styles.primary}>
                          <div className={styles.mapContainer}>
                            {mapsLoaded && (
                              <OverViewMap trackedVehicles={trackedVehicles} />
                            )}
                          </div>
                        </section>
                      </Allotment.Pane>
                      <Allotment.Pane priority={LayoutPriority.High}>
                        <section className={styles.secondary}>
                          <VehicleList
                            onSelectVehicle={handleSelectedVehicle}
                          />
                        </section>
                      </Allotment.Pane>
                    </Allotment>
                  </div>
                </>
              ) : (
                <>
                  <p className="p-6 text-xl" aria-label="get started">
                    To get started you must add at least one vehicle to track.
                  </p>
                  <VehicleDeploymentDropdown
                    className="mx-6 max-h-96 w-96"
                    scrollable
                  />
                </>
              )}
            </Layout>
          </div>
        </SelectedStationsProvider>
      </SelectedPlatformsProvider>
    </SharedPathContextProvider>
  )
}

export default OverviewPage
