import { request } from 'undici';
import { getLogger } from './logging-config';
import { ZONE_API_URL } from './constants';
import { getAuthHeaders } from './auth';
import { ZoneError, AuthenticationError, APIError } from '../exceptions/errors';
import type { ZoneInfo, ZoneInfoResponse } from '../types';

const logger = getLogger('utils.zone-manager');

interface ZoneCreationOpts {
    type?: 'static' | 'unblocker';
    domain_whitelist?: string;
    ips_type?: string;
    bandwidth?: string;
    ip_alloc_preset?: string;
    ips?: number;
    country?: string;
    country_city?: string;
    mobile?: boolean;
    is_serp_zone?: boolean;
    city?: boolean;
    asn?: boolean;
    vip?: boolean;
    vips_type?: string;
    vips?: number;
    vip_country?: string;
    vip_country_city?: string;
    pool_ip_type?: string;
    ub_premium?: boolean;
    solve_captcha_disable?: boolean;
}

interface ZoneManagerOpts {
    apiKey: string;
}

export class ZoneManager {
    private authHeaders: Record<string, string>;

    constructor(opts: ZoneManagerOpts) {
        this.authHeaders = getAuthHeaders(opts.apiKey);
    }
    async listZones(): Promise<ZoneInfo[]> {
        logger.info('Fetching list of active zones');

        try {
            const response = await request(`${ZONE_API_URL}/get_active_zones`, {
                headers: this.authHeaders,
            });

            const zones = (await response.body.json()) as ZoneInfoResponse[];

            logger.info(`Found ${zones.length} active zones`);

            return zones.map((zone) => ({
                name: zone.zone || zone.name,
                type: zone.zone_type || zone.type,
                status: zone.status,
                ips: zone.ips || 0,
                bandwidth: zone.bandwidth || 0,
                created: zone.created_at || zone.created,
            }));
        } catch (e: any) {
            if (e.response?.status == 401)
                throw new AuthenticationError(
                    'Invalid API key or ' +
                        'insufficient permissions to list zones',
                );
            if (e.response?.status == 403)
                throw new AuthenticationError(
                    'Insufficient permissions to list ' +
                        'zones. API key needs admin access.',
                );
            throw new APIError(
                `Failed to list zones: ${e.message}`,
                e.response?.status,
                e.response?.data,
            );
        }
    }
    private async isZoneExists(zone_name: string) {
        logger.debug(`Checking if zone exists: ${zone_name}`);
        try {
            const zones = await this.listZones();
            const exists = zones.some((zone) => zone.name == zone_name);
            logger.debug(
                `Zone ${zone_name} ${exists ? 'exists' : 'does not exist'}`,
            );
            return exists;
        } catch (e: any) {
            logger.warning(`Failed to check if zone exists: ${e.message}`);
            return false;
        }
    }
    private async createZone(zoneName: string, opt: ZoneCreationOpts = {}) {
        const { type: zoneType = 'static' } = opt;
        logger.info(`Creating zone: ${zoneName} (type: ${zoneType})`);

        const zoneData = {
            zone: {
                name: zoneName,
                type: zoneType,
            },
            plan: {
                type: zoneType,
                domain_whitelist: opt.domain_whitelist || '',
                ips_type: opt.ips_type || 'shared',
                bandwidth: opt.bandwidth || 'bandwidth',
                ip_alloc_preset: opt.ip_alloc_preset || 'shared_block',
                ips: opt.ips || 0,
                country: opt.country || '',
                country_city: opt.country_city || '',
                mobile: opt.mobile || false,
                serp: opt.is_serp_zone || false,
                city: opt.city || false,
                asn: opt.asn || false,
                vip: opt.vip || false,
                vips_type: opt.vips_type || 'shared',
                vips: opt.vips || 0,
                vip_country: opt.vip_country || '',
                vip_country_city: opt.vip_country_city || '',
                pool_ip_type: opt.pool_ip_type || '',
                ub_premium: opt.ub_premium || false,
                solve_captcha_disable: opt.solve_captcha_disable !== false,
            },
        };

        try {
            const response = await request(ZONE_API_URL, {
                headers: this.authHeaders,
                method: 'POST',
                body: JSON.stringify(zoneData),
            });

            logger.info(`Successfully created zone: ${zoneName}`);

            return await response.body.json();
        } catch (e: any) {
            if (e.response?.status == 400) {
                const error_message = e.response.data?.message || e.message;
                if (error_message.includes('already exists')) {
                    logger.info(
                        `Zone ${zoneName} already exists, skipping creation`,
                    );
                    return { name: zoneName, status: 'exists' };
                }
                throw new ZoneError(
                    'Invalid zone configuration: ' + `${error_message}`,
                );
            }
            if (e.response?.status == 401)
                throw new AuthenticationError(
                    'Invalid API key or ' +
                        'insufficient permissions to create zones',
                );
            if (e.response?.status == 403)
                throw new AuthenticationError(
                    'Insufficient permissions to ' +
                        'create zones. API key needs admin access.',
                );
            throw new ZoneError(
                `Failed to create zone ${zoneName}: ` + `${e.message}`,
            );
        }
    }
    async ensureRequiredZones(webUnlockerZone: string, serpZone: string) {
        logger.info('Ensuring required zones exist', {
            webUnlockerZone,
            serpZone,
        });
        const results = {
            web_unlocker: {
                zone: webUnlockerZone,
                exists: false,
                created: false,
            },
            serp: { zone: serpZone, exists: false, created: false },
        };
        try {
            results.web_unlocker.exists =
                await this.isZoneExists(webUnlockerZone);
            if (!results.web_unlocker.exists) {
                logger.info(`Creating web unlocker zone: ${webUnlockerZone}`);
                await this.createZone(webUnlockerZone, { type: 'unblocker' });
                results.web_unlocker.created = true;
            } else
                logger.info(
                    'Web unlocker zone already exists: ' + `${webUnlockerZone}`,
                );
            results.serp.exists = await this.isZoneExists(serpZone);
            if (!results.serp.exists) {
                logger.info(`Creating SERP zone: ${serpZone}`);
                await this.createZone(serpZone, {
                    type: 'unblocker',
                    is_serp_zone: true,
                });
                results.serp.created = true;
            } else logger.info(`SERP zone already exists: ${serpZone}`);
            logger.info('Zone validation completed', results);
            return results;
        } catch (e: any) {
            logger.error('Failed to ensure required zones exist', {
                error: e.message,
                webUnlockerZone,
                serpZone,
            });
            logger.warning(
                'Continuing with existing zones despite creation ' + 'failures',
            );
            return results;
        }
    }
}
