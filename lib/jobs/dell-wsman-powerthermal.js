﻿//Copyright 2016, EMC, Inc.

'use strict';

var di = require('di'),
urlParse=require('url-parse');

module.exports = wsmanPowerThermalToolJobFactory;
di.annotate(wsmanPowerThermalToolJobFactory, new di.Provide('Job.Dell.PowerThermalTool'));
di.annotate(wsmanPowerThermalToolJobFactory, new di.Inject(
		'Job.Base',
		'Logger',
		'Util',
		'Assert',
		'Promise',
		'_',
		'Services.Encryption',
		'Services.Lookup',
		'Constants',
		'Services.Waterline',
		'Services.Configuration',
		'HttpTool',
		'uuid'

));

function wsmanPowerThermalToolJobFactory(
		BaseJob,
		Logger,
		util,
		assert,
		Promise,
		_,
		encryption,
		lookup,
		Constants,
		waterline, 
		configuration,
		HttpTool,
		uuid
)
{
	var logger = Logger.initialize(wsmanPowerThermalToolJobFactory);
	/**
	 *
	 * @param {Object} options
	 * @param {Object} context
	 * @param {String} taskId
	 * @constructor
	 */
	function PowerThermalTool(options, context, taskId) {
		PowerThermalTool.super_.call(this, logger, options, context, taskId);

		this.nodeId = this.context.target;
		this.powerCap = options.powerCap;
		this.enableCapping= ((options.enableCapping && options.enableCapping==true) ? true:false);
		this.dellConfigs = undefined;   


	} 
	util.inherits(PowerThermalTool, BaseJob);


	 /*
	 *  Initialize basic configuration for the job
	 *
	 */

	PowerThermalTool.prototype.initJob = function () {
		var self = this;

		logger.info("initializing power monitoring capping job");
			
		self.dellConfigs = configuration.get('dell');

		if (!self.dellConfigs ||
			!self.dellConfigs.services.powerThermalMonitoring){
		     throw new errors.NotFoundError(
			'Dell web service configuration is not defined in wsmanConfig.json.');
		}
		self.powerThermalConfigs=self.dellConfigs.services.powerThermalMonitoring;   	            
		self.apiServer=self.powerThermalConfigs.host;
				
		
		return waterline.obms.findByNode(self.nodeId, 'dell-wsman-obm-service', true)
		 .then(function(obm) {
        	 if (!obm) { 
            	throw new errors.NotFoundError('Failed to find Wsman obm settings'); 
             }
           
		 self.printResult(obm);
         self.oobServerAddress=obm.config.host;
       	 self.userConfig={	
       		     "user" :obm.config.userName,
       		     "password" : encryption.decrypt(obm.config.password)
       	 }
       	        	 
  	 });      
		  	
		          		
	}	
	
	
		
	
	/*
	*   Print the result for RestAPI Response
	*/
	
	PowerThermalTool.prototype.printResult = function (result) {
		
		logger.info(JSON.stringify(result,null,4));

	};

	
	

	/**
	 * @memberOf WsmanToolJob
	 */

	PowerThermalTool.prototype._run = function() {
		var self = this;
		logger.info("setting power on target server machine ");
		
		return Promise.resolve(this.initJob())
		.then(function(){
			self.setPowerCapping();
			logger.info("Capping applied successfully on server");
			self._done();
		 	 				
		})
	    .catch(function(error){
				self._done(error);
		});
			

	} ;

	
	
	
	
	PowerThermalTool.prototype.setPowerCapping = function() {
		var self = this;

				
		var apiHost=self.apiServer;
		var path=self.powerThermalConfigs.endpoints.powerthermal;
		var method='PUT';
			
		if (!self.userConfig){
			throw ("No user configuration data provided ");
		}
		var data= {
			
				"serverAddress": self.oobServerAddress,
				"userName" :self.userConfig.user,
				"password" :self.userConfig.password,
				"powerCap": self.powerCap,
	            "enableCapping" :self.enableCapping			
		};
		
		return self.clientRequest(apiHost,path,method,data);
	} ;
	
	
		
	

	/*
	 * Client Request API
	 * 
	 * 
	 */

	PowerThermalTool.prototype.clientRequest = function(host, path, method, data) {
		var self = this;

		var parse = urlParse(host);

		var setups = {};

		setups.url = {};
		setups.url.protocol = parse.protocol.replace(':','').trim();
		setups.url.host = parse.host.split(':')[0];
		setups.url.port = parse.port;
		setups.url.path = path || '/';

		setups.method = method || 'GET';
		setups.credential = {};
		setups.verifySSl = false;
		setups.headers = {'Content-Type': 'application/json'};
		setups.recvTimeoutMs = 60000;
		setups.data = data || '';
			
		
		self.printResult(setups);
		
		var http = new HttpTool();
		return http.setupRequest(setups)
		.then(function(){
			return http.runRequest();
		})
		.then(function(response){
			if (response.httpStatusCode > 206) {
				var errorMsg = _.get(response, 'body.error.message', 'IP is NOT valid or  httpStatusCode > 206 .');
				throw new Error(errorMsg);
			}

			if (response.body.length > 0) {
				response.body = JSON.parse(response.body);
			}
			return response.body;
		});
	};


	return PowerThermalTool;
}
