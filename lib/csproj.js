'use strict';
var fs = require('fs'),
    path = require('path'),
    xml2js = require('xml2js');

function csproj(path) {
    this.path = path;
}

csproj.prototype.parse = function(callback) {

    fs.readFile(this.path, function (err, data) {
        if (err) {
            return callback(err);
        }
        xml2js.parseString(data, function (err, result) {
            callback(err, result);
        });
    });
};


csproj.prototype.getDeployFiles = function(callback) {
    var that = this;
    this.parse(function(err,data){
        if(err) {
            return callback(err);
        }

        var deployFiles = [];
        data.Project.ItemGroup && data.Project.ItemGroup.forEach(function(item) {
            item.Content && item.Content.forEach(function(content) {
                if(content.$.Include) {
                    var include = content.$.Include.replace(/\\/g,path.sep);
                    deployFiles.push(include);
                }
            });
        });

        callback(null,deployFiles);
    });
};



module.exports = csproj;