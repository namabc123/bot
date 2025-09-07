import axios from 'axios'
// import getCookie from '../CustomFunctions/GetCookie'
import { fetchAuthSession } from 'aws-amplify/auth'

export function getHostApi() {
  return typeof window !== 'undefined' ? window.location.origin + '/api/' : process.env.API_PROD_URL
}

const client = axios.create({
  baseURL: getHostApi(),
  headers: {
    Accept: 'application/json',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
    'Expires': '0',
  },
})

const request = async ({ ...options }, router) => {
  const token = await fetchAuthSession()
    .then(session => session?.tokens?.idToken?.toString())
    .catch(error => null)

  client.defaults.headers.common.Authorization = token ? `Bearer ${token}` : undefined
  const onSuccess = response => response
  const onError = error => {
    if (error?.response?.status == 403) {
      router && router.push('/403')
    }
    router && router.push('/404')
    // console.log('error axios-utils', error?.response?.status)
    return error
  }
  try {
    const response = await client(options)
    return onSuccess(response)
  } catch (error) {
    return onError(error)
  }
}

export default request
