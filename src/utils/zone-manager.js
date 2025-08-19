'use strict'; /*jslint node:true*/

const {getLogger} = require('./logging-config.js');
const {validateZoneName} = require('./validation.js');
const {retryRequest} = require('./retry.js');
const {ZoneError, AuthenticationError, APIError} = 
    require('../exceptions/errors.js');

const E = module.exports;
const logger = getLogger('utils.zone-manager');

class ZoneManager {
    constructor(axios_instance){
        this.axios_instance = axios_instance;
        this.base_url = 'https://brightdata.com/api/zone';
    }
    async list_zones(){
        logger.info('Fetching list of active zones');
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.get(`${this.base_url}/zones`), 3, 1.5);
            const zones = response.data || [];
            logger.info(`Found ${zones.length} active zones`);
            return zones.map(zone=>({
                name: zone.zone || zone.name,
                type: zone.zone_type || zone.type,
                status: zone.status,
                ips: zone.ips || 0,
                bandwidth: zone.bandwidth || 0,
                created: zone.created_at || zone.created
            }));
        } catch(e){
            if (e.response?.status==401)
                throw new AuthenticationError('Invalid API token or '+
                    'insufficient permissions to list zones');
            if (e.response?.status==403)
                throw new AuthenticationError('Insufficient permissions to list '+
                    'zones. API token needs admin access.');
            throw new APIError(`Failed to list zones: ${e.message}`,
                e.response?.status, e.response?.data);
        }
    }
    async zone_exists(zone_name){
        validateZoneName(zone_name);
        logger.debug(`Checking if zone exists: ${zone_name}`);
        try {
            const zones = await this.list_zones();
            const exists = zones.some(zone=>zone.name==zone_name);
            logger.debug(`Zone ${zone_name} ${exists ? 'exists' : 
                'does not exist'}`);
            return exists;
        } catch(e){
            logger.warning(`Failed to check if zone exists: ${e.message}`);
            return false;
        }
    }
    async create_zone(zone_name, zone_type = 'static', opt = {}){
        validateZoneName(zone_name);
        logger.info(`Creating zone: ${zone_name} (type: ${zone_type})`);
        const zone_data = {
            zone: zone_name,
            zone_type,
            ...opt
        };
        try {
            const response = await retryRequest(
                ()=>this.axios_instance.post(`${this.base_url}/create`,
                    zone_data), 3, 1.5);
            logger.info(`Successfully created zone: ${zone_name}`);
            return response.data;
        } catch(e){
            if (e.response?.status==400){
                const error_message = e.response.data?.message || e.message;
                if (error_message.includes('already exists')){
                    logger.info(`Zone ${zone_name} already exists, skipping `+
                        'creation');
                    return {name: zone_name, status: 'exists'};
                }
                throw new ZoneError(`Invalid zone configuration: `+
                    `${error_message}`);
            }
            if (e.response?.status==401)
                throw new AuthenticationError('Invalid API token or '+
                    'insufficient permissions to create zones');
            if (e.response?.status==403)
                throw new AuthenticationError('Insufficient permissions to '+
                    'create zones. API token needs admin access.');
            throw new ZoneError(`Failed to create zone ${zone_name}: `+
                `${e.message}`, e.response?.status, e.response?.data);
        }
    }
    async ensureRequiredZones(web_unlocker_zone, serp_zone){
        logger.info('Ensuring required zones exist', {
            web_unlocker_zone,
            serp_zone
        });
        const results = {
            web_unlocker: {zone: web_unlocker_zone, exists: false, created: false},
            serp: {zone: serp_zone, exists: false, created: false}
        };
        try {
            results.web_unlocker.exists = await this.zone_exists(
                web_unlocker_zone);
            if (!results.web_unlocker.exists){
                logger.info(`Creating web unlocker zone: ${web_unlocker_zone}`);
                await this.create_zone(web_unlocker_zone, 'static');
                results.web_unlocker.created = true;
            } else
                logger.info(`Web unlocker zone already exists: `+
                    `${web_unlocker_zone}`);
            results.serp.exists = await this.zone_exists(serp_zone);
            if (!results.serp.exists){
                logger.info(`Creating SERP zone: ${serp_zone}`);
                await this.create_zone(serp_zone, 'static');
                results.serp.created = true;
            } else
                logger.info(`SERP zone already exists: ${serp_zone}`);
            logger.info('Zone validation completed', results);
            return results;
        } catch(e){
            logger.error('Failed to ensure required zones exist', {
                error: e.message,
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
                    '/stats'), 3, 1.5);
            return response.data;
        } catch(e){
            if (e.response?.status==404)
                throw new ZoneError(`Zone not found: ${zone_name}`);
            throw new APIError(`Failed to get zone stats: ${e.message}`,
                e.response?.status, e.response?.data);
        }
    }
}

E.ZoneManager = ZoneManager;