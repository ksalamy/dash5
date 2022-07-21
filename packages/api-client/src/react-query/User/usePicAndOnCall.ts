import { getPicAndOnCall, GetPicAndOnCallParams } from '../../axios'
import { useQuery } from 'react-query'
import { useTethysApiContext } from '../TethysApiProvider'
import { SupportedQueryOptions } from '../types'

export const usePicAndOnCall = (
  params: GetPicAndOnCallParams,
  options?: SupportedQueryOptions
) => {
  const { axiosInstance, token } = useTethysApiContext()
  const query = useQuery(
    ['users', 'picAndOnCall', params],
    () => {
      return getPicAndOnCall(params, {
        instance: axiosInstance,
        headers: { Authorization: `Bearer ${token}` },
      })
    },
    {
      staleTime: 5 * 60 * 1000,
      ...options,
    }
  )
  return query
}
