import { LinkedinAPI } from './linkedin';
import { SnapshotAPI } from './snapshot';
import { ChatgptAPI } from './chatgpt';
import { AmazonAPI } from './amazon';
import { BaseAPIOptions } from './base';
import { InstagramAPI } from './instagram';
import { FacebookAPI } from './facebook';

export class Router {
    snapshot: SnapshotAPI;
    linkedin: LinkedinAPI;
    chatGPT: ChatgptAPI;
    amazon: AmazonAPI;
    instagram: InstagramAPI;
    facebook: FacebookAPI;

    constructor(opts: BaseAPIOptions) {
        this.snapshot = new SnapshotAPI(opts);
        this.linkedin = new LinkedinAPI(opts);
        this.chatGPT = new ChatgptAPI(opts);
        this.amazon = new AmazonAPI(opts);
        this.instagram = new InstagramAPI(opts);
        this.facebook = new FacebookAPI(opts);
    }
}
