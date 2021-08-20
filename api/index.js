const app = require('express')()
const bodyParser = require('body-parser')

app.use(bodyParser.json())

app.get('/getSpeech', require('./getSpeech'))
app.post('/saveSpeech', require('./saveSpeech'))

module.exports = app
