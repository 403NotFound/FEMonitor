const Koa = require('koa')
const app = new Koa()
const cors = require('koa2-cors')
const { koaBody } = require('koa-body')
const Router = require('koa-router')
const fs = require('fs')
const sourceMap = require('source-map')
const router = new Router()
const path = require('path')
const sourcemapDir = path.resolve(__dirname, '.', 'sourcemap') // 新增sourcemap文件夹路径

// 处理跨域
app.use(
  cors({
    //设置允许来自指定域名请求
    origin: ctx => {
      return '*' // 允许来自所有域名请求
    },
    maxAge: 5, //指定本次预检请求的有效期，单位为秒。
    credentials: true, //是否允许发送Cookie
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], //设置所允许的HTTP请求方法
    allowHeaders: ['Content-Type', 'Authorization', 'Accept'], //设置服务器支持的所有头信息字段
    exposeHeaders: ['WWW-Authenticate', 'Server-Authorization'], //设置获取其他自定义字段
  })
)
app.use(
  koaBody({
    multipart: true,
  })
)

router.get('/', ctx => {
  ctx.body = {
    status: 200,
  }
})

const dir = path.resolve(__dirname, '.', 'data')
const filePath = path.join(dir, 'point.json')

router.post('/report', async ctx => {
  const body = ctx.request.body
  console.log(body)
  if (body.type === 'ui.click') {
    // ctx.body = {
    //   status: 200,
    //   res: 'success',
    // }
    // return

    const point = body.data.point
    // 检查文件夹是否存在如果不存在则新建文件夹
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      fs.writeFileSync(filePath, JSON.stringify({ point: [point] }))
    } else {
      const data = fs.readFileSync(filePath)
      const file = JSON.parse(data.toString())
      file.point.push(point)
      fs.writeFileSync(filePath, JSON.stringify(file))
    }
  }
  if (body.type === 'vueerror') {
    const body = ctx.request.body
    const { file, col, line } = body.data

    const sourcemapFiles = fs
      .readdirSync(sourcemapDir)
      .filter(_file => _file.includes(file))
    const targetFilePath = path.join(sourcemapDir, '.', sourcemapFiles[0])
    const data = fs.readFileSync(targetFilePath).toString()

    const smc = await new sourceMap.SourceMapConsumer(data)

    const originalPosition = smc.originalPositionFor({
      // 获取 出错代码 在 哪一个源文件及其对应位置
      line: line,
      column: col,
    })
    ctx.body = {
      status: 200,
      res: originalPosition,
    }
  }
})

// 新增upload接口

router.post('/upload', async ctx => {
  if (!ctx.request.files || !ctx.request.files.file) {
    ctx.body = {
      status: 400,
      message: 'No file uploaded',
    }
    return
  }
  if (!fs.existsSync(sourcemapDir)) {
    fs.mkdirSync(sourcemapDir)
  }

  const file = ctx.request.files.file // 获取上传的文件
  const reader = fs.createReadStream(file.filepath) // 创建可读流
  const filePath = path.join(sourcemapDir, file.originalFilename) // 拼接文件路径
  const writer = fs.createWriteStream(filePath) // 创建可写流
  reader.pipe(writer) // 可读流通过管道写入可写流
  ctx.body = {
    status: 200,
    message: 'File uploaded successfully',
  }
})

app.use(router.routes()).use(router.allowedMethods())

app.listen(3000, () => {
  console.log('server is running on port 3000!')
})
