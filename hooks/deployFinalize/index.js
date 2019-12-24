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
    this.logger.log('Updating documents permissions...')
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
        const document = new SSMDocument({provider: this.provider, name: documentConfig.name})
        let currentAccountIds = await document.getPermissionAccountIds()
        currentAccountIds = currentAccountIds.map(currentAccountId => currentAccountId.toString())
        documentConfig.accountIds = documentConfig.accountIds.map(accountId => accountId.toString())
        
        // Elaborate account ids to add
        const accountToAdd = []
        for (const accountId of documentConfig.accountIds) {
          if (currentAccountIds.includes(accountId) === false) {
            accountToAdd.push(accountId)
            this.logger.debug(`Document ${documentConfig.name} permission for account id '${accountId}' need to be added`)
          }
        }

        // Elaborate account ids to delete
        const accountToDelete = []
        for (const accountId of currentAccountIds) {
          if (documentConfig.accountIds.includes(accountId) === false) {
            accountToDelete.push(accountId)
            this.logger.debug(`Document ${documentConfig.name} permission for account id '${accountId}' need to be deleted`)
          }
        }

        // Save permissions
        if (accountToAdd.length === 0 && accountToDelete.length === 0) {
          this.logger.debug(`Document ${documentConfig.name} permissions are in sync, skipping..`)
          continue
        }

        try {
          await document.modifyPermissionsAccountIds(accountToAdd, accountToDelete)
        } catch (err) {
          this.logger.error(`Document ${documentConfig.name} error: ${err.message}`)
          continue
        }
        documents.push(document)
        this.logger.debug(`Document ${documentConfig.name} permissions saved!`)
      }
    }
    this.logger.debug(`Total of ${documents.length} documents permission updated`)
  }
}
