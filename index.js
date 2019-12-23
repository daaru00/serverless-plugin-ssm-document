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
    this.logger = new Logger(this.serverless)

    this.hooks = {
      'before:package:finalize': hooks.beforePackageFinalize.execute.bind(this)
    }
  }
}

module.exports = ServerlessPlugin
