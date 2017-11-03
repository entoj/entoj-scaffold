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
const TemplateTask = require('entoj-system').task.TemplateTask;
const WriteFilesTask = require('entoj-system').task.WriteFilesTask;
const CliLogger = require('entoj-system').cli.CliLogger;
const co = require('co');
const inquirer = require('inquirer');
const path = require('path');


/**
 * @memberOf command
 */
class ScaffoldPageCommand extends Command
{
    /**
     */
    constructor(context, templatePath)
    {
        super(context);

        // Assign options
        this._name = 'scaffold';
        this._templatePath = templatePath
            ? path.normalize(templatePath)
            : '';
    }


    /**
     * @inheritDoc
     */
    static get injections()
    {
        return { 'parameters': [Context, 'command/ScaffoldPageCommand.templatePath'] };
    }


    /**
     * @inheritDocs
     */
    static get className()
    {
        return 'command/ScaffoldPageCommand';
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
                    name: 'page',
                    description: 'Creates a basic page',
                    options:
                    [
                        {
                            name: 'siteName',
                            type: 'inline',
                            optional: true,
                            description: 'The site of the page'
                        },
                        {
                            name: 'entityId',
                            type: 'inline',
                            optional: true,
                            defaultValue: '',
                            description: 'The id or name of the page'
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
                entityId: undefined
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
                    message: 'The page id?',
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
                            return 'Please enter a valid page id (e.g. p-home)';
                        });
                        return promise;
                    },
                    when: function()
                    {
                        const hasData = (values.entityId);
                        return Promise.resolve(!hasData);
                    }
                },
                {
                    type: 'list',
                    name: 'site',
                    message: 'Select a site',
                    choices: yield sitesRepository.getPropertyList(Site.NAME),
                    when: function()
                    {
                        const hasData = (values.site);
                        return Promise.resolve(!hasData);
                    }
                }
            ];
            yield inquirer.prompt(questions);

            // Prepare result
            values.entityId.entityId.site = values.site;
            const result =
            {
                entityId: values.entityId.entityId,
                site: values.site,
                destination: parameters.destination
                    ? path.normalize(parameters.destination)
                    : undefined
            };
            return result;
        }).catch(function(error)
        {
            logger.error(error);
        });
        return promise;
    }


    /**
     * @inheritDocs
     * @returns {Promise<Server>}
     */
    page(parameters)
    {
        // Is the command configured?
        if (!this.templatePath.length)
        {
            return Promise.resolve(true);
        }

        const scope = this;
        const logger = scope.createLogger('command.scaffold.page');
        const promise = co(function *()
        {
            // Prepare
            const section = logger.section('Scaffolding page');
            const configuration = yield scope.askQuestions(logger, parameters);

            // Create tasks
            const mapping = new Map();
            mapping.set(CliLogger, logger);
            const pathesConfiguration = scope.context.di.create(PathesConfiguration);
            const buildConfiguration = scope.context.di.create(BuildConfiguration);
            const options =
            {
                writePath: configuration.destination
                    ? configuration.destination
                    : yield pathesConfiguration.resolveEntityId(configuration.entityId),
                readPath: scope._templatePath + path.sep + '**' + path.sep + '*.*',
                readPathBase: scope._templatePath,
                templateData:
                {
                    entityId: configuration.entityId,
                    site: configuration.site
                },
                renameFiles:
                {
                    '(.*)entityId.(.*)': '$1' + configuration.entityId.asString('id') + '.$2'
                }
            };
            logger.options(options);
            yield scope.context.di.create(ReadFilesTask, mapping)
                .pipe(scope.context.di.create(TemplateTask, mapping))
                .pipe(scope.context.di.create(RenameFilesTask, mapping))
                .pipe(scope.context.di.create(WriteFilesTask, mapping))
                .run(buildConfiguration, options);

            // Done
            logger.end(section);
        }).catch(function(error)
        {
            logger.error(error);
        });
        return promise;
    }


    /**
     * @inheritDocs
     */
    dispatch(action, parameters)
    {
        if (action === 'page')
        {
            return this.page(parameters);
        }
        return Promise.resolve(false);
    }
}


/**
 * Exports
 * @ignore
 */
module.exports.ScaffoldPageCommand = ScaffoldPageCommand;
