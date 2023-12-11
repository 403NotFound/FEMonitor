const Router = require('koa-router')
const fs = require('fs')
const path = require('path')
const sourceMap = require('source-map')
const router = new Router()
const dir = path.resolve(__dirname, '..', 'data')
const filePath = path.join(dir, 'point.json')
const recordPath = path.join(dir, 'record.json')
const sourcemapDir = path.resolve(__dirname, '..', 'sourcemap') // 新增sourcemap文件夹路径

router.get('/', ctx => {
  ctx.body = 'hello Koa'
})

function fixPath(filepath) {
  return filepath.replace(/\.[\.\/]+/g, '')
}

const handleReport = async (ctx, body) => {
  const { type } = body
  console.log(type)
  if (type === 'ui.click') {
    handleUIClick(body, type)
    console.log(body.data.point)
    ctx.body = {
      status: 200,
      res: 'success',
    }
    return
  }
  if (type === 'vueError') {
    handleVueError(body, type)
    ctx.body = {
      status: 200,
      res: 'success',
    }
    return
  }
  if (type === 'record') {
    handleRecord(body, type)
    ctx.body = {
      status: 200,
      res: 'success',
    }
    return
  }
  handleDefault(body, type)
  ctx.body = {
    status: 200,
    res: 'success',
  }
}

const handleUIClick = (data, type) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
    fs.writeFileSync(filePath, JSON.stringify({ 'ui.click': [{ ...data }] }))
  } else {
    const file = readJSONFile(filePath)
    file['ui.click']
      ? file['ui.click'].push(data)
      : (file['ui.click'] = [{ ...data }])
    writeJSONFile(filePath, file)
  }
}

const handleVueError = async (data, type) => {
  const { file, col, line } = data
  const sourcemapFiles = fs
    .readdirSync(sourcemapDir)
    .filter(_file => _file.includes(file))

  if (sourcemapFiles.length) {
    const sourcesPathMap = {}
    const targetFilePath = path.join(sourcemapDir, '.', sourcemapFiles[0])
    const sourcemapData = fs.readFileSync(targetFilePath).toString()
    const sourcemapObj = JSON.parse(sourcemapData)
    const sources = sourcemapObj.sources
    const smc = await new sourceMap.SourceMapConsumer(sourcemapData)
    const originalPosition = smc.originalPositionFor({
      line: line,
      column: col,
    })
    sourcemapObj.sources.map(item => {
      sourcesPathMap[fixPath(item)] = item
    })
    const originSource = sourcesPathMap[originalPosition.source]
    const fileContent =
      sourcemapObj.sourcesContent[sources.indexOf(originSource)]

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      fs.writeFileSync(filePath, JSON.stringify({ vueError: [{ ...data }] }))
    } else {
      const file = readJSONFile(filePath)
      file['vueError']
        ? file['vueError'].push(data)
        : (file['vueError'] = [{ ...data }])
      writeJSONFile(filePath, file)
    }

    ctx.body = {
      status: 200,
      res: originalPosition,
      file: fileContent,
    }
    return
  } else {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir)
      fs.writeFileSync(filePath, JSON.stringify({ [type]: [{ ...data }] }))
    } else {
      const file = readJSONFile(filePath)
      file[type] ? file[type].push(data) : (file[type] = [{ ...data }])
      writeJSONFile(filePath, file)
    }
    ctx.body = {
      status: 200,
      res: '玩呢？',
    }
    return
  }
}

const handleRecord = (data, type) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
    fs.writeFileSync(recordPath, JSON.stringify({ record: [{ ...data }] }))
  } else {
    writeJSONFile(recordPath, data)
  }
}

const handleDefault = (data, type) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
    fs.writeFileSync(filePath, JSON.stringify({ [type]: [{ ...data }] }))
  } else {
    const file = readJSONFile(filePath)
    file[type] ? file[type].push(data) : (file[type] = [{ ...data }])
    writeJSONFile(filePath, file)
  }
}

const readJSONFile = filePath => {
  const data = fs.readFileSync(filePath)
  return JSON.parse(data.toString())
}

const writeJSONFile = (filePath, data) => {
  fs.writeFileSync(filePath, JSON.stringify(data))
}

router.post('/report', async ctx => {
  const body = ctx.request.body
  await handleReport(ctx, body)
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

// 上传用户录屏数据
router.post('/record', async ctx => {
  const body = ctx.request.body
  // 检查文件夹是否存在如果不存在则新建文件夹
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir)
    fs.writeFileSync(recordPath, JSON.stringify({ [body.type]: [{ ...body }] }))
  } else {
    const _data = fs.readFileSync(recordPath)
    const file = JSON.parse(_data.toString())
    file[body.type]
      ? file[body.type].push(body)
      : (file[body.type] = [{ ...body }])
    fs.writeFileSync(recordPath, JSON.stringify(file))
  }
})

// 上传用户录屏数据
router.get('/record', async ctx => {
  const body = ctx.request.body
  // 检查文件夹是否存在如果不存在则新建文件夹
  const _data = fs.readFileSync(recordPath)
  const file = JSON.parse(_data.toString())
  ctx.body = {
    status: 200,
    file: file,
  }
})

router.get('/point', async ctx => {
  // 检查文件夹是否存在如果不存在则新建文件夹
  const _data = fs.readFileSync(filePath)

  console.log(_data)
  const file = JSON.parse(_data.toString())
  ctx.body = {
    status: 200,
    file: file,
  }
})

router.post('/form', async ctx => {
  // 检查文件夹是否存在如果不存在则新建文件夹
  const body = ctx.request.body
  console.log(body.attachment)
  ctx.body = {
    status: 200,
    data: body.attachment,
  }
})

router.get('/data', async ctx => {
  const data = readJSONFile(filePath)
  ctx.body = {
    status: 200,
    data: data,
  }
})
module.exports = router
