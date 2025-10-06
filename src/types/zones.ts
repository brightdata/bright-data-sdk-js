export type ZoneType =
    | 'dc'
    | 'serp'
    | 'unblocker'
    | 'res_rotating'
    | 'res_static'
    | 'browser_api'
    | 'mobile';

export interface ZoneInfo {
    name: string;
    type: ZoneType;
    ips: number;
    bandwidth: number;
    created?: string;
    status?: string;
}

export type ZoneInfoResponse = ZoneInfo & {
    zone_type?: ZoneInfo['type'];
    created_at?: string;
    zone?: string;
};
