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
  ssmDocuments:

    dropCache:
      description: Drop system cache # document description
      workingDirectory: /tmp # working directory used by command
      scriptFile: ./ssm/dropCache/script.sh
      schemaVersion: '2.2'
      tags:
        - Key: MyTagKey
          Value: MyTagValue

    cleanCache:
      name: ${self:provider.stage, opt:stage}-CleanCache # document name, default is key config name (e.g. CleanCache)
      description: Clean system temporary directory 
      parameters: 
        Directory: # parameters can be configured here
          type: String
          default: test
      scriptFile: ./ssm/cleanCache/script.sh
    
    checkCache:
      name: ${self:provider.stage, opt:stage}-CheckCache
      description: Check cache size
      parameters: ${file(./ssm/checkCache/parameters.yml)} # or in a separate file
      scriptFile: ./ssm/checkCache/script.sh # script file must be a valid file path
```

### Parameters

Refer to [SSM Document Syntax for Parameters](https://docs.aws.amazon.com/en_us/systems-manager/latest/userguide/ssm-plugins.html#top-level). For example you can include an external file `parameters.yml` that contain the follow:
```yml
Directory: # parameter name (is the key of config object)
  type: String # parameter type
  default: test # parameter default value
  allowedPattern: "^(?!\/).*.[^\/]$" # regular expression to filter value
  description: "(Optional) Temporary directory, must not start or end with a slash." # parameter description
```
please prepend '(Optional) ' to optional parameters description.

### Script file

Script file can be a simple shell script, it will be executed using [aws-runShellScript plugin](https://docs.aws.amazon.com/en_us/systems-manager/latest/userguide/ssm-plugins.html#aws-runShellScript).
```bash
#!/bin/bash

echo "$(date +'%F-%T') executing tmp directory cleaning.."
rm -rf /tmp/{{ Directory }}/*
echo "$(date +'%F-%T') tmp directory '{{ Directory }}' cleaned successfully!"
```
interpolate a parameter using `{{ }}` syntax and refer parameter by its own name `{{ ParameterName }}`.

## Resources Created

This plugin will create one [AWS::SSM::Document](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/aws-resource-ssm-document.html) for each `ssmDocuments` configurations keys. 

CloudFormation resources can be referenced using your configuration key name, converted in camel-case (`my-command` -> `MyCommand`) and "SSMDocument" appended to it. For example:
```yaml
custom:
  ssmDocuments:
    cleanCache:
      # document configurations
```
will create the follow resource:
```js
{
  "Resources": {
    "CleanCacheSSMDocument": {
      // document configurations
    }
  }
}
```
can be referenced in this way:
```yaml
iamRoleStatements:
  - Effect: Allow
    Action:
      - ssm:SendCommand
    Resource:
      Ref: CleanCacheSSMDocument
```
