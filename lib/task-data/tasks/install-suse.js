// Copyright 2015, EMC, Inc.

// FIXME: Not debugged

'use strict';

module.exports = {
    friendlyName: 'Install SuSE',
    injectableName: 'Task.Os.Install.SuSE',
    implementsTask: 'Task.Base.Os.Install',
    options: {
	// FIXME: Right now we only have OpenSuSE? 
        profile: 'install-suse.ipxe',
        hostname: 'localhost',
        comport: 'ttyS0',
        domain: 'rackhd.github.com',
        completionUri: 'renasar-ansible.pub',
        version: null, //This task is suitable for CentOS/RHEL with different versions,
                       //so user must explicitly input the version
	// FIXME: Is this correct? 
        repo: '{{api.server}}/suse/distribution/{{options.version}}/repo/oss/suse/x86_64',
        rootPassword: null,
        rootSshKey: null,
        users: [],
        networkDevices: [],
        dnsServers: [],
        driveId: 'sda'
    },
    properties: {
        os: {
            linux: {
		// FIXME: Is this correct?
                distribution: 'suse'
            }
        }
    }
};
