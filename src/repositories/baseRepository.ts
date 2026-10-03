import { DatabaseClient } from '../database';

export abstract class BaseRepository {
  protected readonly db: DatabaseClient;

  constructor(db: DatabaseClient) {
    this.db = db;
  }
}
