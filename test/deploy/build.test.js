var rewire = require('rewire');
var sinon = require('sinon');
require('sinon-as-promised');
var expect = require('chai').use(require('sinon-chai')).expect;
var monoBuildFactory = rewire('../../task/deploy/build');
var Shipit = require('shipit-cli');
var Csproj = rewire('../../lib/csproj');
var path = require('path');
var fs = require('fs');

describe('deploy:build task', function () {
    var shipit;
    var exec_command = [];
    beforeEach(function () {
        shipit = new Shipit({
            environment: 'test',
            log: function(msg) {console.log(msg)}
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
                xdt:'Release',
                xbuild:{
                    solutionPath: path.resolve(__dirname,'../test.sln'),
                    target:'Kings.Web',
                    properties:{
                        Configuration:'Release'
                    }
                }

            }
        });
        sinon.stub(shipit, 'local').resolves({
            stdout: 'ok'
        });

        monoBuildFactory.__set__('fs',{
            ensureDirSync:function(path){

            },
            readFileSync: fs.readFileSync
        });

        monoBuildFactory.__set__('xdt',function(options,cb){
            console.log('xdt transform mock: ',options);
            cb();
        });

        Csproj.__set__('fs',require('../mocks/fsCsprojMock'));
        monoBuildFactory.__set__('Csproj',Csproj);
    });

    afterEach(function () {
        shipit.local.restore();
    });

    it('should nuget restore,xbuild success', function (done) {
        shipit.start('deploy:build', function (err) {
            // console.log(err);
            if (err){
                return done(err);
            }
            console.log(exec_command);
            // expect(shipit.local).to.be.calledWith('nuget restore', {cwd: '/tmp/workspace'});
            // expect(shipit.local).to.be.calledWith(exec_command, {cwd: '/tmp/workspace'});
            done();
        });
    });




});