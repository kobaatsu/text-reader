<template>
  <el-container>
    <el-main>
      <el-row>
        <el-col>
          <canvas ref="canvas" width="640" height="360"></canvas>
        </el-col>
      </el-row>
      <el-row v-if="files.length">
        <el-col>
          <el-select
            v-model="selectedFile"
            placeholder="Select"
            :disabled="isPlaying"
            @change="onChangeSelectedFile"
          >
            <el-option
              v-for="(item, i) in files"
              :key="i"
              :label="item"
              :value="item"
            >
            </el-option>
          </el-select>
          <el-button
            type="primary"
            icon="el-icon-chat-dot-round"
            :disabled="!selectedFile || isPlaying"
            @click="onPlay"
            >SPEAK</el-button
          >
          <el-button icon="el-icon-close" :disabled="!isPlaying" @click="onStop"
            >STOP</el-button
          >
          <el-link
            type="success"
            icon="el-icon-download"
            :href="movieUrl"
            :disabled="!movieUrl"
            :download="movieFile"
            >DOWNLOAD MOVIE</el-link
          >
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <el-input
            v-model="text"
            type="textarea"
            :rows="10"
            placeholder="Please input"
          >
          </el-input>
        </el-col>
      </el-row>
      <el-row>
        <el-col>
          <el-button
            type="primary"
            icon="el-icon-check"
            :disabled="!text"
            @click="onSaveSpeech"
            >SAVE SPEECH</el-button
          >
        </el-col>
      </el-row>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'IndexPage',
  data() {
    return {
      audioCtx: null,
      canvasCtx: null,
      cell: {
        close: null,
        half: null,
        open: null,
      },
      files: [],
      isPlaying: false,
      movieFile: '',
      movieUrl: null,
      selectedFile: '',
      text: '',
    }
  },
  async mounted() {
    this.files = await this.getSpeech()
    // 画像object初期化
    this.cell.close = new Image()
    this.cell.close.src = '/face_normal.png'
    this.cell.half = new Image()
    this.cell.half.src = '/face_open_light.png'
    this.cell.open = new Image()
    this.cell.open.src = '/face_open.png'
    // canvas初期化
    this.canvasCtx = this.$refs.canvas.getContext('2d')
    this.canvasCtx.fillStyle = '#FFF'
    this.canvasCtx.fillRect(0, 0, 640, 360)
    this.canvasCtx.strokeStyle = '#ccc'
    this.canvasCtx.strokeRect(0, 0, 640, 360)
    this.cell.close.onload = () => {
      this.drawImage(this.cell.close)
    }
  },
  methods: {
    drawImage(imgObj) {
      this.canvasCtx.drawImage(imgObj, 170, 0, 300, 400)
    },
    async getSpeech() {
      const { files } = await this.$axios.$get('/api/getSpeech')
      return files
    },
    async onStop() {
      this.isPlaying = false
      await this.audioCtx.close()
      this.drawImage(this.cell.close)
    },
    async onPlay() {
      this.isPlaying = true
      const speechPath = `/speech/${this.selectedFile}.mp3`
      this.audioCtx = new AudioContext()
      const speech = await fetch(speechPath)
      const arrayBuffer = await speech.arrayBuffer()
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer)
      const audioSrc = new AudioBufferSourceNode(this.audioCtx, {
        buffer: audioBuffer,
      })

      // 録音用のstream
      const mediaStreamDest = this.audioCtx.createMediaStreamDestination()
      const { stream: audioStream } = mediaStreamDest
      audioSrc.connect(mediaStreamDest)

      // 解析用のNode
      const analyser = new AnalyserNode(this.audioCtx)
      analyser.fftSize = 512

      // 接続
      audioSrc.connect(analyser).connect(this.audioCtx.destination)

      const fps = 12

      const canvasStream = this.$refs.canvas.captureStream(fps)
      const streams = [canvasStream, audioStream]
      const mediaStream = new MediaStream()
      streams.forEach((stream) => {
        stream.getTracks().forEach((track) => mediaStream.addTrack(track))
      })
      const recorder = new MediaRecorder(mediaStream, {
        mimeType: 'video/webm;codecs=vp9',
      })

      recorder.start()
      audioSrc.start()

      let prevSpectrum = 0
      const samplingInterval = setInterval(() => {
        const spectrums = new Uint8Array(analyser.fftSize)
        analyser.getByteFrequencyData(spectrums)
        const totalSpectrum = spectrums.reduce((acc, cur) => acc + cur)
        if (totalSpectrum < 2000) {
          this.drawImage(this.cell.close)
        } else if (totalSpectrum > prevSpectrum) {
          this.drawImage(this.cell.open)
        } else if (prevSpectrum - totalSpectrum < 500) {
          this.drawImage(this.cell.half)
        } else {
          this.drawImage(this.cell.close)
        }
        prevSpectrum = totalSpectrum
      }, 1000 / fps)

      audioSrc.onended = () => {
        recorder.stop()
        clearInterval(samplingInterval)
        this.onStop()
      }
      recorder.ondataavailable = (e) => {
        this.$notify({
          message: 'ムービーがダウンロードできます',
          type: 'info',
        })
        const videoBlob = new Blob([e.data], { type: e.data.type })
        this.movieUrl = window.URL.createObjectURL(videoBlob)
        this.movieFile = `movie_${this.selectedFile}.webm`
      }
    },
    onChangeSelectedFile(e) {
      this.selectedFile = e
    },
    async onSaveSpeech() {
      const { fileName } = await this.$axios
        .$post('/api/saveSpeech', {
          text: this.text,
          languageCode: 'ja-JP',
          name: 'ja-JP-Standard-B',
          ssmlGender: 'FEMALE',
        })
        .catch((e) => {
          console.error(e)
          this.$notify({
            message: 'エラーが発生しました',
            type: 'error',
          })
          return false
        })
      if (fileName) {
        this.files = await this.getSpeech()
        this.$notify({
          message: '音声ファイルが生成されました',
          type: 'success',
        })
      }
    },
  },
}
</script>

<style>
.el-row + .el-row {
  margin-top: 20px;
}
canvas {
  width: 640px;
  display: block;
  margin-right: auto;
  margin-left: auto;
}
</style>
