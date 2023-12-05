const fs = require('fs')
const axios = require('axios')
const path = require('path')
const FormData = require('form-data')
const filePath = path.resolve(__dirname, '..', 'dist', 'js')

console.log(filePath)
const uploadUrl = 'http://localhost:3000/upload'

// 遍历文件夹中的sourcemap文件
fs.readdir(filePath, (err, files) => {
  if (err) {
    console.error('读取文件夹失败:', err)
    return
  }

  files.forEach(file => {
    if (file.endsWith('.js.map')) {
      const sourceMapPath = `${filePath}/${file}`
      // 读取sourcemap文件
      fs.readFile(sourceMapPath, (err, data) => {
        if (err) {
          console.error('读取文件失败:', err)
          return
        }
        const formData = new FormData()
        // 添加文件
        formData.append('file', data, file)
        // 发送POST请求上传文件
        axios
          .post(uploadUrl, formData, {
            headers: formData.getHeaders(),
          })
          .then(response => {
            console.log('文件上传成功:', response.data)
          })
          .catch(error => {
            console.error('文件上传失败:')
          })
      })
    }
  })
})
