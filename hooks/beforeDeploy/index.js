const _ = require('lodash')
const CloudFormationStack = require('../../helpers/cloudFormationStack')
const SsmDocument = require('../../helpers/ssmDocument')

module.exports = {
  /**
   * Execute hook
   */
  async execute () {
    if (this.config === undefined || Object.keys(this.config).length === 0) {
      return
    }

    const stack = new CloudFormationStack({provider: this.provider, name: this.provider.naming.getStackName()})
    const deployedDocuments = await stack.listResourcesByType('AWS::SSM::Document')

    // Load documents
    const documentToDelete = []
    const documentNames = Object.keys(this.config)
    this.logger.log('Checking documents permissions to remove...')
    for (const deployedDocument in deployedDocuments) {

      // Search for document
      const deletedDocument = documentNames.find(documentName => {
        const documentConfig = this.config[documentName]
        documentConfig.name = documentConfig.name || _.upperFirst(_.camelCase(documentName))
        return deployedDocument.PhysicalResourceId === _.upperFirst(_.camelCase(documentConfig.name || documentName)) + 'SSMDocument'
      })
      if (deletedDocument === undefined) {
        continue
      }

      // Remove all document permission
      const document = new SsmDocument({provider: this.provider, name: deployedDocument.PhysicalResourceId})
      await document.deletePermissionsAccountIds()
      documentToDelete.push(document)
    }
    this.logger.debug(`Total of ${documentToDelete.length} documents permissions removed`)
    
  }
}
