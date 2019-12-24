const fs = require('fs')
const os = require('os')
const _ = require('lodash')
const SsmDocumentResource = require('../../helpers/resources/ssmDocument')

module.exports = {
  /**
   * Execute hook
   */
  async execute () {
    if (this.config === undefined || Object.keys(this.config).length === 0) {
      return
    }

    // Init properties

    this.cloudFormationTemplate = this.serverless.service.provider.compiledCloudFormationTemplate
    this.providerConfig.tags = this.providerConfig.tags || {}

    // Load documents

    const documents = []
    this.logger.log('Loading documents...')
    for (const documentName in this.config) {
      if (this.config.hasOwnProperty(documentName)) {
        const documentConfig = this.config[documentName]

        // Load script file
        
        if (!documentConfig.scriptFile) {
          this.logger.warn(`Document ${documentName} does not have 'scriptFile' defined`)
          continue
        }

        if (fs.lstatSync(documentConfig.scriptFile).isFile() === false) {
          this.logger.warn(`Script file ${documentConfig.scriptFile} not found or is not a valid file`)
          continue
        }
        const scriptContent = fs.readFileSync(documentConfig.scriptFile).toString()

        // Create SSM Document
        
        documentConfig.name = documentConfig.name || this.providerConfig.stage + _.upperFirst(_.camelCase(documentName))
        documentConfig.description = documentConfig.description || `Command ${documentName}`
        documentConfig.tags = documentConfig.tags || {}

        const document = new SsmDocumentResource({
          documentName: documentConfig.name, 
          workingDirectory: documentConfig.workingDirectory,
          runCommand: scriptContent.split(os.EOL),
          description: documentConfig.description,
          parameters: documentConfig.parameters,
          schemaVersion: documentConfig.schemaVersion,
          tags: {...this.providerConfig.tags, ...documentConfig.tags}
        })
        documents.push(document)
        this.logger.debug(`Document loaded: ${documentConfig.name}`)

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
    this.logger.debug(`Total of ${documents.length} documents loaded`)
  }
}
