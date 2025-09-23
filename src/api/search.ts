import type { SearchOptions, SearchEngine } from '../types';
import { RequestAPI, type RequestAPIOptions } from './request';

const toSEUrl = (searchEngine: SearchEngine = 'google', query: string) => {
    const encodedQuery = encodeURIComponent(query.trim());

    switch (searchEngine.toLowerCase()) {
        case 'bing':
            return `https://www.bing.com/search?q=${encodedQuery}`;
        case 'yandex':
            return `https://yandex.com/search/?text=${encodedQuery}`;
        case 'google':
        default:
            return `https://www.google.com/search?q=${encodedQuery}`;
    }
};

export class SearchAPI extends RequestAPI {
    constructor(opts: RequestAPIOptions) {
        super(opts);
        this.name = 'search';
        this.init();
    }

    protected getURL(content: string, opt: SearchOptions) {
        return toSEUrl(opt.searchEngine, content);
    }

    protected getMethod() {
        return 'GET' as const;
    }
}
