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

FEMonitor.init({
  reportUrl: '',
  token: ''
})

```

### 目录结构
```bash
├── README.md
├── base.drawio
├── config 配置文件
│   └── index.js
├── index.js sdk 入口文件
├── interface
├── lib 热力图库文件（无用）
│   └── heatmap.js
├── node_modules
├── package-lock.json
├── package.json
├── server 后端代码
│   ├── controllers
│   ├── data 接口上报的数据存储目录
│   ├── index.js 入口文件
│   ├── routes 接口路由文件
│   └── sourcemap 前端上传的sourcemap存储目录
├── utils 公共参数
│   └── index.js
└── vue-demo 前端demo项目
    ├── README.md
    ├── babel.config.js
    ├── build
    ├── dist
    ├── jsconfig.json
    ├── node_modules
    ├── package-lock.json
    ├── package.json
    ├── public
    ├── src
    └── vue.config.js
```