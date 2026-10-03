import { BaseRepository } from './baseRepository';
import { BirthdayEntity, CrudRepository } from './types';
import { DatabaseClient } from '../database';
import { DateService, ZodiacSignInfo } from '../services/dateService';
import { MediaService } from '../services/mediaService';
import { Logger } from '../services/loggerService';
import { notificationService } from '../notifications/notificationService';

export interface UpcomingBirthday extends BirthdayEntity {
  daysUntil: number;
  turningAge: number | null;
  currentAge: number | null;
  formattedBirthDate: string;
  shortBirthDate: string;
  countdownLabel: string;
  zodiacSign: ZodiacSignInfo;
  isLeapDay: boolean;
}

export interface BirthdayStats {
  totalActive: number;
  next30DaysCount: number;
  thisMonthCount: number;
  favoriteCount: number;
  nearestBirthday: UpcomingBirthday | null;
}

export interface FindBirthdaysOptions {
  filter?: 'all' | 'upcoming' | 'month' | 'favorites';
  search?: string;
  referenceDate?: Date;
}

export interface IBirthdayRepository extends CrudRepository<BirthdayEntity> {
  findUpcoming(limit?: number, referenceDate?: Date): Promise<UpcomingBirthday[]>;
  findAllWithOptions(options?: FindBirthdaysOptions): Promise<UpcomingBirthday[]>;
  getBirthdayStats(referenceDate?: Date): Promise<BirthdayStats>;
  toggleFavorite(id: string, isFavorite: boolean): Promise<void>;
}

export function sortBirthdaysAlphabeticalWithFavorites<
  T extends { name: string; is_favorite?: number | boolean; daysUntil?: number; id?: string }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const isFavA = Number(a.is_favorite) === 1 ? 1 : 0;
    const isFavB = Number(b.is_favorite) === 1 ? 1 : 0;

    // Favourites come up first
    if (isFavA !== isFavB) {
      return isFavB - isFavA;
    }

    // Alphabetical order based on name (case-insensitive)
    const nameDiff = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    if (nameDiff !== 0) {
      return nameDiff;
    }

    // Tie-breaker by daysUntil if available
    if (a.daysUntil !== undefined && b.daysUntil !== undefined && a.daysUntil !== b.daysUntil) {
      return a.daysUntil - b.daysUntil;
    }

    return (a.id || '').localeCompare(b.id || '');
  });
}

export class BirthdayRepository extends BaseRepository implements IBirthdayRepository {
  constructor(db: DatabaseClient) {
    super(db);
  }

  public async findById(id: string): Promise<BirthdayEntity | null> {
    try {
      const result = await this.db.execute<BirthdayEntity>(
        'SELECT * FROM birthdays WHERE id = ? AND is_archived = 0;',
        [id]
      );
      return result.rows[0] ?? null;
    } catch (error) {
      Logger.error('BirthdayRepository.findById failed', error);
      return null;
    }
  }

  public async findUpcomingBirthdayById(
    id: string,
    referenceDate: Date = new Date()
  ): Promise<UpcomingBirthday | null> {
    const entity = await this.findById(id);
    if (!entity) return null;
    return this.mapToUpcoming(entity, referenceDate);
  }

  public async findAll(): Promise<BirthdayEntity[]> {
    try {
      const result = await this.db.execute<BirthdayEntity>(
        'SELECT * FROM birthdays WHERE is_archived = 0 ORDER BY created_at DESC;'
      );
      return result.rows;
    } catch (error) {
      Logger.error('BirthdayRepository.findAll failed', error);
      return [];
    }
  }

  public async findAllWithOptions(
    options: FindBirthdaysOptions = {}
  ): Promise<UpcomingBirthday[]> {
    try {
      const { filter = 'all', search, referenceDate = new Date() } = options;
      const currentMonth = referenceDate.getMonth() + 1;

      let sql = 'SELECT * FROM birthdays WHERE is_archived = 0';
      const params: unknown[] = [];

      if (filter === 'favorites') {
        sql += ' AND is_favorite = 1';
      } else if (filter === 'month') {
        sql += ' AND birth_month = ?';
        params.push(currentMonth);
      }

      if (search && search.trim().length > 0) {
        const queryTerm = `%${search.trim()}%`;
        sql += ' AND (name LIKE ? OR (nickname IS NOT NULL AND nickname LIKE ?))';
        params.push(queryTerm, queryTerm);
      }

      sql += ' ORDER BY is_favorite DESC, name COLLATE NOCASE ASC;';

      const result = await this.db.execute<BirthdayEntity>(sql, params);
      const mapped = result.rows.map((b) => this.mapToUpcoming(b, referenceDate));

      if (filter === 'upcoming') {
        const upcomingItems = mapped.filter((b) => b.daysUntil <= 30);
        return sortBirthdaysAlphabeticalWithFavorites(upcomingItems);
      }

      return sortBirthdaysAlphabeticalWithFavorites(mapped);
    } catch (error) {
      Logger.error('BirthdayRepository.findAllWithOptions failed', error);
      return [];
    }
  }

  public async findUpcoming(
    limit: number = 10,
    referenceDate: Date = new Date()
  ): Promise<UpcomingBirthday[]> {
    try {
      const all = await this.findAll();
      const mapped = all.map((b) => this.mapToUpcoming(b, referenceDate));

      mapped.sort((a, b) => a.daysUntil - b.daysUntil);
      return mapped.slice(0, limit);
    } catch (error) {
      Logger.error('BirthdayRepository.findUpcoming failed', error);
      return [];
    }
  }

  public async getBirthdayStats(referenceDate: Date = new Date()): Promise<BirthdayStats> {
    try {
      const upcoming = await this.findUpcoming(100, referenceDate);
      const currentMonth = referenceDate.getMonth() + 1;

      const next30DaysCount = upcoming.filter((b) => b.daysUntil <= 30).length;
      const thisMonthCount = upcoming.filter((b) => b.birth_month === currentMonth).length;
      const favoriteCount = upcoming.filter((b) => Number(b.is_favorite) === 1).length;
      const nearestBirthday = upcoming[0] ?? null;

      return {
        totalActive: upcoming.length,
        next30DaysCount,
        thisMonthCount,
        favoriteCount,
        nearestBirthday,
      };
    } catch (error) {
      Logger.error('BirthdayRepository.getBirthdayStats failed', error);
      return {
        totalActive: 0,
        next30DaysCount: 0,
        thisMonthCount: 0,
        favoriteCount: 0,
        nearestBirthday: null,
      };
    }
  }

  public async toggleFavorite(id: string, isFavorite: boolean): Promise<void> {
    try {
      await this.db.execute(
        'UPDATE birthdays SET is_favorite = ?, updated_at = ? WHERE id = ?;',
        [isFavorite ? 1 : 0, new Date().toISOString(), id]
      );
    } catch (error) {
      Logger.error('BirthdayRepository.toggleFavorite failed', error);
      throw error;
    }
  }

  public async create(entity: BirthdayEntity): Promise<void> {
    try {
      // Ensure day and month are extracted if not explicitly present
      let day = entity.birth_day;
      let month = entity.birth_month;
      let year = entity.birth_year ?? null;

      if (!day || !month) {
        const parsed = DateService.parseDateString(entity.birth_date);
        if (parsed) {
          day = parsed.day;
          month = parsed.month;
          year = parsed.year;
        } else {
          day = 1;
          month = 1;
        }
      }

      // Generate consistent birth_date string
      const birthDate = year
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      await this.db.execute(
        `INSERT INTO birthdays (
          id, name, birth_date, birth_day, birth_month, birth_year, nickname,
          relationship, photo_uri, photo_thumbnail_uri, is_favorite, reminder_days_before, notes,
          is_archived, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          entity.id,
          entity.name.trim(),
          birthDate,
          day,
          month,
          year,
          entity.nickname?.trim() || null,
          entity.relationship || 'Friend',
          entity.photo_uri || null,
          entity.photo_thumbnail_uri || null,
          entity.is_favorite ? 1 : 0,
          entity.reminder_days_before ?? 1,
          entity.notes?.trim() || null,
          entity.is_archived ?? 0,
          entity.created_at || new Date().toISOString(),
          entity.updated_at || new Date().toISOString(),
        ]
      );
      await notificationService.scheduleBirthdayNotification(entity);
    } catch (error) {
      Logger.error('BirthdayRepository.create failed', error);
      throw error;
    }
  }

  public async update(entity: BirthdayEntity): Promise<void> {
    try {
      let day = entity.birth_day;
      let month = entity.birth_month;
      let year = entity.birth_year ?? null;

      if (!day || !month) {
        const parsed = DateService.parseDateString(entity.birth_date);
        if (parsed) {
          day = parsed.day;
          month = parsed.month;
          year = parsed.year;
        } else {
          day = 1;
          month = 1;
        }
      }

      const birthDate = year
        ? `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        : `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      await this.db.execute(
        `UPDATE birthdays
         SET name = ?, birth_date = ?, birth_day = ?, birth_month = ?, birth_year = ?,
             nickname = ?, relationship = ?, photo_uri = ?, photo_thumbnail_uri = ?,
             is_favorite = ?, reminder_days_before = ?, notes = ?, is_archived = ?, updated_at = ?
         WHERE id = ?;`,
        [
          entity.name.trim(),
          birthDate,
          day,
          month,
          year,
          entity.nickname?.trim() || null,
          entity.relationship || 'Friend',
          entity.photo_uri || null,
          entity.photo_thumbnail_uri || null,
          entity.is_favorite ? 1 : 0,
          entity.reminder_days_before ?? 1,
          entity.notes?.trim() || null,
          entity.is_archived ?? 0,
          new Date().toISOString(),
          entity.id,
        ]
      );
      await notificationService.scheduleBirthdayNotification(entity);
    } catch (error) {
      Logger.error('BirthdayRepository.update failed', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const existing = await this.findById(id);
      if (existing?.photo_uri) {
        await MediaService.deleteMediaFile(existing.photo_uri);
        await this.db.execute('DELETE FROM app_media WHERE entity_id = ?;', [id]);
      }
      await this.db.execute('DELETE FROM birthdays WHERE id = ?;', [id]);
      await notificationService.cancelForReference('birthday', id);
    } catch (error) {
      Logger.error('BirthdayRepository.delete failed', error);
      throw error;
    }
  }

  private mapToUpcoming(entity: BirthdayEntity, referenceDate: Date): UpcomingBirthday {
    let day = entity.birth_day;
    let month = entity.birth_month;
    let year = entity.birth_year ?? null;

    if (!day || !month) {
      const parsed = DateService.parseDateString(entity.birth_date);
      if (parsed) {
        day = parsed.day;
        month = parsed.month;
        year = parsed.year;
      } else {
        const d = new Date(entity.birth_date);
        day = d.getDate();
        month = d.getMonth() + 1;
      }
    }

    const { daysUntil, isLeapDay } = DateService.getNextBirthday(day, month, referenceDate);
    const turningAge = DateService.getTurningAge(year, month, day, referenceDate);
    const currentAge = DateService.getCurrentAge(year, month, day, referenceDate);
    const formattedBirthDate = DateService.formatBirthdayDisplay(day, month, year);
    const shortBirthDate = DateService.formatShortDate(day, month);
    const countdownLabel = DateService.getCountdownLabel(daysUntil);
    const zodiacSign = DateService.getZodiacSign(day, month);

    return {
      ...entity,
      birth_day: day,
      birth_month: month,
      birth_year: year,
      daysUntil,
      turningAge,
      currentAge,
      formattedBirthDate,
      shortBirthDate,
      countdownLabel,
      zodiacSign,
      isLeapDay,
    };
  }
}
