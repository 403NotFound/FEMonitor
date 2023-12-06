import { Config, setConfig } from './config'
import ErrorStackParser from 'error-stack-parser'
import { getCommonMessage } from './utils'
import axios from 'axios'
import * as rrweb from 'rrweb'
// import heatmap from 'heatmap.js'
import heatmap from './lib/heatmap'
class FEMonitor {
  init(options, fn) {
    if (options && !options.token) {
      console.warn('token miss')
      return
    }
    this.events = []
    setConfig(options)
    this.handleCaptureErrors()
    this.handleCaptureBehaviorMessages()
    this.handleRecordScreenSnapshort()
    fn && fn()
    // this.heatmap = heatmap()
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
    console.log(e)
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
    const { layerX, layerY } = e
    const commonMsg = getCommonMessage()

    const data = {
      ...commonMsg,
      type: 'ui.click',
      data: {
        point: [layerX, layerY],
        x: layerX,
        y: layerY,
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
      checkoutEveryNms: 10 * 1000, // 每10s重新制作快照
      checkoutEveryNth: 200, // 每 200 个 event 重新制作快照
    })
    setInterval(() => {
      this.report({ type: 'record', data: _this.events })
    }, 10000)
  }

  report(data) {
    console.log(data)
    axios
      .post(Config.reportUrl, data)
      .then(response => {
        console.log(response.data)
      })
      .catch(error => {
        console.error(error)
      })
  }
}

export default new FEMonitor()
