'use strict';

/**
 * Requirements
 */
const ScaffoldEntityCommand = require(SCAFFOLD_SOURCE + '/command/ScaffoldEntityCommand.js').ScaffoldEntityCommand;
const commandSpec = require('entoj-system/test').command.CommandShared;
const projectFixture = require('entoj-system/test').fixture.project;
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');


/**
 * Spec
 */
describe(ScaffoldEntityCommand.className, function()
{
    /**
     * Command Test
     */
    commandSpec(ScaffoldEntityCommand, 'command/ScaffoldEntityCommand', prepareParameters);

    // Adds necessary parameters to create a testee
    function prepareParameters(parameters)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.pathes.cacheTemplate = SCAFFOLD_FIXTURES + '/temp';
            return config;
        });
        return [global.fixtures.context];
    }


    /**
     * ScaffoldEntityCommand Test
     */
    function createTestee(buildConfiguration)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.pathes.cacheTemplate = SCAFFOLD_FIXTURES + '/temp';
            return config;
        });
        return new ScaffoldEntityCommand(global.fixtures.context, SCAFFOLD_FIXTURES + '/templates/entity');
    }


    describe('#entity()', function()
    {
        it('should generate all files of the given template', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SCAFFOLD_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.dispatch('entity',
                    {
                        _:['base', 'e-input'],
                        javascript: true,
                        destination: SCAFFOLD_FIXTURES + '/temp'
                    });
                const filenames =
                [
                    '/e-input.j2',
                    '/e-input.md',
                    '/examples/overview.j2',
                    '/js/e-input.js',
                    '/models/default.json',
                    '/sass/e-input.scss'
                ];
                for (const filename of filenames)
                {
                    const file = path.join(SCAFFOLD_FIXTURES + '/temp', filename);
                    expect(yield fs.exists(file), 'should generate the file ' + filename).to.be.ok;
                }
            });
            return promise;
        });


        it('should provide variables to use within templates', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SCAFFOLD_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.dispatch('entity',
                    {
                        _:['base', 'e-input'],
                        javascript: true,
                        destination: SCAFFOLD_FIXTURES + '/temp'
                    });
                const matchers =
                {
                    '/e-input.j2':
                    [
                        /e_input/
                    ],
                    '/js/e-input.js':
                    [
                        /e-input/
                    ]
                };
                for (const filename in matchers)
                {
                    const contents = yield fs.readFile(path.join(SCAFFOLD_FIXTURES + '/temp', filename), { encoding: 'utf8' });
                    for (const matcher of matchers[filename])
                    {
                        const match = contents.match(matcher);
                        expect(match, filename + ' should contain ' + matcher).to.be.ok;
                    }
                }
            });
            return promise;
        });
    });
});
