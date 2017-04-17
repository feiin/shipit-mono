##shipit-mono

[![Build Status](https://travis-ci.org/feiin/shipit-mono.svg?branch=master)](https://travis-ci.org/feiin/shipit-mono)
[![npm](https://img.shields.io/npm/dt/shipit-mono.svg?maxAge=2592000)]()

deploy mono web/asp.net application base on [Shipit-deploy](https://github.com/shipitjs/shipit-deploy)

 

## Install

```
npm install shipit-mono
```

## Usage

### Example `shipitfile.js`

```js
module.exports = function (shipit) {
  require('shipit-mono')(shipit);

  shipit.initConfig({
    default: {
      workspace: '/tmp/github-monitor',
      deployTo: '/tmp/deploy_to',
      repositoryUrl: 'https://github.com/user/repo.git',
      ignores: ['.git', 'node_modules'],
      keepReleases: 2,
      xdt:'Release'
      shallowClone: false,
      xbuild:{
                solutionPath:'./src/Kings.sln',
                target:'Kings.Web',
                properties:{
                    Configuration:'Release'
                }
            }
    },
    staging: {
      servers: 'user@myserver.com'
    }
  });
};
```

To deploy on staging, you must use the following command :

```
shipit staging deploy
```

You can rollback to the previous releases with the command :

```
shipit staging rollback
```

## Options

### workspace

Type: `String`

Define a path to an empty directory where Shipit builds it's syncing source. **Beware to not set this path to the root of your repository as shipit-deploy cleans the directory at the given path as a first step.**

### dirToCopy

Type: `String`
Default: same as workspace

Define directory within the workspace which should be deployed.

### deployTo

Type: `String`

Define the remote path where the project will be deployed. A directory `releases` is automatically created. A symlink `current` is linked to the current release.

### repositoryUrl

Type: `String`

Git URL of the project repository.

### branch

Type: `String`

Tag, branch or commit to deploy.

### ignores

Type: `Array<String>`

An array of paths that match ignored files. These paths are used in the rsync command.

### deleteOnRollback

Type: `Boolean`

Whether or not to delete the old release when rolling back to a previous release.

#### key

Type: `String`

Path to SSH key

### keepReleases

Type: `Number`

Number of releases to keep on the remote server.

### xdtName

Type: `String`

 transform Web.config using xdt(Microsoft Xml Document Transformation). Default: ''

Example: 

xdtName = `Release`

```
 Web.config + Web.Release.config  -> Web.config  
 
```

### shallowClone

Type: `Boolean`

Perform a shallow clone. Default: `false`.

###updateSubmodules

Type: `Boolean`

Update submodules. Default: `false`.



### gitLogFormat

Type: `String`

Log format to pass to [`git log`](http://git-scm.com/docs/git-log#_pretty_formats). Used to display revision diffs in `pending` task. Default: `%h: %s - %an`.

### copy

Type: `String`

Parameter to pass to `cp` to copy the previous release. Non NTFS filesystems support `-r`. Default: `-a`

## Variables

Several variables are attached during the deploy and the rollback process:

### shipit.config.*

All options described in the config sections are available in the `shipit.config` object.

### shipit.repository

Attached during `deploy:fetch` task.

You can manipulate the repository using git command, the API is describe in [gift](https://github.com/sentientwaffle/gift).

### shipit.releaseDirname

Attached during `deploy:update` and `rollback:init` task.

The current release dirname of the project, the format used is "YYYYMMDDHHmmss" (moment format).

### shipit.releasesPath

Attached during `deploy:init`, `rollback:init`, and `pending:log` tasks.

The remote releases path.

### shipit.releasePath

Attached during `deploy:update` and `rollback:init` task.

The complete release path : `path.join(shipit.releasesPath, shipit.releaseDirname)`.

### shipit.currentPath

Attached during `deploy:init`, `rollback:init`, and `pending:log` tasks.

The current symlink path : `path.join(shipit.config.deployTo, 'current')`.

###xbuild
####solutionDir

Type: `String`

Attached during `deploy:build` task.  

solution(*.sln) directory within the workspace

####framework

Type: `String`

Attached during `deploy:build` task.  

.net  framework version.

####configuration

Type: `String`

Attached during `deploy:build` task.  

xbuild configuration

####csprojPath

Type: `String`


Attached during `deploy:build` task.  

web.csproj within the workspace which should be deployed.


####properties
Type:`Object`

extra properties



## Workflow tasks

the same with shipit-deploy

- deploy
  - deploy:init
    - Emit event "deploy".
  - deploy:fetch
    - Create workspace.
    - Initialize repository.
    - Add remote.
    - Fetch repository.
    - Checkout commit-ish.
    - Merge remote branch in local branch.
    - Emit event "fetched".
  - deploy:build
    - nuget restore.
    - xbuild csproj.
    - cp release contents & bin.
    - Emit event "builded".
  - deploy:update
    - Create and define release path.
    - Remote copy project.
    - Emit event "updated".
  - deploy:publish
    - Update symlink.
    - Emit event "published".
  - deploy:clean
    - Remove old releases.
    - Emit event "cleaned".
  - deploy:finish
    - Emit event "deployed".
- rollback
  - rollback:init
    - Define release path.
    - Emit event "rollback".
  - deploy:publish
    - Update symlink.
    - Emit event "published".
  - deploy:clean
    - Remove old releases.
    - Emit event "cleaned".
  - rollback:finish
    - Emit event "rollbacked".
- pending
  - pending:log
    - Log pending commits (diff between HEAD and currently deployed revision) to console.

## Dependencies

### Local

- git 1.7.8+
- rsync 3+
- OpenSSH 5+
- mono
- xamarin studio

## License

MIT
