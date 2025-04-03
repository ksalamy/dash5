import React from 'react'
import { on } from 'events'
import { useMapEvents } from 'react-leaflet'
import { useManagedWaypoints } from 'react-ui/dist'

type ClickableMapPointProps = {
  lat: number
  lng: number
  onClick?: (lat: number, lng: number) => void
}

const ClickableMapPoint: React.FC<ClickableMapPointProps> = ({
  lat,
  lng,
  onClick,
}) => {
  const handleClick = () => {
    if (onClick) {
      onClick(lat, lng)
    }
  }

  return (
    <div
      style={{
        position: 'absolute',
        transform: `translate(${lng}px, ${lat}px)`,
        cursor: 'pointer',
      }}
      onClick={handleClick}
    >
      {/* Render a simple point or custom marker */}
      <div
        style={{
          width: '10px',
          height: '10px',
          backgroundColor: 'red',
          borderRadius: '50%',
        }}
      />
    </div>
  )
}

// const ClickableMapPoint: React.FC<{
//   onClick?: (lat: number, lng: number) => void
// }> = ({ onClick }) => {
//   const { focusedWaypointIndex, handleWaypointsUpdate, updatedWaypoints } =
//     useManagedWaypoints()
//   const map = useMapEvents({
//     click(e) {
//       if (onClick) {
//         onClick?.(e.latlng.lat, e.latlng.lng)
//       } else {
//         console.log(e.latlng)
//         handleWaypointsUpdate(
//           updatedWaypoints.map((waypoint, index) => {
//             if (index === focusedWaypointIndex) {
//               return {
//                 ...waypoint,
//                 lat: e.latlng.lat.toString(),
//                 lon: e.latlng.lng.toString(),
//               }
//             }
//             return waypoint
//           })
//         )
//       }
//     },
//   })
//   return null
// }

export default ClickableMapPoint
