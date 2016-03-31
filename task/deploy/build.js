'use strict';
var utils = require('shipit-utils');
var chalk = require('chalk');
var util = require('util');
var path = require('path');

function build(gruntOrShipit) {
    utils.registerTask(gruntOrShipit, 'deploy:build', task);

    function task() {
        var shipit = utils.getShipit(gruntOrShipit);
        return nugetRestore().then(buildProject);

        function nugetRestore() {
            shipit.log('nuget restore "%s"', shipit.config.workspace);
            var exec_command = util.format('nuget restore');
            var cwd = path.resolve(shipit.config.workspace, shipit.config.xbuild.solutionDir);
            return shipit.local(exec_command, {cwd: cwd}).then(function () {
                shipit.log(chalk.green('nuget restore success.'));
                shipit.emit('builded');
            });
        }

        function buildProject() {
            shipit.log('begin mono xbuild repository in "%s"', shipit.config.workspace);
            var cwd = path.resolve(shipit.config.workspace, shipit.config.xbuild.solutionDir);
            var exec_command = [
                "xbuild",
                shipit.config.xbuild.csprojPath,
                "/p:configuration=" + shipit.config.xbuild.configuration,
                "/p:TargetFrameworkVersion=" + shipit.config.xbuild.framework
            ];
            for (var p in shipit.config.xbuild.properties) {
                exec_command.push(["/p:", p, "=", shipit.config.xbuild.properties[p]].join(""));
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