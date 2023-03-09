import axios from 'axios'
import type { InternalAxiosRequestConfig,AxiosResponse, AxiosError } from 'axios';
// import type { AutoCompleteProps } from 'antd/es/auto-complete';
const service = axios.create({
  // baseURL: process.env.REACT_APP_BASE_API,
  baseURL: 'https://18.179.8.186:8081',
  withCredentials: true, // send cookies when cross-domain requests
  timeout: 50000 // request timeout
})

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)


// response interceptor
service.interceptors.response.use(
  (response: AxiosResponse) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // const { rc,msg,result } = response.data
    // if (rc === 0) {
    //   return result
    // } else {
    //   return response
    // }
    return response.data
  },
  (error:AxiosError) => {
    return Promise.reject(error)
  }
)

export default service