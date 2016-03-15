// Copyright 2015, EMC, Inc.

'use strict';

module.exports = snmpNodeUpdateJobFactory;
var di = require('di');

di.annotate(snmpNodeUpdateJobFactory, new di.Provide('Job.Snmp.Node.Update'));
di.annotate(snmpNodeUpdateJobFactory, new di.Inject(
    'Job.Base',
    'Util',
    'Services.Waterline',
    'Logger'
    )
);
function snmpNodeUpdateJobFactory(BaseJob, util, waterline, Logger) {
    var logger = Logger.initialize(snmpNodeUpdateJobFactory);

    function SnmpNodeUpdateJob(options, context, taskId) {
        SnmpNodeUpdateJob.super_.call(this, logger, options, context, taskId);
        this.nodeId = this.context.target;
    }
    util.inherits(SnmpNodeUpdateJob, BaseJob);

    SnmpNodeUpdateJob.prototype._run = function _run() {
        var self = this;

        return waterline.nodes.findByIdentifier(self.nodeId)
        .then(function(node) {
            return [node, waterline.catalogs.findOne({ node : node.id })];
        })
        .spread(function (node, catalog) {
            var nodeName = catalog.data._1_3_6_1_2_1_1_1_0 ||
                catalog.data['SNMPv2-MIB::sysDescr_0'];

            /* TODO:  Find the right columns based on ifName */
            /* TODO:  Deal with zeros in MAC address */
            var ma1MacAddr = catalog.data['IF-MIB::ifPhysAddress_999001'];
            var fabricMacAddr = catalog.data['IF-MIB::ifPhysAddress_2000001'];

            return waterline.nodes.updateByIdentifier(node.id, {
                name: nodeName + '_' + node.snmpSettings.host,
                identifiers: [ ma1MacAddr, fabricMacAddr ]
            })
        })
        .then(function() {
            self._done();
        })
        .catch(function(err){
            self._done(err);
        });
    };
    return SnmpNodeUpdateJob;
}

