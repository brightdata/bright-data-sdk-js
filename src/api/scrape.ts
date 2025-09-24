import type { ScrapeOptions } from '../types';
import { RequestAPI, type RequestAPIOptions } from './request';

export class ScrapeAPI extends RequestAPI {
    constructor(opts: RequestAPIOptions) {
        super(opts);
        this.name = 'scrape';
        this.zoneType = 'unblocker';
        this.init();
    }

    protected getURL(content: string) {
        return content;
    }

    protected getMethod(opt: ScrapeOptions) {
        return opt.method;
    }
}
