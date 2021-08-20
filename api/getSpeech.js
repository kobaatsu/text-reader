const { readdir } = require('fs/promises')
const path = require('path')

module.exports = async (req, res) => {
  let files = []
  const filesOrg = await readdir(path.join(__dirname, '../static/speech'))
  if (filesOrg.length) {
    files = filesOrg
      .filter((elm) => /\.mp3$/.test(elm))
      .map((elm) => elm.replace(/\.mp3$/, ''))
    files.sort((a, b) => (b > a ? 1 : -1))
  }
  res.json({ files })
}
