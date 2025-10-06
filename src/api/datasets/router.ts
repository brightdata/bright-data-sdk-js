import { LinkedinAPI } from './linkedin';
import { SnapshotAPI } from './snapshot';
import { ChatgptAPI } from './chatgpt';
import { AmazonAPI } from './amazon';
import { BaseAPIOptions } from './base';

export class Router {
    snapshot: SnapshotAPI;
    linkedin: LinkedinAPI;
    chatGPT: ChatgptAPI;
    amazon: AmazonAPI;

    constructor(opts: BaseAPIOptions) {
        this.snapshot = new SnapshotAPI(opts);
        this.linkedin = new LinkedinAPI(opts);
        this.chatGPT = new ChatgptAPI(opts);
        this.amazon = new AmazonAPI(opts);
    }
}
