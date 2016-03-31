'use strict'
var _ = require('lodash');
var utils = require('shipit-utils');

module.exports = function(shipit) {
    _.assign(shipit.constructor.prototype, require('shipit-deploy/lib/shipit'));
    require("shipit-deploy")(shipit);
    require('./task/deploy/build')(shipit);

    utils.registerTask(shipit, 'deploy', [
        'deploy:init',
        'deploy:fetch',
        'deploy:build',
        'deploy:update',
        'deploy:publish',
        'deploy:clean',
        'deploy:finish'
    ]);
};