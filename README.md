# cdktf-rdsevent-chatbot

CDK For Terraform RDS Event Chatbot

## 前提条件

- ChatbotとSlackの連携が完了していること。詳細は[こちら](https://aws.amazon.com/jp/builders-flash/202006/slack-chatbot/?awsf.filter-name=*all)を参照してください。

## Setup

- node module install

```sh
cdktf init --template="typescript" --providers="aws@~>5.0"
```

```sh
make install
```
