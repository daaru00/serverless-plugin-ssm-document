# Serverless SSM documents

[![npm](https://img.shields.io/npm/v/serverless-plugin-ssm-document.svg)](https://www.npmjs.com/package/serverless-plugin-ssm-document)

A [serverless](https://serverless.com) plugin to easily create SSM document from configurations files.

## Usage

### Installation

```bash
$ npm install serverless-plugin-ssm-document --save-dev
```
or using yarn
```bash
$ yarn add serverless-plugin-ssm-document
```

### Configuration

```yaml
plugins:
  - serverless-plugin-ssm-document

custom:
  skipSSMDocumentsPolicy: false # disable IAM role manipulation to execute commands
  ssmDocuments:
    cleanCache:
      name: ${self:provider.stage, opt:stage}-CleanCache # document name, default is key config name (e.g. cleanCache)
      description: Clean system temporary directory # document description
      parameters: ${file(./ssm/cleanCache/parameters.yml)} # can be an interpolated file
      scriptFile: ./ssm/cleanCache/script.sh # script file path
```

### Parameters

Refer to [SSM Document Syntax for Parameters](https://docs.aws.amazon.com/en_us/systems-manager/latest/userguide/ssm-plugins.html#top-level). For example you can include an external files that contain the follow:
```yml
# ./ssm/cleanCache/parameters.yml

Path:
  type: String
  default: /tmp
  allowedPattern: "^.*\/$"
  description: "(Optional) Temporary directory, must not end with a slash."
```

### Script file

Script file can be a simple shell script, will be included using [aws-runShellScript plugin](https://docs.aws.amazon.com/en_us/systems-manager/latest/userguide/ssm-plugins.html#aws-runShellScript).

```bash
#!/bin/bash
# ./ssm/cleanCache/script.sh

echo "$(date +'%F-%T') executing clean tmp directory"
rm -rf {{ CacheTypes }}/*
echo "$(date +'%F-%T') tmp directory clean completed"
```
