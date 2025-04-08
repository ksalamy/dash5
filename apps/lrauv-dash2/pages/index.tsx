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
import toast from 'react-hot-toast'
import { StationsListModal } from '../components/StationsListModal'
import { useSelectedStations } from '../components/SelectedStationContext'
import type { MapProps } from '@mbari/react-ui/dist/Map/Map'

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
// TODO: Set up Draggable Marker and ClickableMapPoint

const styles = {
  content: 'flex flex-shrink flex-grow flex-row overflow-hidden',
  primary: 'flex flex-shrink flex-grow flex-col h-full',
  mapContainer: 'flex flex-shrink flex-grow bg-blue-300 h-full',
  secondary:
    'flex w-full flex-shrink-0 flex-col bg-white border-t-2 border-secondary-300/60',
}

// interface CustomMarkerProps {
type CustomMapProps = MapProps &
  React.RefAttributes<L.Map> & {
    isAddingMarkers?: boolean
    onToggleMarkerMode?: () => void
  }

// OverviewMap component
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

  // Effect to set the map reference
  useEffect(() => {
    // Reset positions when component unmounts or tracked vehicles change
    return () => {
      vehiclePositions.current = []
    }
  }, [trackedVehicles])

  // Effect to handle map reference
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

  // Effect to handle map events
  const calculateBounds = useCallback(() => {
    if (vehiclePositions.current.length === 0) {
      // console.warn('No vehicle positions available for bounds calculation')
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

  // Effect to handle map bounds
  const handleCoordinateRequest = useCallback(() => {
    if (latestGPS) {
      setCenter([latestGPS.latitude, latestGPS.longitude])
      setCenterZoom(15)
      setBounds(undefined)
      setViewMode('center')
    }
  }, [latestGPS])

  // Effect to handle map bounds
  const handleFitBoundsRequest = useCallback(() => {
    calculateBounds()
    setCenter(undefined)
    setCenter(undefined)
    setViewMode('bounds')
  }, [calculateBounds])

  // Effect to handle map bounds
  const handleMarkersRequest = useCallback(() => {
    console.log('Markers requested')
  }, [])

  // Effect to handle map bounds
  const handleStationsRequest = useCallback(() => {
    setShowStations(true)
  }, [setShowStations])

  // Effect to handle map bounds
  const handleCloseStations = useCallback(() => {
    setShowStations(false)
  }, [setShowStations])

  // Effect to handle map bounds
  const handleToggleMarkerMode = useCallback(() => {
    setIsAddingMarkers((prev) => {
      const newValue = !prev
      toast(`Marker mode ${newValue ? 'enabled' : 'disabled'}`)
      return newValue
    })
  }, [])

  // Effect to handle map bounds
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

// OverviewPage: NextPage
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
