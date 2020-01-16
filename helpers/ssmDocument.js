module.exports = class SSMDocument {
  /**
   * Constructor
   *
   * @param {object} opts
   */
  constructor({ provider, name }) {
    this.provider = provider
    this.name = name
  }

  /**
   * Get AWS account ids that can execute command
   * 
   * @returns {string[]}
   */
  async getPermissionAccountIds() {
    if (this.name === undefined) {
      return []
    }
    const permissions = await this.provider.request('SSM', 'describeDocumentPermission', {
      Name: this.name, 
      PermissionType: 'Share'
    })
    return permissions.AccountIds || []
  }

  /**
   * Modify permissions
   * 
   * @param {string[]} accountIdsToAdd
   * @param {string[]} accountIdsToDelete
   */
  async modifyPermissionsAccountIds(accountIdsToAdd, accountIdsToDelete) {
    if (this.name === undefined) {
      return
    }
    await this.provider.request('SSM', 'modifyDocumentPermission', {
      Name: this.name, 
      PermissionType: 'Share',
      AccountIdsToAdd: accountIdsToAdd || [],
      AccountIdsToRemove: accountIdsToDelete || []
    })
  }

  /**
   * Delete permissions
   */
  async deletePermissionsAccountIds() {
    const currentAccountIds = await this.getPermissionAccountIds()
    if (currentAccountIds.length === 0) { 
      return
    }
    await this.modifyPermissionsAccountIds([], currentAccountIds)
  }

}
