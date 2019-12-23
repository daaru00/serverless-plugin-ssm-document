module.exports = class Logger {
  /**
   * Constructor
   *
   * @param {object} sls
   * @param {string} serviceName
   */
  constructor (sls, serviceName) {
    this.sls = sls
    this.serviceName = serviceName || 'Microservices'
  }

  /**
   * Log message
   *
   * @param {string} msg
   */
  log (msg, opts) {
    this.sls.cli.log(msg, this.serviceName, {
      color: 'white',
      bold: false,
      ...opts
    })
  }

  /**
   * Warn message
   *
   * @param {string} msg
   */
  warn (msg) {
    this.log(msg, {
      bold: true,
      color: 'orange'
    })
  }

  /**
   * Error message
   *
   * @param {string} msg
   */
  error (msg) {
    this.log(msg, {
      bold: true,
      color: 'red'
    })
  }
}
