# FEMonitor 前端监控SDK

- 错误上报
  - 页面报错
  - 页面资源报错
  - ajax报错
  - js报错
  - fetch报错
  - promise报错
- 用户行为监控
  - 用户点击
  - 用户操作记录
- 页面性能监控
  - whiteScreenTime
  - tcpTime
  - requestTime
  - dnsTime
  - parseDOMTime
  - firstRenderTime
  - onloadTime
  - readyTime
- PV、UV

### 调试
```bash
# 安装外部依赖
npm i
# 安装调试项目依赖
cd vue-demo
npm i

# 运行调试项目
npm run dev

# 运行后端服务
npm run server

```


### 用法
- Vue项目

```js
import FEMonitor from 'femonitor'

Vue.use(FEMonitor, {
  reportUrl: '',
  token: ''
})
```

- 非Vue项目

```js
import FEMonitor from 'femonitor'

FEMonitor({
  reportUrl: '',
  token: ''
})

```