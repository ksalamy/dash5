import React from 'react'
// also exported from '@storybook/react' if you can deal with breaking changes in 6.1
import { Story, Meta } from '@storybook/react/types-6-0'
import { WaypointTable, WaypointTableProps } from './WaypointTable'
import { makeOrdinal } from '@mbari/utils'

export default {
  title: 'Tables/WaypointTable',
  component: WaypointTable,
} as Meta

const Template: Story<WaypointTableProps> = (args) => (
  <div className="h-[320px] bg-stone-200 p-2">
    <WaypointTable {...args} className="h-full" />
  </div>
)

const AltTemplate: Story<WaypointTableProps> = (args) => (
  <div className=" bg-stone-200 p-2">
    <WaypointTable {...args} />
  </div>
)

const args: WaypointTableProps = {
  waypoints: Array(5)
    .fill(0)
    .map((_, index) => ({
      latName: `Lat${index + 1}`,
      lonName: `Lon${index + 1}`,
      description: `Latitude of ${makeOrdinal(
        index + 1
      )} waypoint. If NaN, waypoint
    will be skipped/Longitude of ${makeOrdinal(index + 1)} waypoint.`,
    })),
  stations: [
    { name: 'C1', lat: '36.797', lon: '-121.847' },
    { name: 'C2', lat: '46.797', lon: '-141.847' },
  ],
  onFocusWaypoint: (index) => {
    console.log(index)
  },
}

export const Standard = Template.bind({})
Standard.args = args
Standard.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/FtsKsOCBQ2YjTZlwezG6aI/MBARI-Components?node-id=3622%3A640',
  },
}

export const FocusMode = AltTemplate.bind({})
FocusMode.args = {
  ...args,
  focusWaypointIndex: 0,
  onDone: () => {
    console.log('done')
  },
  onCancelFocus: (index) => {
    console.log(index)
  },
}

export const WaypointField = AltTemplate.bind({})
WaypointField.args = {
  ...args,
  waypoints: Array(3)
    .fill(0)
    .map((_, index) => ({
      latName: `Lat${index + 1}`,
      lonName: `Lon${index + 1}`,
      description: `Latitude of ${makeOrdinal(
        index + 1
      )} waypoint. If NaN, waypoint
  will be skipped/Longitude of ${makeOrdinal(index + 1)} waypoint.`,
    })),
}
WaypointField.parameters = {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/file/FtsKsOCBQ2YjTZlwezG6aI/MBARI-Components?node-id=5251%3A599',
  },
}
