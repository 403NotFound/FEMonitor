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

function fixPath(filepath) {
  return filepath.replace(/\.[\.\/]+/g, '')
}

router.post('/report', async ctx => {
  const body = ctx.request.body
  console.log(body.type)
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
    return
  }
  if (body.type === 'vueError') {
    const body = ctx.request.body
    const { file, col, line } = body.data
    const sourcemapFiles = fs
      .readdirSync(sourcemapDir)
      .filter(_file => _file.includes(file))

    if (sourcemapFiles.length) {
      const sourcesPathMap = {}
      const targetFilePath = path.join(sourcemapDir, '.', sourcemapFiles[0])
      const data = fs.readFileSync(targetFilePath).toString()
      // sourcemap 文件对象
      const dataObj = JSON.parse(data)
      const sources = dataObj.sources
      const smc = await new sourceMap.SourceMapConsumer(data)
      const originalPosition = smc.originalPositionFor({
        // 获取 出错代码 在 哪一个源文件及其对应位置
        line: line,
        column: col,
      })
      dataObj.sources.map(item => {
        sourcesPathMap[fixPath(item)] = item
      })
      const originSource = sourcesPathMap[originalPosition.source]
      //  文件内容
      const fileContent = dataObj.sourcesContent[sources.indexOf(originSource)]
      // 检查文件夹是否存在如果不存在则新建文件夹
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
        fs.writeFileSync(filePath, JSON.stringify({ vueError: [{ ...body }] }))
      } else {
        const _data = fs.readFileSync(filePath)
        const file = JSON.parse(_data.toString())
        file['vueError']
          ? file['vueError'].push(body)
          : (file['vueError'] = [{ ...body }])
        fs.writeFileSync(filePath, JSON.stringify(file))
      }

      ctx.body = {
        status: 200,
        res: originalPosition,
        file: fileContent,
        // sources: file.sources,
      }
      return
    } else {
      // 检查文件夹是否存在如果不存在则新建文件夹
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir)
        fs.writeFileSync(
          filePath,
          JSON.stringify({ [body.type]: [{ ...body }] })
        )
      } else {
        const _data = fs.readFileSync(filePath)
        const file = JSON.parse(_data.toString())
        file[body.type]
          ? file[body.type].push(body)
          : (file[body.type] = [{ ...body }])
        fs.writeFileSync(filePath, JSON.stringify(file))
      }
      ctx.body = {
        status: 200,
        res: '玩呢？',
      }
      return
    }
  }
  // 检查文件夹是否存在如果不存在则新建文件夹
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
    fs.writeFileSync(filePath, JSON.stringify({ [body.type]: [{ ...body }] }))
  } else {
    const _data = fs.readFileSync(filePath)
    const file = JSON.parse(_data.toString())
    file[body.type]
      ? file[body.type].push(body)
      : (file[body.type] = [{ ...body }])
    fs.writeFileSync(filePath, JSON.stringify(file))
  }
  ctx.body = {
    status: 200,
    res: '还没写，等等吧',
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

module.exports = router
