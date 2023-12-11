import { Config, setConfig } from './config'
import ErrorStackParser from 'error-stack-parser'
import { getCommonMessage } from './utils'
import axios from 'axios'
import * as rrweb from 'rrweb'
class FEMonitor {
  constructor() {
    this.events = []
    this.heatmapInstance = null
  }

  init(options, fn) {
    if (options && !options.token) {
      console.warn('token miss')
      return
    }
    setConfig(options)
    this.handleCaptureErrors()
    this.handleCaptureAjaxErrors()
    this.handleCaptureFetchErrors()
    window.onload = () => {
      setTimeout(() => {
        this.handleCapturePerformance()
      }, 0)
    }
    this.handleCaptureBehaviorMessages()
    options.record && this.handleRecordScreenSnapshort()
    fn && fn()
  }
  // for vue
  install(Vue, options) {
    console.log('Vue SDK init success')
    if (!Vue) return
    this.init(options, () => this.handleCaptureVueErrors(Vue))
  }

  handleCaptureErrors() {
    // 捕获页面js错误
    window.addEventListener('error', e => this.handleCaptureJSErrors(e), false)
    window.addEventListener(
      'error',
      e => this.handleCaptureSourceErrors(e),
      true
    )
    // 捕获 promise 错误
    window.addEventListener('unhandledrejection', e =>
      this.handleCapturePromiseErrors(e)
    )
  }

  handleCaptureJSErrors(e) {
    const { filename, lineno, message, colno, error } = e
    const commonMsg = getCommonMessage()
    const data = {
      ...commonMsg,
      type: 'jsError',
      data: {
        filename,
        lineno,
        message,
        colno,
        stack: error.stack,
      },
    }
    this.report(data)
  }
  // 资源加载错误
  handleCaptureSourceErrors(e) {
    // 过滤js的error
    const target = e.target
    const isElementTarget =
      target instanceof HTMLScriptElement ||
      target instanceof HTMLLinkElement ||
      target instanceof HTMLImageElement
    if (!isElementTarget) return false
    const url = target.src || target.href
    console.log(target, url, 'static')
    const commonMsg = getCommonMessage()
    const data = {
      ...commonMsg,
      type: 'resourceError',
      data: {
        url,
      },
    }
    this.report(data)
  }

  handleCapturePromiseErrors(e) {
    const commonMsg = getCommonMessage()
    const data = {
      ...commonMsg,
      type: 'promiseError',
      data: {
        message: (e && e.reason && e.reason.message) || '',
        stack: (e && e.reason && e.reason.stack) || '',
      },
    }
    this.report(data)
  }

  handleCaptureVueErrors(Vue) {
    Vue.config.errorHandler = (err, vm, info) => {
      const errorTrack = ErrorStackParser.parse(err)
      const file = errorTrack[0].fileName.split('/').pop()
      const commonMsg = getCommonMessage()
      const col = errorTrack[0].columnNumber
      const line = errorTrack[0].lineNumber
      const data = {
        ...commonMsg,
        type: 'vueError',
        data: {
          col,
          line,
          file,
        },
      }
      this.report(data)
    }
  }

  handleCaptureBehaviorMessages() {
    window.addEventListener('click', e => this.hadnleCaptureClickMessages(e))
    this.handlePv()
    this.handleUv()
  }

  // 捕获ajax错误
  handleCaptureAjaxErrors() {
    const commonMsg = getCommonMessage()
    const self = this

    const originalXHR = window.XMLHttpRequest
    if (originalXHR) {
      window.XMLHttpRequest = function () {
        const xhr = new originalXHR()

        xhr.addEventListener('error', function (event) {
          const data = {
            ...commonMsg,
            type: 'ajaxError',
            data: {
              url: xhr.responseURL,
              method: xhr.method,
              params: xhr.params,
              error: (event && event.error && event.error.message) || '',
            },
          }
          self.report(data)
        })

        return xhr
      }
    }
  }
  // 捕获fetch错误
  handleCaptureFetchErrors() {
    const commonMsg = getCommonMessage()
    const originalFetch = window.fetch
    const self = this

    if (originalFetch) {
      window.fetch = function (url, options) {
        return originalFetch.apply(this, arguments).catch(error => {
          const data = {
            ...commonMsg,
            type: 'fetchError',
            data: {
              url,
              method: options && options.method,
              params: options && options.body,
              error: error.message,
            },
          }
          self.report(data)
          throw error
        })
      }
    }
  }

  // 捕获性能指标
  handleCapturePerformance() {
    const commonMsg = getCommonMessage()
    const timing = window.performance.timing

    const calculateTime = (start, end) => end - start

    const whiteScreenTime = calculateTime(
      timing.navigationStart,
      timing.responseStart
    )
    const tcpTime = calculateTime(timing.connectStart, timing.connectEnd)
    const requestTime = calculateTime(timing.requestStart, timing.responseEnd)
    const dnsTime = calculateTime(
      timing.domainLookupStart,
      timing.domainLookupEnd
    )

    const parseDOMTime = calculateTime(
      timing.navigationStart,
      timing.domInteractive
    )
    const firstRenderTime = calculateTime(
      timing.navigationStart,
      timing.domContentLoadedEventEnd
    )
    const onloadTime = calculateTime(
      timing.navigationStart,
      timing.loadEventEnd
    )
    const readyTime = calculateTime(timing.navigationStart, timing.domComplete)

    const data = {
      ...commonMsg,
      type: 'performance',
      data: {
        whiteScreenTime,
        tcpTime,
        requestTime,
        dnsTime,
        parseDOMTime,
        firstRenderTime,
        onloadTime,
        readyTime,
      },
    }
    this.report(data)
  }

  handlePv() {
    let commonMsg = getCommonMessage()
    const data = {
      ...commonMsg,
      type: 'pv',
    }
    this.report(data)
  }

  // 在页面初始化时统计 UV
  handleUv() {
    if (!document.cookie.includes('uv')) {
      let commonMsg = getCommonMessage()
      const data = {
        ...commonMsg,
        type: 'uv',
      }
      this.report(data)

      let now = new Date()
      let tomorrow = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1
      )
      let expires = '; expires=' + tomorrow.toUTCString()

      document.cookie = 'uv=1' + expires + '; path=/'
    }
  }

  // 处理html node
  normalTarget(e) {
    var t,
      n,
      r,
      a,
      i,
      o = []
    if (!e || !e.tagName) return ''
    if (
      (o.push(e.tagName.toLowerCase()),
      e.id && o.push('#'.concat(e.id)),
      (t = e.className) &&
        '[object String]' === Object.prototype.toString.call(t))
    ) {
      for (n = t.split(/\s+/), i = 0; i < n.length; i++) {
        // className包含active的不加入路径
        if (n[i].indexOf('active') < 0) o.push('.'.concat(n[i]))
      }
    }
    var s = ['type', 'name', 'title', 'alt']
    for (i = 0; i < s.length; i++)
      (r = s[i]),
        (a = e.getAttribute(r)) && o.push('['.concat(r, '="').concat(a, '"]'))
    return o.join('')
  }

  // 获取元素路径，最多保留5层
  getElmPath(e) {
    if (!e || 1 !== e.nodeType) return ''
    var ret = [],
      deepLength = 0, // 层数，最多5层
      elm = '' // 元素
    ret.push(`(${e.innerText.substr(0, 50)})`)
    for (
      var t = e || null;
      t && deepLength++ < 5 && !('html' === (elm = this.normalTarget(t)));

    ) {
      ret.push(elm), (t = t.parentNode)
    }
    return ret.reverse().join(' > ')
  }

  hadnleCaptureClickMessages(e) {
    const { pageX, pageY } = e
    const commonMsg = getCommonMessage()

    const data = {
      ...commonMsg,
      type: 'ui.click',
      data: {
        point: [pageX / window.innerWidth, pageY / window.innerHeight],
        x: pageX / window.innerWidth,
        y: pageY / window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        // dom: this.getElmPath(e.target),
      },
    }
    this.report(data)
    // this.heatmapInstance.addData({
    //   x: layerX,
    //   y: layerY,
    //   value: 1,
    // })
  }

  handleCreateHeatMap() {
    const heatmapInstance = this.heatmap.create({
      container: document.documentElement,
      radius: 60,
    })

    return heatmapInstance
  }
  // 前端录屏
  handleRecordScreenSnapshort() {
    const _this = this
    rrweb.record({
      emit(event, isCheckout) {
        _this.events.push(event)
        isCheckout && (_this.events = [])
      },
      recordCanvas: true, // 记录 canvas 内容
      checkoutEveryNms: 60 * 1000, // 每10s重新制作快照
      checkoutEveryNth: 200, // 每 200 个 event 重新制作快照
    })
    setInterval(() => {
      this.report({ type: 'record', data: _this.events })
    }, 60000)
  }

  report(data) {
    console.log(data)
    axios
      .post(Config.reportUrl, data)
      .then(response => {
        console.log(response.data)
      })
      .catch(error => {
        console.log(error)
      })
  }
}

export default new FEMonitor()
