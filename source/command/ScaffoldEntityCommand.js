'use strict';

/**
 * Requirements
 * @ignore
 */
const Command = require('entoj-system').command.Command;
const Context = require('entoj-system').application.Context;
const PathesConfiguration = require('entoj-system').model.configuration.PathesConfiguration;
const BuildConfiguration = require('entoj-system').model.configuration.BuildConfiguration;
const Site = require('entoj-system').model.site.Site;
const SitesRepository = require('entoj-system').model.site.SitesRepository;
const IdParser = require('entoj-system').parser.entity.IdParser;
const ReadFilesTask = require('entoj-system').task.ReadFilesTask;
const RenameFilesTask = require('entoj-system').task.RenameFilesTask;
const RemoveFilesTask = require('entoj-system').task.RemoveFilesTask;
const TemplateTask = require('entoj-system').task.TemplateTask;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const ErrorHandler = require('entoj-system').error.ErrorHandler;
const co = require('co');
const inquirer = require('inquirer');
const path = require('path');


/**
 * @memberOf command
 */
class ScaffoldEntityCommand extends Command
{
    /**
     */
    constructor(context, templatePath)
    {
        super(context);

        // Assign options
        this._name = 'scaffold';
        this._templatePath = templatePath || '';
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context, 'command/ScaffoldEntityCommand.templatePath'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/ScaffoldEntityCommand';
    }


    /**
     * @inheritDocs
     */
    get help()
    {
        const help =
        {
            name: this._name,
            description: 'Scaffolding',
            actions:
            [
                {
                    name: 'entity',
                    description: 'Creates a basic entity',
                    options:
                    [
                        {
                            name: 'siteName',
                            type: 'inline',
                            optional: true,
                            description: 'The site of the entity'
                        },
                        {
                            name: 'entityId',
                            type: 'inline',
                            optional: true,
                            defaultValue: '',
                            description: 'The id or name of the entity'
                        },
                        {
                            name: 'javascript',
                            type: 'named',
                            value: '',
                            optional: true,
                            defaultValue: '',
                            description: 'Enables javascript bootstrapping'
                        },
                        {
                            name: 'no-javascript',
                            type: 'named',
                            value: '',
                            optional: true,
                            defaultValue: '',
                            description: 'Disables javascript bootstrapping'
                        },
                        {
                            name: 'destination',
                            type: 'named',
                            value: 'path',
                            optional: true,
                            defaultValue: '',
                            description: 'Define a base folder where files are written to'
                        }
                    ]
                }
            ]
        };
        return help;
    }


    /**
     * @type {String}
     */
    get templatePath()
    {
        return this._templatePath;
    }


    /**
     * @inheritDocs
     * @returns {Promise<Object>}
     */
    askQuestions(logger, parameters)
    {
        const scope = this;
        const promise = co(function *()
        {
            // Prepare
            const entityIdParser = scope.context.di.create(IdParser);
            const sitesRepository = scope.context.di.create(SitesRepository);
            const sites = yield sitesRepository.getItems();

            // Parse & prepare parameters
            const values =
            {
                site: undefined,
                entityId: undefined,
                javascript: parameters.javascript
            };
            if (parameters._.length == 1)
            {
                values.entityId = yield entityIdParser.parse(parameters._[0]);
            }
            else if (parameters._.length == 2)
            {
                values.site = yield sitesRepository.findBy({ '*': parameters._[0] });
                values.entityId = yield entityIdParser.parse(parameters._[1]);
            }
            if (values.entityId)
            {
                if (sites.length === 1)
                {
                    values.site = sites[0];
                }
            }

            // Ask questions
            const questions =
            [
                {
                    type: 'input',
                    name: 'entityId',
                    message: 'The entity id?',
                    validate: /* istanbul ignore next */ function(value)
                    {
                        const promise = co(function *()
                        {
                            values.entityId = yield entityIdParser.parse(value);
                            if (values.entityId)
                            {
                                if (sites.length === 1)
                                {
                                    values.site = sites[0];
                                }
                                return true;
                            }
                            return 'Please enter a valid entity id (e.g. m-gallery)';
                        });
                        return promise;
                    },
                    when: function()
                    {
                        const hasData = !!values.entityId;
                        return Promise.resolve(!hasData);
                    }
                },
                {
                    type: 'list',
                    name: 'site',
                    message: 'Select a site',
                    choices: yield sitesRepository.getPropertyList(Site.NAME),
                    filter: function(input)
                    {
                        const promise = co(function *()
                        {
                            values.site = yield sitesRepository.findBy({ '*': input });
                            return values.site;
                        });
                        return promise;
                    },
                    when: function()
                    {
                        const hasData = (values.site);
                        return Promise.resolve(!hasData);
                    }
                },
                {
                    type: 'confirm',
                    name: 'javascript',
                    message: 'Does it need JavaScript?',
                    default: true,
                    when: function()
                    {
                        const hasData = (typeof values.javascript !== 'undefined');
                        return Promise.resolve(!hasData);
                    }
                }
            ];
            const answers = yield inquirer.prompt(questions);

            // Prepare result
            values.entityId.entityId.site = values.site;
            const result =
            {
                entityId: values.entityId.entityId,
                site: values.site,
                javascript: (typeof answers.javascript !== 'undefined') ? answers.javascript : values.javascript,
                destination: parameters.destination
                    ? path.normalize(parameters.destination)
                    : undefined
            };
            return result;
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @param {Object} parameters
     * @returns {Promise<Server>}
     */
    entity(parameters)
    {
        // Is the command configured?
        if (!this.templatePath.length)
        {
            return Promise.resolve(true);
        }

        const scope = this;
        const logger = scope.createLogger('command.scaffold.entity');
        const promise = co(function *()
        {
            // Prepare
            const section = logger.section('Scaffolding entity');
            const configuration = yield scope.askQuestions(logger, parameters);

            // Create tasks
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const templatePath = yield pathesConfiguration.resolve(scope.templatePath);
            const options =
            {
                writePath: configuration.destination
                    ? configuration.destination
                    : yield pathesConfiguration.resolveEntityIdForSite(configuration.entityId, configuration.site),
                readPath: templatePath + path.sep + '**' + path.sep + '*.*',
                readPathBase: templatePath,
                templateData:
                {
                    entityId: configuration.entityId,
                    site: configuration.site,
                    javascript: configuration.javascript
                },
                renameFiles:
                {
                    '(.*)entityId.(.*)': '$1' + configuration.entityId.asString('id') + '.$2'
                },
                removeFiles: []
            };
            if (!configuration.javascript)
            {
                options.removeFiles.push('(.*).js$');
            }

            yield scope.context.di.create(ReadFilesTask, mapping)
                .pipe(scope.context.di.create(TemplateTask, mapping))
                .pipe(scope.context.di.create(RenameFilesTask, mapping))
                .pipe(scope.context.di.create(RemoveFilesTask, mapping))
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, options);

            // Done
            logger.end(section);
        }).catch(ErrorHandler.handler(scope));
        return promise;
    }


    /**
     * @inheritDocs
     */
    dispatch(action, parameters)
    {
        if (action === 'entity')
        {
            return this.entity(parameters);
        }
        return Promise.resolve(false);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.ScaffoldEntityCommand = ScaffoldEntityCommand;
