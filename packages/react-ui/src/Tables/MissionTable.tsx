import React from 'react'
import clsx from 'clsx'
import { Table, TableProps } from '../Data/Table'
import { SortDirection } from '../Data/TableHeader'
import { capitalize } from '@mbari/utils'

export interface MissionTableProps {
  className?: string
  style?: React.CSSProperties
  missions: Mission[]
  selectedId?: string
  onSelectMission?: (missionId: string) => void
  onSortColumn?: (column: number, ascending?: boolean) => void
  sortColumn?: number | null
  sortDirection?: SortDirection
}

export interface Mission {
  id: string
  category: string
  name: string
  task?: string
  description?: string
  vehicle?: string
  ranBy?: string
  ranOn?: string
  ranAt?: string
  waypointCount?: number
  recentRun?: boolean
  frequentRun?: boolean
}

export const MissionTable: React.FC<MissionTableProps> = ({
  className,
  style,
  missions,
  selectedId,
  onSelectMission,
  onSortColumn,
  sortColumn,
  sortDirection,
}) => {
  const shouldShowVehicleColumn = missions.some((p) => p.recentRun)
  const missionRows = missions.map(
    ({
      category,
      name,
      task,
      description,
      ranBy,
      ranOn,
      ranAt,
      waypointCount,
      vehicle,
    }) => ({
      cells: [
        {
          label: category ? `${category}: ${name}` : `${name}`,
          secondary: task,
        },
        shouldShowVehicleColumn
          ? {
              label: capitalize(vehicle ?? 'Current Vehicle'),
            }
          : null,
        {
          label: description ? description : 'No description',
          secondary: `${(ranBy && `Last ran by ${ranBy}`) ?? ''} 
            ${(ranOn && `on ${ranOn}.`) ?? ''} 
            ${(ranAt && `Location ran at: ${ranAt}.`) ?? ''}
            ${
              (waypointCount &&
                `This mission has ${waypointCount} waypoints`) ??
              ''
            }`,
        },
      ].filter((i) => i),
    })
  ) as TableProps['rows']

  const header = {
    cells: [
      {
        label: 'MISSION NAME',
        onSort: onSortColumn,
      },
      shouldShowVehicleColumn
        ? {
            label: 'VEHICLE',
            onSort: onSortColumn,
          }
        : null,
      { label: 'DESCRIPTION', onSort: onSortColumn },
    ].filter((i) => i),
    activeSortColumn: sortColumn,
    activeSortDirection: sortDirection,
  } as TableProps['header']

  const handleSelect = (index: number) => {
    onSelectMission?.(missions[index].id)
  }

  return (
    <Table
      className={clsx('', className)}
      style={style}
      scrollable
      header={header}
      rows={missionRows}
      onSelectRow={onSelectMission && handleSelect}
      selectedIndex={
        selectedId ? missions.findIndex(({ id }) => id === selectedId) : null
      }
    />
  )
}

MissionTable.displayName = 'Tables.MissionTable'
