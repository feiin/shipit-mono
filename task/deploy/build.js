'use strict';
var utils = require('shipit-utils');
var chalk = require('chalk');
var util = require('util');
var path = require('path');
var _ = require('lodash');

function build(gruntOrShipit) {
    utils.registerTask(gruntOrShipit, 'deploy:build', task);

    function task() {
        var shipit = utils.getShipit(gruntOrShipit);
        var xbuildOptions = {
            framework: 'v4.0',
            solutionDir: '',
            configuration: 'release'
        };
        _.assign(xbuildOptions, shipit.config.xbuild);

        return nugetRestore().then(buildProject);

        function nugetRestore() {
            shipit.log('nuget restore "%s"', shipit.config.workspace);
            var exec_command = util.format('nuget restore');
            var cwd = path.resolve(shipit.config.workspace, xbuildOptions.solutionDir);
            return shipit.local(exec_command, {cwd: cwd}).then(function () {
                shipit.log(chalk.green('nuget restore success.'));
                shipit.emit('builded');
            });
        }

        function buildProject() {
            shipit.log('begin mono xbuild repository in "%s"', shipit.config.workspace);
            var cwd = path.resolve(shipit.config.workspace, xbuildOptions.solutionDir);
            var exec_command = [
                "xbuild",
                xbuildOptions.csprojPath,
                "/p:configuration=" + xbuildOptions.configuration,
                "/p:TargetFrameworkVersion=" + xbuildOptions.framework
            ];
            for (var p in xbuildOptions.properties) {
                exec_command.push(["/p:", p, "=", xbuildOptions.properties[p]].join(""));
            }
            exec_command = exec_command.join(" ");

            return shipit.local(exec_command, {cwd: cwd}).then(function () {
                shipit.log(chalk.green('build success.'));
                shipit.emit('builded');
            });
        }
    }
}

module.exports = build;