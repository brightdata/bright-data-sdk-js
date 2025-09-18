import { request } from 'undici';
import { getLogger } from './logging-config';
import { validateZoneName } from './validation';
import { ZONE_API_URL } from './constants';
import { getAuthHeaders } from './auth';
import { ZoneError, AuthenticationError, APIError } from '../exceptions/errors';
import type { ZoneInfo, ZoneInfoResponse } from '../types';

const logger = getLogger('utils.zone-manager');

interface ZoneCreationOpts {
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

export class ZoneManager {
    private base_url: string;
    private headers: Record<string, string> | null;

    constructor(api_token: string) {
        this.base_url = ZONE_API_URL;
        this.headers = getAuthHeaders(api_token);
    }
    async list_zones(): Promise<ZoneInfo[]> {
        logger.info('Fetching list of active zones');

        try {
            const response = await request(
                `${this.base_url}/get_active_zones`,
                {
                    headers: this.headers,
                },
            );

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
                    'Invalid API token or ' +
                        'insufficient permissions to list zones',
                );
            if (e.response?.status == 403)
                throw new AuthenticationError(
                    'Insufficient permissions to list ' +
                        'zones. API token needs admin access.',
                );
            throw new APIError(
                `Failed to list zones: ${e.message}`,
                e.response?.status,
                e.response?.data,
            );
        }
    }
    private async isZoneExists(zone_name: string) {
        validateZoneName(zone_name);
        logger.debug(`Checking if zone exists: ${zone_name}`);
        try {
            const zones = await this.list_zones();
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
    private async createZone(
        zone_name: string,
        zone_type = 'static',
        opt: ZoneCreationOpts = {},
    ) {
        validateZoneName(zone_name);
        logger.info(`Creating zone: ${zone_name} (type: ${zone_type})`);

        const zone_data = {
            zone: {
                name: zone_name,
                type: zone_type,
            },
            plan: {
                type: zone_type,
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
            const response = await request(this.base_url, {
                headers: this.headers,
                method: 'POST',
                body: JSON.stringify(zone_data),
            });

            logger.info(`Successfully created zone: ${zone_name}`);

            return await response.body.json();
        } catch (e: any) {
            if (e.response?.status == 400) {
                const error_message = e.response.data?.message || e.message;
                if (error_message.includes('already exists')) {
                    logger.info(
                        `Zone ${zone_name} already exists, skipping creation`,
                    );
                    return { name: zone_name, status: 'exists' };
                }
                throw new ZoneError(
                    'Invalid zone configuration: ' + `${error_message}`,
                );
            }
            if (e.response?.status == 401)
                throw new AuthenticationError(
                    'Invalid API token or ' +
                        'insufficient permissions to create zones',
                );
            if (e.response?.status == 403)
                throw new AuthenticationError(
                    'Insufficient permissions to ' +
                        'create zones. API token needs admin access.',
                );
            throw new ZoneError(
                `Failed to create zone ${zone_name}: ` + `${e.message}`,
            );
        }
    }
    async ensureRequiredZones(webUnlockerZone: string, serp_zone: string) {
        logger.info('Ensuring required zones exist', {
            webUnlockerZone,
            serp_zone,
        });
        const results = {
            web_unlocker: {
                zone: webUnlockerZone,
                exists: false,
                created: false,
            },
            serp: { zone: serp_zone, exists: false, created: false },
        };
        try {
            results.web_unlocker.exists =
                await this.isZoneExists(webUnlockerZone);
            if (!results.web_unlocker.exists) {
                logger.info(`Creating web unlocker zone: ${webUnlockerZone}`);
                await this.createZone(webUnlockerZone, 'unblocker');
                results.web_unlocker.created = true;
            } else
                logger.info(
                    'Web unlocker zone already exists: ' + `${webUnlockerZone}`,
                );
            results.serp.exists = await this.isZoneExists(serp_zone);
            if (!results.serp.exists) {
                logger.info(`Creating SERP zone: ${serp_zone}`);
                await this.createZone(serp_zone, 'unblocker', {
                    is_serp_zone: true,
                });
                results.serp.created = true;
            } else logger.info(`SERP zone already exists: ${serp_zone}`);
            logger.info('Zone validation completed', results);
            return results;
        } catch (e: any) {
            logger.error('Failed to ensure required zones exist', {
                error: e.message,
                webUnlockerZone,
                serp_zone,
            });
            logger.warning(
                'Continuing with existing zones despite creation ' + 'failures',
            );
            return results;
        }
    }
}
