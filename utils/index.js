import { Config } from '../config'

export const getCommonMessage = () => {
  let data = {
    type: '',
    page: location.pathname,
    token: Config.token,
    time: new Date().getTime(),
    href: location.href,
    screen: screen.width + 'x' + screen.height,
    isMobile: navigator.userAgentData && navigator.userAgentData.mobile,
    platform: navigator.userAgentData && navigator.userAgentData.platform,
  }
  return data
}
