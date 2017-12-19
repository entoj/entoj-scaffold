'use strict';

/**
 * Registers with default configurations
 *
 * @param {Object} configuration
 */
function register(configuration, options)
{
    const opts = options || {};

    // Commands
    configuration.commands.add(require('./command/index.js').ScaffoldEntityCommand,
        {
            templatePath: opts.entityTemplatePath || '${data}/templates/entity'
        });
    configuration.commands.add(require('./command/index.js').ScaffoldPageCommand,
        {
            templatePath: opts.pageTemplatePath || '${data}/templates/page'
        });
}


/**
 * Exports
 * @ignore
 */
module.exports =
{
    register: register,
    command: require('./command/index.js')
};
