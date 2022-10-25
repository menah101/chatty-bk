import { IPostJobData } from '@post/interfaces/post.interface';
import { postWorker } from '@worker/post.worker';
import { BaseQueue } from './base.queue';

class PostQueue extends BaseQueue {
  constructor() {
    super('user');
    this.processJob('addPostToDB', 5, postWorker.savePostToDB);
    this.processJob('deletePostToDB', 5, postWorker.deletePostFromDB);
    this.processJob('updatePostInDB', 5, postWorker.updatePostInDB);
  }

  public addPostJob(name: string, data: IPostJobData): void {
    this.addJob(name, data);
  }
}

export const postQueue: PostQueue = new PostQueue();
