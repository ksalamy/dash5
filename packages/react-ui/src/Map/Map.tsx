import {
  TileLayer,
  MapContainer,
  WMSTileLayer,
  LayersControl,
} from 'react-leaflet'
import React from 'react'
import { useMapBaseLayer, BaseLayerOption } from './useMapBaseLayer'

export interface MapProps {
  className?: string
  style?: React.CSSProperties
  center?: [number, number]
  zoom?: number
  minZoom?: number
  maxZoom?: number
  children?: React.ReactNode
}

const Map: React.FC<MapProps> = ({
  className,
  style,
  center = [36.7849, -122.12097],
  zoom = 11,
  minZoom = 4,
  maxZoom = 16,
  children,
}) => {
  const { baseLayer, setBaseLayer } = useMapBaseLayer()
  const addBaseLayerHandler = (layer: BaseLayerOption) => () => {
    setBaseLayer(layer)
  }
  return (
    <MapContainer
      center={center}
      zoom={zoom}
      scrollWheelZoom={false}
      className={className}
      style={style}
      minZoom={minZoom}
      maxZoom={maxZoom}
    >
      <LayersControl position="topright">
        <LayersControl.BaseLayer name="GMRT" checked={baseLayer === 'GMRT'}>
          <WMSTileLayer
            params={{
              layers: 'GMRT',
              format: 'image/png',
            }}
            url="http://www.gmrt.org/services/mapserver/wms_merc?"
            eventHandlers={{
              add: addBaseLayerHandler('GMRT'),
            }}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer
          name="OpenStreetmaps"
          checked={baseLayer === 'OpenStreetmaps'}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            eventHandlers={{
              add: addBaseLayerHandler('OpenStreetmaps'),
            }}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer
          name="ESRI Oceans/Labels"
          checked={baseLayer === 'ESRI Oceans/Labels'}
        >
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://developers.arcgis.com/">ArcGIS</a>'
            eventHandlers={{
              add: addBaseLayerHandler('ESRI Oceans/Labels'),
            }}
          />
        </LayersControl.BaseLayer>
        <LayersControl.BaseLayer
          name="Dark Layer (CARTO)"
          checked={baseLayer === 'Dark Layer (CARTO)'}
        >
          <TileLayer
            attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_nolabels/{z}/{x}/{y}.png"
            eventHandlers={{
              add: addBaseLayerHandler('Dark Layer (CARTO)'),
            }}
          />
        </LayersControl.BaseLayer>
      </LayersControl>
      {children}
    </MapContainer>
  )
}

Map.displayName = 'Map.Map'

export default Map
