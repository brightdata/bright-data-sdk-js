'use strict'; /*jslint node:true*/

const request = require('sync-request');
const {getLogger} = require('./logging-config.js');
const {validateZoneName} = require('./validation.js');
const {retryRequest} = require('./retry.js');
const {USER_AGENT,ZONE_API_URL} = require('./constants.js');
const {ZoneError,AuthenticationError,APIError} = 
    require('../exceptions/errors.js');

const E = module.exports;
const logger = getLogger('utils.zone-manager');

class ZoneManager {
    constructor(axios_instance,api_token = null){
        this.axios_instance = axios_instance;
        this.api_token = api_token;
        this.base_url = ZONE_API_URL;
        this.headers = api_token ? {
            'Authorization':`Bearer ${api_token}`,
            'Content-Type':'application/json',
            'User-Agent':USER_AGENT
        } : null;
    }
    async list_zones_async(){
        logger.info('Fetching list of active zones');
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.get(`${this.base_url}/get_active_zones`),3,1.5);
            const zones = response.data || [];
            logger.info(`Found ${zones.length} active zones`);
            return zones.map(zone=>({
                name:zone.zone || zone.name,
                type:zone.zone_type || zone.type,
                status:zone.status,
                ips:zone.ips || 0,
                bandwidth:zone.bandwidth || 0,
                created:zone.created_at || zone.created
            }));
        } catch(e){
            if (e.response?.status==401)
                throw new AuthenticationError('Invalid API token or '+
                    'insufficient permissions to list zones');
            if (e.response?.status==403)
                throw new AuthenticationError('Insufficient permissions to list '+
                    'zones. API token needs admin access.');
            throw new APIError(`Failed to list zones: ${e.message}`,
                e.response?.status,e.response?.data);
        }
    }
    async zone_exists_async(zone_name){
        validateZoneName(zone_name);
        logger.debug(`Checking if zone exists: ${zone_name}`);
        try {
            const zones = await this.list_zones_async();
            const exists = zones.some(zone=>zone.name==zone_name);
            logger.debug(`Zone ${zone_name} ${exists ? 'exists' : 
                'does not exist'}`);
            return exists;
        } catch(e){
            logger.warning(`Failed to check if zone exists: ${e.message}`);
            return false;
        }
    }
    async create_zone_async(zone_name,zone_type = 'static',opt = {}){
        validateZoneName(zone_name);
        logger.info(`Creating zone: ${zone_name} (type: ${zone_type})`);
        
        const zone_data = {
            zone:{
                name:zone_name,
                type:zone_type
            },
            plan:{
                type:zone_type,
                domain_whitelist:opt.domain_whitelist || '',
                ips_type:opt.ips_type || 'shared',
                bandwidth:opt.bandwidth || 'bandwidth',
                ip_alloc_preset:opt.ip_alloc_preset || 'shared_block',
                ips:opt.ips || 0,
                country:opt.country || '',
                country_city:opt.country_city || '',
                mobile:opt.mobile || false,
                serp:opt.is_serp_zone || false,
                city:opt.city || false,
                asn:opt.asn || false,
                vip:opt.vip || false,
                vips_type:opt.vips_type || 'shared',
                vips:opt.vips || 0,
                vip_country:opt.vip_country || '',
                vip_country_city:opt.vip_country_city || '',
                pool_ip_type:opt.pool_ip_type || '',
                ub_premium:opt.ub_premium || false,
                solve_captcha_disable:opt.solve_captcha_disable !== false
            }
        };
        
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.post(this.base_url,zone_data),3,1.5);
            logger.info(`Successfully created zone: ${zone_name}`);
            return response.data;
        } catch(e){
            if (e.response?.status==400){
                const error_message = e.response.data?.message || e.message;
                if (error_message.includes('already exists')){
                    logger.info(`Zone ${zone_name} already exists, skipping `+
                        'creation');
                    return {name:zone_name,status:'exists'};
                }
                throw new ZoneError('Invalid zone configuration: '+
                    `${error_message}`);
            }
            if (e.response?.status==401)
                throw new AuthenticationError('Invalid API token or '+
                    'insufficient permissions to create zones');
            if (e.response?.status==403)
                throw new AuthenticationError('Insufficient permissions to '+
                    'create zones. API token needs admin access.');
            throw new ZoneError(`Failed to create zone ${zone_name}: `+
                `${e.message}`,e.response?.status,e.response?.data);
        }
    }
    async ensureRequiredZones_async(web_unlocker_zone,serp_zone){
        logger.info('Ensuring required zones exist',{
            web_unlocker_zone,
            serp_zone
        });
        const results = {
            web_unlocker:{zone:web_unlocker_zone,exists:false,created:false},
            serp:{zone:serp_zone,exists:false,created:false}
        };
        try {
            results.web_unlocker.exists = await this.zone_exists_async(
                web_unlocker_zone);
            if (!results.web_unlocker.exists){
                logger.info(`Creating web unlocker zone: ${web_unlocker_zone}`);
                await this.create_zone_async(web_unlocker_zone,'unblocker');
                results.web_unlocker.created = true;
            } else
                logger.info('Web unlocker zone already exists: '+
                    `${web_unlocker_zone}`);
            results.serp.exists = await this.zone_exists_async(serp_zone);
            if (!results.serp.exists){
                logger.info(`Creating SERP zone: ${serp_zone}`);
                await this.create_zone_async(serp_zone,'unblocker',{is_serp_zone:true});
                results.serp.created = true;
            } else
                logger.info(`SERP zone already exists: ${serp_zone}`);
            logger.info('Zone validation completed',results);
            return results;
        } catch(e){
            logger.error('Failed to ensure required zones exist',{
                error:e.message,
                web_unlocker_zone,
                serp_zone
            });
            logger.warning('Continuing with existing zones despite creation '+
                'failures');
            return results;
        }
    }
    async get_zone_stats(zone_name){
        validateZoneName(zone_name);
        logger.debug(`Fetching statistics for zone: ${zone_name}`);
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.get(`${this.base_url}/${zone_name}`+
                    '/stats'),3,1.5);
            return response.data;
        } catch(e){
            if (e.response?.status==404)
                throw new ZoneError(`Zone not found: ${zone_name}`);
            throw new APIError(`Failed to get zone stats: ${e.message}`,
                e.response?.status,e.response?.data);
        }
    }
    
    // Synchronous methods (default for sync client)
    list_zones(){
        if (this.api_token) {
            return this.list_zones_sync();
        }
        return this.list_zones_async();
    }
    
    list_zones_sync(){
        if (!this.api_token) {
            throw new APIError('API token required for synchronous zone operations');
        }
        logger.info('Fetching list of active zones (sync)');
        try {
            const response = request('GET',`${this.base_url}/get_active_zones`,{
                headers:this.headers,
                timeout:30000
            });
            
            if (response.statusCode === 401) {
                throw new AuthenticationError('Invalid API token or insufficient permissions to list zones');
            }
            if (response.statusCode === 403) {
                throw new AuthenticationError('Insufficient permissions to list zones. API token needs admin access.');
            }
            if (response.statusCode !== 200) {
                throw new APIError(`Failed to list zones: HTTP ${response.statusCode}`,response.statusCode);
            }

            const zones = JSON.parse(response.getBody('utf8')) || [];
            logger.info(`Found ${zones.length} active zones (sync)`);
            return zones.map(zone => ({
                name:zone.zone || zone.name,
                type:zone.zone_type || zone.type,
                status:zone.status,
                ips:zone.ips || 0,
                bandwidth:zone.bandwidth || 0,
                created:zone.created_at || zone.created
            }));
        } catch (e) {
            if (e instanceof AuthenticationError || e instanceof APIError) {
                throw e;
            }
            throw new APIError(`Failed to list zones: ${e.message}`);
        }
    }
    
    zone_exists(zone_name){
        if (this.api_token) {
            return this.zone_exists_sync(zone_name);
        }
        return this.zone_exists_async(zone_name);
    }
    
    zone_exists_sync(zone_name){
        validateZoneName(zone_name);
        logger.debug(`Checking if zone exists (sync): ${zone_name}`);
        try {
            const zones = this.list_zones_sync();
            const exists = zones.some(zone => zone.name === zone_name);
            logger.debug(`Zone ${zone_name} ${exists ? 'exists' : 'does not exist'} (sync)`);
            return exists;
        } catch (e) {
            logger.warning(`Failed to check if zone exists: ${e.message}`);
            return false;
        }
    }
    
    create_zone(zone_name,zone_type = 'static',opt = {}){
        if (this.api_token) {
            return this.create_zone_sync(zone_name,zone_type,opt);
        }
        return this.create_zone_async(zone_name,zone_type,opt);
    }
    
    create_zone_sync(zone_name,zone_type = 'static',opt = {}){
        if (!this.api_token) {
            throw new APIError('API token required for synchronous zone operations');
        }
        validateZoneName(zone_name);
        logger.info(`Creating zone (sync): ${zone_name} (type: ${zone_type})`);
        
        const zone_data = {
            zone:{
                name:zone_name,
                type:zone_type
            },
            plan:{
                type:zone_type,
                domain_whitelist:opt.domain_whitelist || '',
                ips_type:opt.ips_type || 'shared',
                bandwidth:opt.bandwidth || 'bandwidth',
                ip_alloc_preset:opt.ip_alloc_preset || 'shared_block',
                ips:opt.ips || 0,
                country:opt.country || '',
                country_city:opt.country_city || '',
                mobile:opt.mobile || false,
                serp:opt.is_serp_zone || false,
                city:opt.city || false,
                asn:opt.asn || false,
                vip:opt.vip || false,
                vips_type:opt.vips_type || 'shared',
                vips:opt.vips || 0,
                vip_country:opt.vip_country || '',
                vip_country_city:opt.vip_country_city || '',
                pool_ip_type:opt.pool_ip_type || '',
                ub_premium:opt.ub_premium || false,
                solve_captcha_disable:opt.solve_captcha_disable !== false
            }
        };
        
        try {
            const response = request('POST',this.base_url,{
                headers:this.headers,
                json:zone_data,
                timeout:30000
            });
            
            if (response.statusCode === 400) {
                const error_data = JSON.parse(response.getBody('utf8') || '{}');
                const error_message = error_data.message || 'Unknown error';
                if (error_message.includes('already exists')) {
                    logger.info(`Zone ${zone_name} already exists, skipping creation (sync)`);
                    return {name:zone_name,status:'exists'};
                }
                throw new ZoneError(`Invalid zone configuration: ${error_message}`);
            }
            if (response.statusCode === 401) {
                throw new AuthenticationError('Invalid API token or insufficient permissions to create zones');
            }
            if (response.statusCode === 403) {
                throw new AuthenticationError('Insufficient permissions to create zones. API token needs admin access.');
            }
            if (response.statusCode !== 200 && response.statusCode !== 201) {
                throw new ZoneError(`Failed to create zone ${zone_name}: HTTP ${response.statusCode}`,response.statusCode);
            }

            logger.info(`Successfully created zone (sync): ${zone_name}`);
            return JSON.parse(response.getBody('utf8') || '{}');
        } catch (e) {
            if (e instanceof ZoneError || e instanceof AuthenticationError) {
                throw e;
            }
            throw new ZoneError(`Failed to create zone ${zone_name}: ${e.message}`);
        }
    }
    
    ensureRequiredZones(web_unlocker_zone,serp_zone){
        if (this.api_token) {
            return this.ensureRequiredZones_sync(web_unlocker_zone,serp_zone);
        }
        return this.ensureRequiredZones_async(web_unlocker_zone,serp_zone);
    }
    
    ensureRequiredZones_sync(web_unlocker_zone,serp_zone){
        logger.info('Ensuring required zones exist (sync)',{
            web_unlocker_zone,
            serp_zone
        });
        
        const results = {
            web_unlocker:{zone:web_unlocker_zone,exists:false,created:false},
            serp:{zone:serp_zone,exists:false,created:false}
        };
        
        try {
            // Check and create web unlocker zone
            results.web_unlocker.exists = this.zone_exists_sync(web_unlocker_zone);
            if (!results.web_unlocker.exists) {
                logger.info(`Creating web unlocker zone (sync): ${web_unlocker_zone}`);
                this.create_zone_sync(web_unlocker_zone,'unblocker');
                results.web_unlocker.created = true;
            } else {
                logger.info(`Web unlocker zone already exists (sync): ${web_unlocker_zone}`);
            }
            
            // Check and create serp zone
            results.serp.exists = this.zone_exists_sync(serp_zone);
            if (!results.serp.exists) {
                logger.info(`Creating SERP zone (sync): ${serp_zone}`);
                this.create_zone_sync(serp_zone,'unblocker',{is_serp_zone:true});
                results.serp.created = true;
            } else {
                logger.info(`SERP zone already exists (sync): ${serp_zone}`);
            }
            
            logger.info('Zone validation completed (sync)',results);
            return results;
        } catch (e) {
            logger.error('Failed to ensure required zones exist (sync)',{
                error:e.message,
                web_unlocker_zone,
                serp_zone
            });
            // Continue with existing zones despite creation failures for backward compatibility
            logger.warning('Continuing with existing zones despite creation failures');
            return results;
        }
    }
}

E.ZoneManager = ZoneManager;