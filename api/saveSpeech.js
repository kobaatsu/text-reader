const { writeFile } = require('fs/promises')
const path = require('path')
const dayjs = require('dayjs')
const textToSpeech = require('@google-cloud/text-to-speech')

module.exports = async (req, res) => {
  if (!req.body?.text) res.status(400).end()
  const text = req.body.text
  const projectId = process.env.PROJECT_ID
  const keyFilename = path.join(__dirname, './auth/privatekey.json')
  const client = new textToSpeech.TextToSpeechClient({
    projectId,
    keyFilename,
  })

  // Construct the request
  const request = {
    input: { text },
    // Select the language and SSML voice gender (optional)
    voice: {
      languageCode: req.body?.languageCode || 'ja-JP',
      name: req.body?.name || 'ja-JP-Standard-A',
      ssmlGender: req.body?.ssmlGender || 'MALE',
    },
    // select the type of audio encoding
    audioConfig: {
      audioEncoding: req.body?.encode || 'MP3',
      speakingRate: req.body?.rate || 0.8,
    },
  }

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request)

  const fileName = `speech/${dayjs().format('YYYYMMDDHHmmss')}.mp3`
  const filePath = path.join(__dirname, '../static/' + fileName)
  await writeFile(filePath, response.audioContent, 'binary')
  res.json({ text, fileName })
}
