module.exports = class CloudFormationStack {
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
   * List stack resources
   * https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/CloudFormation.html#listStackResources-property
   * 
   * @param {string} typeFilter
   * @returns {string[]}
   */
  async listResourcesByType(typeFilter) {
    if (this.name === undefined) {
      return []
    }
    const deployedResources = await this.provider.request('CloudFormation', 'listStackResources', {
      StackName: this.name
    })
    let resources = deployedResources.StackResourceSummaries || []
    if (typeFilter !== undefined) {
      resources = resources.filter(resource => resource.ResourceType === typeFilter)
    }
    return resources
  }

}
