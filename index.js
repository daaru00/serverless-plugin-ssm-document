const fs = require('fs')
const os = require('os')

class ServerlessPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options

    this.hooks = {
      'before:package:finalize': this.createResources.bind(this)
    }
  }

  /**
   * Adding resources
   */
  createResources () {
    const ssmDocuments = this.serverless.service.custom.ssmDocuments

    if (ssmDocuments === undefined) {
      return
    }

    for (const documentName in ssmDocuments) {
      if (ssmDocuments.hasOwnProperty(documentName)) {
        const documentConfig = ssmDocuments[documentName]

        if (!documentConfig.scriptFile) {
          this.serverless.cli.log(`[warn] SSM document ${documentName} does not have 'scriptFile' defined`)
          continue
        }

        if (fs.lstatSync(documentConfig.scriptFile).isFile() === false) {
          this.serverless.cli.log(`[warn] Script file ${documentConfig.scriptFile} not found or not a valid file`)
          continue
        }

        const scriptContent = fs.readFileSync(documentConfig.scriptFile).toString()
        const schema = {
          'Type': 'AWS::SSM::Document',
          'Properties': {
            'Content': {
              'schemaVersion': '2.2',
              'description': documentConfig.description || `Command ${documentName}`,
              'parameters': documentConfig.parameters || {},
              'mainSteps': [
                {
                  'action': 'aws:runShellScript',
                  'name': 'ExecuteScript',
                  'inputs': {
                    'workingDirectory': documentConfig.workingDirectory,
                    'runCommand': scriptContent.split(os.EOL)
                  }
                }
              ]
            },
            'DocumentType': 'Command',
            'Tags': [
              {
                'Key': 'Name',
                'Value': documentConfig.name || documentName
              }
            ]
          }
        }

        const CFKey = documentName.charAt(0).toUpperCase() + documentName.slice(1)
        this.serverless.service.provider.compiledCloudFormationTemplate.Resources[`Command${CFKey}`] = schema
      }
    }

    this.updatePolicy()
  }

  /**
   * Update policy to executed commands from lambda
   */
  updatePolicy () {
    if (this.serverless.service.custom.skipSSMDocumentsPolicy === true) {
      return
    }

    const ssmDocuments = this.serverless.service.custom.ssmDocuments

    const iamRole = this.serverless.service.provider.compiledCloudFormationTemplate.Resources['IamRoleLambdaExecution']
    if (iamRole === undefined) {
      return
    }

    const policy = iamRole.Properties.Policies[0]
    if (policy === undefined) {
      return
    }

    const resources = []
    Object.keys(ssmDocuments).forEach((documentName) => {
      const CFKey = documentName.charAt(0).toUpperCase() + documentName.slice(1)
      resources.push({
        'Fn::Sub': [
          // eslint-disable-next-line no-template-curly-in-string
          'arn:aws:ssm:${AWS::Region}:${AWS::AccountId}:document/${DocumentId}',
          {
            'DocumentId': {
              'Ref': `Command${CFKey}`
            }
          }
        ]
      })
    })

    policy.PolicyDocument.Statement.push({
      'Effect': 'Allow',
      'Action': [
        'ssm:SendCommand'
      ],
      'Resource': resources
    })
  }
}

module.exports = ServerlessPlugin
