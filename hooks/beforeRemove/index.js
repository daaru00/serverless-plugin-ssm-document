const _ = require('lodash')
const SSMDocument = require('../../helpers/ssmDocument')

module.exports = {
  /**
   * Execute hook
   */
  async execute () {
    if (this.config === undefined || Object.keys(this.config).length === 0) {
      return
    }

    // Load documents

    const documents = []
    this.logger.log('Removing documents permissions...')
    for (const documentName in this.config) {
      if (this.config.hasOwnProperty(documentName)) {
        // Elaborate config
        const documentConfig = this.config[documentName]
        documentConfig.name = documentConfig.name || _.upperFirst(_.camelCase(documentName))

        // Check document permission
        if (documentConfig.accountIds === undefined || Array.isArray(documentConfig.accountIds) === false || documentConfig.accountIds.length === 0) {
          this.logger.debug(`Document ${documentConfig.name} has no account permissions, skipping..`)
          continue
        }
        
        // Delete all permissions
        const document = new SSMDocument({provider: this.provider, name: documentConfig.name})
        try {
          await document.deletePermissionsAccountIds()
        } catch (err) {
          this.logger.error(`Document ${documentConfig.name} error: ${err.message}`)
          continue
        }
        documents.push(document)
        this.logger.debug(`Document ${documentConfig.name} permissions removed!`)
      }
    }
    this.logger.debug(`Total of ${documents.length} documents account id permissions removed`)
  }
}
