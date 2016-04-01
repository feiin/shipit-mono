'use strict';
var fs = require('fs'),
    xml2js = require('xml2js');

function csproj(path) {
    this.path = path;
}

csproj.prototype.parse = function(callback) {

    fs.readFile(this.path, function (err, data) {
        if (err) {
            throw callback(err);
        }
        xml2js.parseString(data, function (err, result) {
            callback(err, result);
        });
    });
};




module.exports = csproj;