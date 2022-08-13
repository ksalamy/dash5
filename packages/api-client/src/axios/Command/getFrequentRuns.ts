// Use scaffold axiosBase to generate the resources imported below.
import { getInstance } from '../getInstance'
import { RequestConfig } from '../types'

export interface GetFrequentRunsParams {
  vehicle: string
  limit?: number
}

export type GetFrequentRunsResponse = string[]

export const getFrequentRuns = async (
  params: GetFrequentRunsParams,
  { debug, instance = getInstance(), ...config }: RequestConfig = {}
) => {
  const url = '/commands/frequent/runs'

  if (debug) {
    console.debug(`GET ${url}`)
  }

  const response = await instance.get(url, { ...config, params })
  return response.data.result as GetFrequentRunsResponse
}
