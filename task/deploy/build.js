'use strict';
var utils = require('shipit-utils');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var _ = require('lodash');
var Csproj = require('../../lib/csproj');
var Promise = require('bluebird');
var fs = require('fs-extra');
var xdt = require('node-xdt')
const vsslnparse = require('vssln-parser');


function build(gruntOrShipit) {
    utils.registerTask(gruntOrShipit, 'deploy:build', task);

    function task() {
        var shipit = utils.getShipit(gruntOrShipit);
        var xbuildOptions = {
            solutionPath: '',
            buildTool: 'msbuild',
            target: '',
            properties: {
                Configuration: 'Release'
            }
        };

        if (!xbuildOptions.output) {
            xbuildOptions.output = shipit.config.dirToCopy = shipit.config.dirToCopy || 'output';
        }

        _.assign(xbuildOptions, shipit.config.xbuild);
        if (!xbuildOptions.buildTool) {
            xbuildOptions.buildTool = 'msbuild';
        }
        xbuildOptions.solutionPath = path.resolve(shipit.config.workspace, xbuildOptions.solutionPath);

        function getXbuildCommand(options) {
            var xbuildOptions = {
                target: '',
                properties: {
                    Configuration: 'Release'
                },
                targets: [],
                solutionPath: ''
            }
            _.assign(xbuildOptions, options);

            var exec_command = [];

            for (var p in xbuildOptions.properties) {
                exec_command.push(['/p:', p, '=', xbuildOptions.properties[p]].join(""));
            }

            if (xbuildOptions.target && xbuildOptions.targets.indexOf(xbuildOptions.target) < 0) {
                xbuildOptions.targets.push(xbuildOptions.target);
            }

            if (xbuildOptions.target) {
                exec_command.push(xbuildOptions.csprojPath);
            } else {
                exec_command.push(xbuildOptions.solutionPath);
            }
            return exec_command;
        }
        return nugetRestore()
            .then(parseTargetProject)
            .then(buildProject)
            .then(copyDeployFiles)
            .then(transformWebConfig)
            .then(copyDeployBin);

        function nugetRestore() {
            shipit.log('nuget restore "%s"', shipit.config.workspace);
            var exec_command = util.format('nuget restore');
            var cwd = path.dirname(xbuildOptions.solutionPath);
            return shipit.local(exec_command, { cwd: cwd }).then(function () {
                shipit.log(chalk.green('nuget restore success.'));
            });
        }

        function parseTargetProject() {
            shipit.log('parse target project "%s"', xbuildOptions.solutionPath);
            const slnText = fs.readFileSync(xbuildOptions.solutionPath, 'utf-8');

            function parseSlnFile(slnText, cb) {
                vsslnparse(slnText, solution => {
                    cb(null, solution);
                });

            };
            let slnparser = Promise.promisify(parseSlnFile);

            return slnparser(slnText).then((solution) => {
                for (let project of solution.projects) {
                    if (project.name == xbuildOptions.target) {
                        xbuildOptions.csprojPath = path.resolve(path.dirname(xbuildOptions.solutionPath), project.path.replace('\\', path.sep));
                    }
                }
            });
        }

        function buildProject() {
            shipit.log('begin mono xbuild repository in "%s"', shipit.config.workspace);
            var cwd = shipit.config.workspace;
            var buildCommand = getXbuildCommand(xbuildOptions);
            var exec_command = 'xbuild ' + buildCommand.join(' ');

            return shipit.local(exec_command, { cwd: cwd }).then(function () {
                shipit.log(chalk.green('build success.'));
                shipit.emit('builded');
            });
        }

        function copyDeployFiles() {
            shipit.log('cp deploy files in"%s"', shipit.config.workspace);

            var projPath = xbuildOptions.csprojPath;
            var csproj = new Csproj(projPath);
            var outReleaseDir = path.resolve(shipit.config.workspace, xbuildOptions.output);
            var cwd = path.dirname(xbuildOptions.solutionPath);

            var promise = new Promise(function (resolve, reject) {
                csproj.getDeployFiles(function (err, items) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(items)
                })
            });

            return promise.mapSeries(function (item) {
                var from = path.resolve(path.dirname(xbuildOptions.csprojPath), item);
                var to = path.resolve(outReleaseDir, item);
                var toDir = path.dirname(to);
                fs.ensureDirSync(toDir);
                var exec_command = [
                    'cp',
                    '-f',
                    from,
                    to
                ];

                return shipit.local(exec_command.join(' '), { cwd: cwd }).then(function () {
                    shipit.log(chalk.green('cp content:' + item + ' success.'));
                });
            })

        }

        function copyDeployBin() {
            shipit.log('cp deploy files in"%s"', shipit.config.workspace);
            var projPath = path.dirname(xbuildOptions.csprojPath);
            var binPath = path.resolve(projPath, './bin');
            var outputBinPath = path.resolve(shipit.config.workspace, xbuildOptions.output, 'bin');
            var cwd = path.resolve(shipit.config.workspace);
            var exec_command = [
                'cp',
                '-rf',
                binPath + '/',
                outputBinPath
            ];
            return shipit.local(exec_command.join(' '), { cwd: cwd }).then(function () {
                shipit.log(chalk.green('cp bin: ' + binPath + ' success.'));
                shipit.emit('builded');
            });
        }

        function transformWebConfig() {
            if (!shipit.config.xdt) {
                return Promise.resolve();
            }

            var projPath = xbuildOptions.csprojPath;
            var xdtName = (shipit.config.xdtName || 'Web');
            var configPath = path.join(path.dirname(projPath), xdtName + '.config');
            var transformPath = path.join(path.dirname(projPath), xdtName + '.' + shipit.config.xdt + '.config');
            var savePath = path.resolve(shipit.config.workspace, xbuildOptions.output, xdtName + '.config');
            var options = {
                src: configPath,
                dest: savePath,
                transform: transformPath
            };
            shipit.log('transform config : ' + configPath + ' with ' + transformPath);

            var pXdt = Promise.promisify(xdt);
            return pXdt(options).then(function () {
                shipit.log(chalk.green('transform config success : ' + savePath));
            });
        }
    }
}

module.exports = build;