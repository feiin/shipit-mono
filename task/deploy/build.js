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

function build(gruntOrShipit) {
    utils.registerTask(gruntOrShipit, 'deploy:build', task);

    function task() {
        var shipit = utils.getShipit(gruntOrShipit);
        var xbuildOptions = {
            solutionDir: '',
            configuration: 'release'
        };

        if (!xbuildOptions.output) {
            xbuildOptions.output = shipit.config.dirToCopy = shipit.config.dirToCopy || 'output';
        }

        _.assign(xbuildOptions, shipit.config.xbuild);

        return nugetRestore()
            .then(buildProject)
            .then(copyDeployFiles)
            .then(transformWebConfig)
            .then(copyDeployBin);

        function nugetRestore() {
            shipit.log('nuget restore "%s"', shipit.config.workspace);
            var exec_command = util.format('nuget restore');
            var cwd = path.resolve(shipit.config.workspace, xbuildOptions.solutionDir);
            return shipit.local(exec_command, {cwd: cwd}).then(function () {
                shipit.log(chalk.green('nuget restore success.'));
            });
        }

        function buildProject() {
            shipit.log('begin mono xbuild repository in "%s"', shipit.config.workspace);
            var cwd = shipit.config.workspace;
            var exec_command = [
                'xbuild',
                xbuildOptions.csprojPath,
                '/p:configuration=' + xbuildOptions.configuration,
            ];

            if(xbuildOptions.framework) {
                exec_command.push('/p:TargetFrameworkVersion=' + xbuildOptions.framework)
            }

            for (var p in xbuildOptions.properties) {
                exec_command.push(['/p:', p, '=', xbuildOptions.properties[p]].join(""));
            }
            exec_command = exec_command.join(' ');

            return shipit.local(exec_command, {cwd: cwd}).then(function () {
                shipit.log(chalk.green('build success.'));
                shipit.emit('builded');
            });
        }

        function copyDeployFiles() {
            shipit.log('cp deploy files in"%s"', shipit.config.workspace);
            var projPath = path.resolve(shipit.config.workspace, xbuildOptions.csprojPath);
            var csproj = new Csproj(projPath);

            var outReleaseDir = path.resolve(shipit.config.workspace, xbuildOptions.output);
            var cwd = path.resolve(shipit.config.workspace, xbuildOptions.solutionDir);

            var promise = new Promise(function (resolve, reject) {
                csproj.getDeployFiles(function (err, items) {
                    if (err) {
                        return reject(err);
                    }
                    resolve(items)
                })
            });

            return promise.mapSeries(function (item) {
                var from = path.resolve(path.dirname(projPath), item);
                var to = path.resolve(outReleaseDir, item);
                var toDir = path.dirname(to);
                fs.ensureDirSync(toDir);
                var exec_command = [
                    'cp',
                    '-f',
                    from,
                    to
                ];

                return shipit.local(exec_command.join(' '), {cwd: cwd}).then(function () {
                    shipit.log(chalk.green('cp content:' + item + ' success.'));
                });
            })

        }

        function copyDeployBin() {
            shipit.log('cp deploy files in"%s"', shipit.config.workspace);
            var projPath = path.resolve(shipit.config.workspace, xbuildOptions.csprojPath);
            var binPath = path.resolve(path.dirname(projPath), 'bin');
            var outputBinPath = path.resolve(shipit.config.workspace, xbuildOptions.output, 'bin');
            var cwd = path.resolve(shipit.config.workspace);
            var exec_command = [
                'cp',
                '-rf',
                binPath + '/',
                outputBinPath
            ];
            return shipit.local(exec_command.join(' '), {cwd: cwd}).then(function () {
                shipit.log(chalk.green('cp bin: ' + binPath + ' success.'));
                shipit.emit('builded');
            });
        }

        function transformWebConfig() {
            if(!shipit.config.xdt) {
                return Promise.resolve();
            }

            var projPath = path.resolve(shipit.config.workspace, xbuildOptions.csprojPath);
            var xdtName = (shipit.config.xdtName || 'Web');
            var configPath = path.join(path.dirname(projPath), xdtName + '.config');
            var transformPath = path.join(path.dirname(projPath), xdtName + '.' + shitpit.config.xdt + '.config');
            var savePath = path.resolve(shipit.config.workspace, xbuildOptions.output, xdtName + '.config');
            var options = {
                src: configPath,
                dest: savePath,
                transform: transformPath
            };
            shipit.log('transform config : "%s" with "%s"', configPath, transformPath);

            var pXdt = Promise.promisify(xdt);
            return pXdt(options).then(function(){
                shipit.log(chalk.green('transform config success : "%s" ', savePath));
            });
        }
    }
}

module.exports = build;