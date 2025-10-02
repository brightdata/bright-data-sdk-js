import { LinkedinAPI } from './linkedin';
import { SnapshotAPI } from './snapshot';
import { BaseAPIOptions } from './base';

export class Router {
    snapshot: SnapshotAPI;
    linkedin: LinkedinAPI;

    constructor(opts: BaseAPIOptions) {
        this.linkedin = new LinkedinAPI(opts);
        this.snapshot = new SnapshotAPI(opts);
    }
}
