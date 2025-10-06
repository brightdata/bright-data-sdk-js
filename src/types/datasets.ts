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
    /**
     * The prompt you want to search for, each prompt is
     * a separate engagement with GPT and does not take into consideration
     * past engagements that are not part of this prompt request.
     * Note that there is a 4,096-character limit (for each input and output)
     * according to the ChatGPT criteria
     */
    prompt: string;
    /**
     * The additional_prompt is a follow-up input sent after receiving
     * the first answer, aiming to clarify, expand, or refine
     * the initial response. The system processes this prompt and returns
     * the result as additional_answer_text.
     */
    additional_prompt?: string;
    /**
     * Country from which to perform the search
     */
    country?: string;
    /**
     * If it is set to 'true' and sources will not appear in the page
     * you will receive an error message instead of the record
     */
    require_sources?: boolean;
    /**
     * If set to true (default), the web search button will be clicked
     * automatically; if set to false, the button will not be clicked.
     */
    web_search?: boolean;
}

export interface LinkedinProfileFilter extends UnknownRecord {
    /**
     * First name of the person
     */
    first_name: string;
    /**
     * Last name of the person
     */
    last_name: string;
}

export interface LinkedinJobFilter extends UnknownRecord {
    /**
     * Collect jobs in a specific location
     */
    location: string;
    /**
     * Collect new jobs by keyword search like the job title,
     * for example: Product Manager.
     * Utilize quotation marks around specific words or phrases
     * to ensure an exact match.
     */
    keyword?: string;
    /**
     * Use country code with 2 letters like US or FR
     */
    country?: string;
    /**
     * Time range of the job posting
     */
    time_range?: 'Past 24 hours' | 'Past week' | 'Past month' | 'Any time';
    /**
     * Collect jobs from specific type like Full-time or Part-time
     */
    job_type?:
        | 'Full-time'
        | 'Part-time'
        | 'Contract'
        | 'Temporary'
        | 'Volunteer';
    /**
     * Collect jobs from a specific experience level
     */
    experience_level?:
        | 'Internship'
        | 'Entry level'
        | 'Associate'
        | 'Mid-Senior level'
        | 'Director'
        | 'Executive';
    /**
     * Specify if you want to collect only "Remote", "On-site" or "Hybrid" jobs
     */
    remote?: 'On-site' | 'Remote' | 'Hybrid';
    /**
     * Collect jobs from a specific company
     */
    company?: string;
    /**
     * An area radius to find jobs within a certain distance
     */
    location_radius?:
        | 'Exact location'
        | '5 miles (8 km)'
        | '10 miles (16 km)'
        | '25 miles (40 km)'
        | '50 miles (80 km)';
    /**
     * When set to true, the filter will exclude titles that
     * do not contain the specified keywords
     */
    selective_search?: boolean;
}

export interface AmazonCollectProductsFilter extends UnknownRecord {
    /**
     * Amazon product URL
     */
    url: string;
    /**
     * The ZIP code for the area you want to search from
     */
    zipcode?: string;
    /**
     * Language of the page
     */
    language?: string;
}

export interface AmazonCollectReviewsFilter extends UnknownRecord {
    /**
     * Product URL to get reviews from
     */
    url: string;
    /**
     * List of reviews IDs to exclude from collection
     */
    reviews_to_not_include?: string[];
}
