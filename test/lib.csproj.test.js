var rewire = require('rewire');
var Csproj = rewire('../lib/csproj');
var should = require('should');

describe('deploy:build task', function () {


    beforeEach(function(done){

        Csproj.__set__('fs',require('./mocks/fsCsprojMock'));
        done();
    });

    afterEach(function(done){
        done();
    });

    it('should read csproj success',function(done){
        var csproj = new Csproj('/test/projects/web/web.csproj');
        csproj.parse(function(err,json){
            should.not.exist(err);
            should.exist(json);
            done();
        });

    });

    it('should get deploy files success',function(done){
        var csproj = new Csproj('/test/projects/web/web.csproj');
        csproj.getDeployFiles(function(err,list){
            should.not.exist(err);
            should.exist(list);
            console.log(list);
            list.length.should.be.aboveOrEqual(0);
            done();
        });

    });
});