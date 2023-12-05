// interface ConfigOptions {
//   reportUrl: string // 上报地址
//   token: string // 用户token
//   [propName: string]: any
// }
export let Config = {
  reportUrl: '',
  token: '',
}

export const setConfig = options => {
  Config = {
    ...Config,
    ...options,
  }
}

export const getConfig = key => {
  return key ? (Config[key] ? Config[key] : {}) : {}
}
