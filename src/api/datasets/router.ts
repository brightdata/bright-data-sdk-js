import { LinkedinAPI } from './linkedin';
import { BaseAPIOptions } from './base';

export class Router {
    linkedin: LinkedinAPI;

    constructor(opts: BaseAPIOptions) {
        this.linkedin = new LinkedinAPI(opts);
    }

    async getSnapshotStatus(snapshotId: string) {
        return this.linkedin.getSnapshotStatus(snapshotId);
    }
}
