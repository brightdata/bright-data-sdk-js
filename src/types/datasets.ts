export type SnapshotFormat = 'json' | 'ndjson' | 'jsonl' | 'csv';

interface DatasetOptionsBase {
    async?: boolean;
    format?: SnapshotFormat;
    customOutputFields?: string;
    includeErrors?: boolean;
}

export interface DatasetOptionsSync extends DatasetOptionsBase {
    async?: false;
}

export interface DatasetOptionsAsync extends DatasetOptionsBase {
    async: true;
    type?: 'discover_new';
    discoverBy?: string;
    limitPerInput?: number;
    limitMultipleResults?: number;
}

export type DatasetOptions = DatasetOptionsSync | DatasetOptionsAsync;

export interface SnapshotDownloadOptions {
    format?: SnapshotFormat;
    compress?: boolean;
}

export type SnapshotStatus = 'running' | 'ready' | 'failed';

export interface SnapshotMeta {
    snapshot_id: string;
}

export interface SnapshotStatusResponse extends SnapshotMeta {
    dataset_id: string;
    status: SnapshotStatus;
}

export type UnknownRecord = Record<string, unknown>;

export interface UrlFilter extends UnknownRecord {
    url: string;
}

export interface ChatgptFilter extends UnknownRecord {
    prompt: string;
    additional_prompt?: string;
    country?: string;
    require_sources?: boolean;
    web_search?: boolean;
}

export interface LinkedinProfileFilter extends UnknownRecord {
    first_name?: string;
    last_name?: string;
}

export interface LinkedinJobFilter extends UnknownRecord {
    location?: string;
    keyword?: string;
    country?: string;
    time_range?: 'Past 24 hours' | 'Past week' | 'Past month' | 'Any time';
    job_type?:
        | 'Full-time'
        | 'Part-time'
        | 'Contract'
        | 'Temporary'
        | 'Volunteer';
    experience_level?:
        | 'Internship'
        | 'Entry level'
        | 'Associate'
        | 'Mid-Senior level'
        | 'Director'
        | 'Executive';
    remote?: 'On-site' | 'Remote' | 'Hybrid';
    company?: string;
    location_radius?:
        | 'Exact location'
        | '5 miles (8 km)'
        | '10 miles (16 km)'
        | '25 miles (40 km)'
        | '50 miles (80 km)';
    selective_search?: boolean;
}
