const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const sourceMap = require('source-map')
const router = new Router()
const dir = path.resolve(__dirname, '..', 'data')
const filePath = path.join(dir, 'point.json')
const sourcemapDir = path.resolve(__dirname, '..', 'sourcemap') // 新增sourcemap文件夹路径

router.get('/', ctx => {
  ctx.body = 'hello Koa'
})

router.post('/report', async ctx => {
  const body = ctx.request.body
  if (body.type === 'ui.click') {
    // 检查文件夹是否存在如果不存在则新建文件夹
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      fs.writeFileSync(filePath, JSON.stringify({ 'ui.click': [{ ...body }] }))
    } else {
      const data = fs.readFileSync(filePath)
      const file = JSON.parse(data.toString())
      file['ui.click']
        ? file['ui.click'].push(body)
        : (file['ui.click'] = [{ ...body }])
      fs.writeFileSync(filePath, JSON.stringify(file))
    }
    ctx.body = {
      status: 200,
      res: 'success',
    }
  }
  if (body.type === 'vueerror') {
    const body = ctx.request.body
    const { file, col, line } = body.data
    console.log(file, col, line, sourcemapDir)
    const sourcemapFiles = fs
      .readdirSync(sourcemapDir)
      .filter(_file => _file.includes(file))

    if (sourcemapFiles.length) {
      const targetFilePath = path.join(sourcemapDir, '.', sourcemapFiles[0])
      const data = fs.readFileSync(targetFilePath).toString()
      const smc = await new sourceMap.SourceMapConsumer(data)
      const originalPosition = smc.originalPositionFor({
        // 获取 出错代码 在 哪一个源文件及其对应位置
        line: line,
        column: col,
      })
      // 检查文件夹是否存在如果不存在则新建文件夹
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
        fs.writeFileSync(filePath, JSON.stringify({ vueerror: [{ ...body }] }))
      } else {
        const data = fs.readFileSync(filePath)
        const file = JSON.parse(data.toString())
        file['vueerror']
          ? file['vueerror'].push(body)
          : (file['vueerror'] = [{ ...body }])
        fs.writeFileSync(filePath, JSON.stringify(file))
      }
      ctx.body = {
        status: 200,
        res: originalPosition,
      }
    } else {
      ctx.body = {
        status: 200,
        res: '玩呢？',
      }
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
  console.log(!fs.existsSync(sourcemapDir))
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

module.exports = router
