'use strict';

module.exports = ansibleJobFactory;
var di = require('di');

di.annotate(ansibleJobFactory, new di.Provide('Job.Ansible.Playbook'));
di.annotate(ansibleJobFactory, new di.Inject(
    'Job.Base',
    'Util',
    'Logger',
    'JobUtils.Ansible.Playbook',
    'Assert',
    'Services.Waterline'
    )
);

function ansibleJobFactory(
        BaseJob,
        util,
        Logger,
        AnsibleTool,
        assert,
        waterline
) {
    var logger = Logger.initialize(ansibleJobFactory);

    function ansibleJob(options, context, taskId) {
        ansibleJob.super_.call(this, logger, options, context, taskId);
        this.ansibleCmd = undefined;
        this.nodeId = this.context.target;
        this.routingKey = context.graphId;
        this.extra_vars = options.vars ? JSON.stringify(options.vars) : null;
        logger.silly("dump", {
                options: options,
                extra_vars: this.extra_vars || 'none'
            });
        assert.uuid(this.routingKey);
    }
    util.inherits(ansibleJob, BaseJob);

    ansibleJob.prototype._run = function run() {
        var self = this;

        waterline.nodes.findByIdentifier(self.nodeId)
        .then(function (node) {
            assert.ok(node, "Node should exist to be a target of ansible playbooks");

            self.ansibleCmd = new AnsibleTool();
            return [node, self.ansibleCmd.runPlaybook(node, self.options.playbook, self.extra_vars )];
        })
        .spread(function(node, result) {
            var data = {
                host: node,
                result: result
            };
            return self._publishAnsibleResult(self.routingKey, data);
        })
        .then(function() {
            self.ansibleCmd = undefined;
            self._done();
        })
        .catch(function(err) {
            self.ansibleCmd = undefined;
            self._done(err);
        });
    };

    ansibleJob.prototype._cleanup = function cleanup() {
        if(this.ansibleCmd) {
            this.ansibleCmd.kill();
        }
    };

    return ansibleJob;
}