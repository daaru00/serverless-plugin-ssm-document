const fs = require('fs')
const os = require('os')
const _ = require('lodash')
const SsmDocumentResource = require('../../helpers/resources/ssmDocument')

class Controller {
  /**
   * Execute hook
   */
  async execute () {
    if (this.config === undefined || Object.keys(this.config).length === 0) {
      return
    }

    // Init properties

    this.cloudFormationTemplate = this.serverless.service.provider.compiledCloudFormationTemplate

    // Load commands

    const documents = []
    for (const documentName in this.config) {
      if (this.config.hasOwnProperty(documentName)) {
        const documentConfig = this.config[documentName]

        // Load script file
        
        if (!documentConfig.scriptFile) {
          this.logger.warn(`SSM document ${documentName} does not have 'scriptFile' defined`)
          continue
        }

        if (fs.lstatSync(documentConfig.scriptFile).isFile() === false) {
          this.logger.warn(`Script file ${documentConfig.scriptFile} not found or not a valid file`)
          continue
        }
        const scriptContent = fs.readFileSync(documentConfig.scriptFile).toString()

        // Create SSM Document
        
        documentConfig.name = documentConfig.name || _.upperFirst(_.camelCase(documentName))
        documentConfig.description = documentConfig.description || `Command ${documentName}`

        const document = new SsmDocumentResource({
          documentName: documentConfig.name, 
          workingDirectory: documentConfig.workingDirectory,
          runCommand: scriptContent.split(os.EOL),
          description: documentConfig.description,
          parameters: documentConfig.parameters,
          schemaVersion: documentConfig.schemaVersion,
          tags: documentConfig.tags
        })
        documents.push(document)

        // Attach resource to CloudFormation template

        const documentResourceId = _.upperFirst(_.camelCase(documentName)) + 'SSMDocument'
        this.cloudFormationTemplate.Resources[documentResourceId] = document.toCloudFormationObject()
        
        // Declare output

        this.cloudFormationTemplate.Outputs[documentResourceId] = {
          'Description': `${documentConfig.description}`,
          'Value': {
            'Ref': documentResourceId
          }
        }
      }
    }

  }
}

module.exports = new Controller()
