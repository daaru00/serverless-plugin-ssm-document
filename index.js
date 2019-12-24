const _ = require('lodash')
const hooks = require('./hooks')
const Logger = require('./helpers/logger')

class ServerlessPlugin {
  constructor (serverless, options) {
    this.serverless = serverless
    this.options = options
    this.provider = this.serverless.getProvider('aws')
    this.config = _.get(this.serverless.service, 'custom.ssmDocuments', {})
    this.service = this.serverless.service.getServiceObject()
    this.providerConfig = this.serverless.service.provider
    this.logger = new Logger(this.serverless)

    // for (const hookName in this.serverless.pluginManager.hooks) {
    //   const plugins = this.serverless.pluginManager.hooks[hookName].map(plugin => plugin.pluginName)
    //   this.logger.debug(`Hook: ${hookName}, Plugins: ${plugins.join(',')}`)
    // }

    this.hooks = {
      'before:package:finalize': hooks.beforePackageFinalize.execute.bind(this),
      'deploy:finalize': hooks.deployFinalize.execute.bind(this),
      'before:deploy:deploy': hooks.beforeDeploy.execute.bind(this),
      'before:remove:remove': hooks.beforeRemove.execute.bind(this)
    }
  }
}

module.exports = ServerlessPlugin
