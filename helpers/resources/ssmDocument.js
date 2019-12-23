module.exports = class S3Bucket {
  /**
   * Constructor
   *
   * @param {object} opts
   */
  constructor({ documentName, workingDirectory, runCommand, description, parameters, schemaVersion, tags }) {
    this.documentName = documentName
    this.workingDirectory = workingDirectory
    this.runCommand = runCommand
    this.description = description
    this.parameters = parameters || {}
    this.schemaVersion = schemaVersion ||  '2.2'
    this.tags = tags || [] // array of {'Key': 'tag key', Value: 'tag value'}
  }

  /**
   * Generate CloudFormation object
   *
   * @returns {object}
   */
  toCloudFormationObject () {
    return {
      'Type': 'AWS::SSM::Document',
      'DocumentType': 'Command',
      'Properties': {
        'Name': this.documentName,
        'Content': {
          'schemaVersion': this.schemaVersion,
          'description': this.description,
          'parameters': this.parameters,
          'mainSteps': [
            {
              'action': 'aws:runShellScript',
              'name': 'ExecuteScript',
              'inputs': {
                'workingDirectory': this.workingDirectory,
                'runCommand': this.runCommand
              }
            }
          ]
        },
        'Tags': this.tags
      }
    }
  }
}
