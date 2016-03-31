'use strict'
var _ = require('lodash');

module.exports = function(shipit) {
    _.assign(shipit.constructor.prototype, require('shipit-deploy/lib/shipit'));
    require("shipit-deploy")(shipit);
    require('./task/deploy/build')(shipit);

    shipit.on('fetched', function () {
        shipit.start('deploy:build');
    });
};