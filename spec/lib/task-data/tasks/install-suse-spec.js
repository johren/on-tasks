// Copyright 2015, EMC, Inc.
/* jshint node:true */

// FIXME: Not debugged

'use strict';

describe(require('path').basename(__filename), function () {
    var base = require('./base-tasks-spec');

    base.before(function (context) {
        context.taskdefinition = helper.require('/lib/task-data/tasks/install-suse.js');
    });

    describe('task-data', function () {
        base.examples();
    });

});
