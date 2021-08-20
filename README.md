# text-reader

## Build Setup

```bash
# install dependencies
$ yarn install

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```

For detailed explanation on how things work, check out the [documentation](https://nuxtjs.org).

## 使い方

1. GCP にプロジェクトを作るか、または既存のプロジェクトを指定して [`Cloud Text-to-Speech API`](https://cloud.google.com/text-to-speech?hl=ja) を有効にします
1. API の認証情報からサービスアカウントキーの JSON を作成して `/api/auth/privatekey.json` としておいてください
1. `.env` に `PROJECT_ID=hogehoge` という形で project 名を書いてください
1. nuxt で動いているので `yarn dev` とかで動きます
