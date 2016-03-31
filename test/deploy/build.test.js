var sinon = require('sinon');
require('sinon-as-promised');
var expect = require('chai').use(require('sinon-chai')).expect;
var monoBuildFactory = require('../../task/deploy/build');
var Shipit = require('shipit-cli');

describe('deploy:build task', function () {
    var shipit;
    var exec_command = '';
    beforeEach(function () {
        shipit = new Shipit({
            environment: 'test',
            log: sinon.stub()
        });

        shipit.stage = 'test';
        monoBuildFactory(shipit);
        shipit.initConfig({
            test: {
                workspace: '/tmp/workspace',
                repositoryUrl: 'git://web.git',
                ignores: ['.git', 'node_modules'],
                keepReleases: 5,
                deleteOnRollback: false,
                shallowClone: true,
                xbuild:{
                    solutionDir:'',
                    configuration:'release',
                    framework:'v4.0',
                    csprojPath:'web/test.csproj',
                    properties:{
                        output:'./publish/'
                    }
                }

            }
        });
        sinon.stub(shipit, 'local').resolves({
            stdout: 'ok'
        });

        exec_command = [
            "xbuild",
            shipit.config.xbuild.csprojPath,
            "/p:configuration=" + shipit.config.xbuild.configuration,
            "/p:TargetFrameworkVersion=" + shipit.config.xbuild.framework
        ];
        for(var p in shipit.config.xbuild.properties){
            exec_command.push([ "/p:", p, "=", shipit.config.xbuild.properties[p]].join(""));
        }
        exec_command = exec_command.join(" ");
    });

    afterEach(function () {
        shipit.local.restore();
    });

    it('should nuget restore,xbuild success', function (done) {
        shipit.start('deploy:build', function (err) {
            if (err){
                return done(err);
            }
            expect(shipit.local).to.be.calledWith('nuget restore', {cwd: '/tmp/workspace'});
            expect(shipit.local).to.be.calledWith(exec_command, {cwd: '/tmp/workspace'});
            done();
        });
    });




});