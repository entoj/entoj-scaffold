'use strict';

/**
 * Requirements
 */
const ScaffoldPageCommand = require(SCAFFOLD_SOURCE + '/command/ScaffoldPageCommand.js').ScaffoldPageCommand;
const commandSpec = require('entoj-system/test').command.CommandShared;
const projectFixture = require('entoj-system/test').fixture.project;
const fs = require('co-fs-extra');
const co = require('co');
const path = require('path');


/**
 * Spec
 */
describe(ScaffoldPageCommand.className, function()
{
    /**
     * Command Test
     */
    commandSpec(ScaffoldPageCommand, 'command/ScaffoldPageCommand', prepareParameters);

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
     * ScaffoldPageCommand Test
     */
    function createTestee(buildConfiguration)
    {
        global.fixtures = projectFixture.createDynamic((config) =>
        {
            config.pathes.cacheTemplate = SCAFFOLD_FIXTURES + '/temp';
            return config;
        });
        return new ScaffoldPageCommand(global.fixtures.context, SCAFFOLD_FIXTURES + '/templates/page');
    }


    describe('#page()', function()
    {
        it('should generate all files of the given template', function()
        {
            const promise = co(function *()
            {
                yield fs.emptyDir(path.join(SCAFFOLD_FIXTURES, '/temp'));
                const testee = createTestee();
                yield testee.dispatch('page',
                    {
                        _:['base', 'p-home'],
                        javascript: true,
                        destination: SCAFFOLD_FIXTURES + '/temp'
                    });
                const filenames =
                [
                    '/p-home.j2',
                    '/p-home.md'
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
                yield testee.dispatch('page',
                    {
                        _:['base', 'p-home'],
                        javascript: true,
                        destination: SCAFFOLD_FIXTURES + '/temp'
                    });
                const matchers =
                {
                    '/p-home.j2':
                    [
                        /p-home/
                    ],
                    '/p-home.md':
                    [
                        /p-home/
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
