import { LinkedinAPI } from './linkedin';
import { SnapshotAPI } from './snapshot';
import { ChatgptAPI } from './chatgpt';
import { BaseAPIOptions } from './base';

export class Router {
    snapshot: SnapshotAPI;
    linkedin: LinkedinAPI;
    chatGPT: ChatgptAPI;

    constructor(opts: BaseAPIOptions) {
        this.linkedin = new LinkedinAPI(opts);
        this.snapshot = new SnapshotAPI(opts);
        this.chatGPT = new ChatgptAPI(opts);
    }
}
