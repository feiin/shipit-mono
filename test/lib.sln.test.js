var vsslnparse = require('vssln-parser');
var fs = require('fs');

describe('deploy:read sln task', function () {

    it('should read sln success',function(done){
        var path = __dirname + '/test.sln';
        const text = fs.readFileSync(path, "utf-8");
        vsslnparse(text, solution => {
            for(let project of solution.projects) {
                console.log(project);
                // console.log(project.type);
                
                // for(let dependency of project.projectDependencies) {
                //     console.log('dependency',dependency);
                // }
            }

            done();
        });
    });
});