import { BaseRepository } from './baseRepository';
import {
  TaskEntity,
  TaskPriority,
  TaskCategory,
  TaskStatus,
  CrudRepository,
} from './types';
import { DatabaseClient } from '../database';
import { Logger } from '../services/loggerService';
import { TaskService } from '../services/taskService';
import { MediaService } from '../services/mediaService';
import { notificationService } from '../notifications/notificationService';

export type TaskFilter = 'all' | 'today' | 'upcoming' | 'overdue' | 'completed';

export interface TaskQueryOptions {
  filter?: TaskFilter;
  category?: TaskCategory;
  priority?: TaskPriority;
  status?: TaskStatus;
  searchQuery?: string;
  referenceDate?: Date;
}

export interface TaskStats {
  totalToday: number;
  completedToday: number;
  pendingToday: number;
  overdueCount: number;
  upcomingCount: number;
  completionRatio: number;
}

export interface ITaskRepository extends CrudRepository<TaskEntity> {
  findAllWithOptions(options?: TaskQueryOptions): Promise<TaskEntity[]>;
  findPending(): Promise<TaskEntity[]>;
  findTodayTasks(referenceDate?: Date): Promise<TaskEntity[]>;
  getTaskStats(referenceDate?: Date): Promise<TaskStats>;
  completeTask(
    id: string,
    referenceDate?: Date
  ): Promise<{ completedTask: TaskEntity; nextRecurringTask: TaskEntity | null }>;
  cancelTask(id: string): Promise<void>;
  reopenTask(id: string): Promise<void>;
  toggleComplete(id: string, isCompleted: boolean): Promise<void>;
}

export class TaskRepository extends BaseRepository implements ITaskRepository {
  constructor(db: DatabaseClient) {
    super(db);
  }

  public async findById(id: string): Promise<TaskEntity | null> {
    try {
      const result = await this.db.execute<TaskEntity>(
        'SELECT * FROM tasks WHERE id = ? LIMIT 1;',
        [id]
      );
      return result.rows[0] ? this.mapRow(result.rows[0]) : null;
    } catch (error) {
      Logger.error('TaskRepository.findById failed', error);
      return null;
    }
  }

  public async findAll(): Promise<TaskEntity[]> {
    try {
      const result = await this.db.execute<TaskEntity>(
        'SELECT * FROM tasks ORDER BY is_completed ASC, due_date ASC, created_at DESC;'
      );
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      Logger.error('TaskRepository.findAll failed', error);
      return [];
    }
  }

  public async findAllWithOptions(options: TaskQueryOptions = {}): Promise<TaskEntity[]> {
    try {
      const refDate = options.referenceDate || new Date();
      const todayStr = TaskService.toDateString(refDate);
      const nowTimeStr = TaskService.toTimeString(refDate);

      const conditions: string[] = ['1=1'];
      const params: unknown[] = [];

      // Filter handling
      if (options.filter) {
        switch (options.filter) {
          case 'today':
            conditions.push("due_date = ? AND status = 'pending'");
            params.push(todayStr);
            break;
          case 'upcoming':
            conditions.push("due_date > ? AND status = 'pending'");
            params.push(todayStr);
            break;
          case 'overdue':
            conditions.push(
              "(status = 'pending' AND (due_date < ? OR (due_date = ? AND due_time IS NOT NULL AND due_time < ?)))"
            );
            params.push(todayStr, todayStr, nowTimeStr);
            break;
          case 'completed':
            conditions.push("status = 'completed'");
            break;
          case 'all':
          default:
            conditions.push("status = 'pending'");
            break;
        }
      } else if (options.status) {
        conditions.push('status = ?');
        params.push(options.status);
      }

      // Category filter
      if (options.category) {
        conditions.push('category = ?');
        params.push(options.category);
      }

      // Priority filter
      if (options.priority) {
        conditions.push('priority = ?');
        params.push(options.priority);
      }

      // Text search
      if (options.searchQuery && options.searchQuery.trim()) {
        const queryTerm = `%${options.searchQuery.trim().toLowerCase()}%`;
        conditions.push(
          '(LOWER(title) LIKE ? OR LOWER(COALESCE(description, \'\')) LIKE ? OR LOWER(COALESCE(location, \'\')) LIKE ?)'
        );
        params.push(queryTerm, queryTerm, queryTerm);
      }

      const orderBy =
        options.filter === 'completed'
          ? 'ORDER BY completed_at DESC, updated_at DESC'
          : `ORDER BY
              CASE priority
                WHEN 'urgent' THEN 1
                WHEN 'high' THEN 2
                WHEN 'medium' THEN 3
                WHEN 'low' THEN 4
                ELSE 5
              END ASC,
              due_date ASC,
              due_time ASC,
              created_at DESC`;

      const sql = `SELECT * FROM tasks WHERE ${conditions.join(' AND ')} ${orderBy};`;
      const result = await this.db.execute<TaskEntity>(sql, params);
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      Logger.error('TaskRepository.findAllWithOptions failed', error);
      return [];
    }
  }

  public async findPending(): Promise<TaskEntity[]> {
    try {
      const result = await this.db.execute<TaskEntity>(
        "SELECT * FROM tasks WHERE status = 'pending' ORDER BY due_date ASC, due_time ASC;"
      );
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      Logger.error('TaskRepository.findPending failed', error);
      return [];
    }
  }

  public async findTodayTasks(referenceDate: Date = new Date()): Promise<TaskEntity[]> {
    try {
      const todayStr = TaskService.toDateString(referenceDate);
      const result = await this.db.execute<TaskEntity>(
        `SELECT * FROM tasks
         WHERE (due_date = ? OR (due_date < ? AND status = 'pending') OR due_date IS NULL)
         ORDER BY is_completed ASC,
           CASE priority
             WHEN 'urgent' THEN 1
             WHEN 'high' THEN 2
             WHEN 'medium' THEN 3
             WHEN 'low' THEN 4
             ELSE 5
           END ASC,
           due_date ASC,
           due_time ASC;`,
        [todayStr, todayStr]
      );
      return result.rows.map((row) => this.mapRow(row));
    } catch (error) {
      Logger.error('TaskRepository.findTodayTasks failed', error);
      return [];
    }
  }

  public async getTaskStats(referenceDate: Date = new Date()): Promise<TaskStats> {
    try {
      const todayStr = TaskService.toDateString(referenceDate);
      const nowTimeStr = TaskService.toTimeString(referenceDate);

      // Total & Completed today
      const todayTasks = await this.findTodayTasks(referenceDate);
      const totalToday = todayTasks.length;
      const completedToday = todayTasks.filter((t) => t.status === 'completed' || Number(t.is_completed) === 1).length;
      const pendingToday = totalToday - completedToday;
      const completionRatio = totalToday > 0 ? completedToday / totalToday : 0;

      // Overdue count
      const overdueResult = await this.db.execute<{ count: number }>(
        `SELECT COUNT(*) as count FROM tasks
         WHERE status = 'pending'
           AND (due_date < ? OR (due_date = ? AND due_time IS NOT NULL AND due_time < ?));`,
        [todayStr, todayStr, nowTimeStr]
      );
      const overdueCount = overdueResult.rows[0]?.count ?? 0;

      // Upcoming count
      const upcomingResult = await this.db.execute<{ count: number }>(
        `SELECT COUNT(*) as count FROM tasks
         WHERE status = 'pending' AND due_date > ?;`,
        [todayStr]
      );
      const upcomingCount = upcomingResult.rows[0]?.count ?? 0;

      return {
        totalToday,
        completedToday,
        pendingToday,
        overdueCount,
        upcomingCount,
        completionRatio,
      };
    } catch (error) {
      Logger.error('TaskRepository.getTaskStats failed', error);
      return {
        totalToday: 0,
        completedToday: 0,
        pendingToday: 0,
        overdueCount: 0,
        upcomingCount: 0,
        completionRatio: 0,
      };
    }
  }

  public async completeTask(
    id: string,
    referenceDate: Date = new Date()
  ): Promise<{ completedTask: TaskEntity; nextRecurringTask: TaskEntity | null }> {
    const existing = await this.findById(id);
    const now = referenceDate.toISOString();
    let nextRecurringTask: TaskEntity | null = null;

    // Check if task is recurring
    if (
      existing &&
      existing.repeat_interval &&
      existing.repeat_interval !== 'none' &&
      existing.due_date
    ) {
      const nextDueDate = TaskService.getNextRecurringDate(
        existing.due_date,
        existing.repeat_interval
      );

      const nextId = `task_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      nextRecurringTask = {
        id: nextId,
        title: existing.title,
        description: existing.description,
        due_date: nextDueDate,
        due_time: existing.due_time || null,
        priority: existing.priority,
        category: existing.category || 'personal',
        repeat_interval: existing.repeat_interval,
        reminder_minutes: existing.reminder_minutes ?? null,
        location: existing.location || null,
        photo_uri: existing.photo_uri || null,
        status: 'pending',
        is_completed: 0,
        completed_at: null,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      };
    }

    const queries: Array<{ sql: string; params: unknown[] }> = [
      {
        sql: `UPDATE tasks
              SET status = 'completed', is_completed = 1, completed_at = ?, updated_at = ?
              WHERE id = ?;`,
        params: [now, now, id],
      },
    ];

    if (nextRecurringTask) {
      queries.push({
        sql: `INSERT INTO tasks (
                id, title, description, due_date, due_time, priority, category,
                repeat_interval, reminder_minutes, location, photo_uri, status,
                is_completed, completed_at, cancelled_at, created_at, updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        params: [
          nextRecurringTask.id,
          nextRecurringTask.title,
          nextRecurringTask.description,
          nextRecurringTask.due_date,
          nextRecurringTask.due_time,
          nextRecurringTask.priority,
          nextRecurringTask.category,
          nextRecurringTask.repeat_interval,
          nextRecurringTask.reminder_minutes,
          nextRecurringTask.location,
          nextRecurringTask.photo_uri,
          nextRecurringTask.status,
          nextRecurringTask.is_completed,
          nextRecurringTask.completed_at,
          nextRecurringTask.cancelled_at,
          nextRecurringTask.created_at,
          nextRecurringTask.updated_at,
        ],
      });
    }

    await this.db.executeTransaction(queries);

    await notificationService.cancelForReference('task', id);
    if (nextRecurringTask) {
      await notificationService.scheduleTaskNotification(nextRecurringTask, referenceDate);
    }

    const updated = await this.findById(id);
    return {
      completedTask: updated || (existing ? { ...existing, status: 'completed', is_completed: 1, completed_at: now, updated_at: now } : {
        id,
        title: '',
        description: null,
        due_date: null,
        due_time: null,
        priority: 'medium',
        category: 'personal',
        repeat_interval: 'none',
        reminder_minutes: null,
        location: null,
        photo_uri: null,
        status: 'completed',
        is_completed: 1,
        completed_at: now,
        cancelled_at: null,
        created_at: now,
        updated_at: now,
      }),
      nextRecurringTask,
    };
  }

  public async cancelTask(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.db.execute(
        `UPDATE tasks
         SET status = 'cancelled', is_completed = 0, cancelled_at = ?, updated_at = ?
         WHERE id = ?;`,
        [now, now, id]
      );
      await notificationService.cancelForReference('task', id);
    } catch (error) {
      Logger.error('TaskRepository.cancelTask failed', error);
      throw error;
    }
  }

  public async reopenTask(id: string): Promise<void> {
    try {
      const now = new Date().toISOString();
      await this.db.execute(
        `UPDATE tasks
         SET status = 'pending', is_completed = 0, completed_at = NULL, cancelled_at = NULL, updated_at = ?
         WHERE id = ?;`,
        [now, id]
      );
      const reopened = await this.findById(id);
      if (reopened) {
        await notificationService.scheduleTaskNotification(reopened);
      }
    } catch (error) {
      Logger.error('TaskRepository.reopenTask failed', error);
      throw error;
    }
  }

  public async toggleComplete(id: string, isCompleted: boolean): Promise<void> {
    try {
      const now = new Date().toISOString();
      const status: TaskStatus = isCompleted ? 'completed' : 'pending';
      const completedAt = isCompleted ? now : null;
      await this.db.execute(
        `UPDATE tasks SET is_completed = ?, status = ?, completed_at = ?, updated_at = ? WHERE id = ?;`,
        [isCompleted ? 1 : 0, status, completedAt, now, id]
      );
      if (isCompleted) {
        await notificationService.cancelForReference('task', id);
      } else {
        const reopened = await this.findById(id);
        if (reopened) {
          await notificationService.scheduleTaskNotification(reopened);
        }
      }
    } catch (error) {
      Logger.error('TaskRepository.toggleComplete failed', error);
      throw error;
    }
  }

  public async create(entity: TaskEntity): Promise<void> {
    try {
      const now = new Date().toISOString();
      const status: TaskStatus = entity.status || (entity.is_completed === 1 ? 'completed' : 'pending');

      await this.db.execute(
        `INSERT INTO tasks (
          id, title, description, due_date, due_time, priority, category,
          repeat_interval, reminder_minutes, location, photo_uri, photo_thumbnail_uri, status,
          is_completed, completed_at, cancelled_at, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
        [
          entity.id,
          entity.title.trim(),
          entity.description?.trim() || null,
          entity.due_date?.trim() || null,
          entity.due_time?.trim() || null,
          entity.priority || 'medium',
          entity.category || 'personal',
          entity.repeat_interval || 'none',
          entity.reminder_minutes ?? null,
          entity.location?.trim() || null,
          entity.photo_uri || null,
          entity.photo_thumbnail_uri || null,
          status,
          status === 'completed' ? 1 : 0,
          entity.completed_at || (status === 'completed' ? now : null),
          entity.cancelled_at || (status === 'cancelled' ? now : null),
          entity.created_at || now,
          entity.updated_at || now,
        ]
      );
      await notificationService.scheduleTaskNotification(entity);
    } catch (error) {
      Logger.error('TaskRepository.create failed', error);
      throw error;
    }
  }

  public async update(entity: TaskEntity): Promise<void> {
    try {
      const existing = await this.findById(entity.id);
      if (existing?.photo_uri && existing.photo_uri !== entity.photo_uri) {
        await MediaService.deleteMediaFile(existing.photo_uri);
      }

      const now = new Date().toISOString();
      const status: TaskStatus = entity.status || (entity.is_completed === 1 ? 'completed' : 'pending');

      await this.db.execute(
        `UPDATE tasks
         SET title = ?, description = ?, due_date = ?, due_time = ?, priority = ?,
             category = ?, repeat_interval = ?, reminder_minutes = ?, location = ?,
             photo_uri = ?, photo_thumbnail_uri = ?, status = ?, is_completed = ?, completed_at = ?,
             cancelled_at = ?, updated_at = ?
         WHERE id = ?;`,
        [
          entity.title.trim(),
          entity.description?.trim() || null,
          entity.due_date?.trim() || null,
          entity.due_time?.trim() || null,
          entity.priority || 'medium',
          entity.category || 'personal',
          entity.repeat_interval || 'none',
          entity.reminder_minutes ?? null,
          entity.location?.trim() || null,
          entity.photo_uri || null,
          entity.photo_thumbnail_uri || null,
          status,
          status === 'completed' ? 1 : 0,
          entity.completed_at || (status === 'completed' ? now : null),
          entity.cancelled_at || (status === 'cancelled' ? now : null),
          now,
          entity.id,
        ]
      );
      await notificationService.scheduleTaskNotification(entity);
    } catch (error) {
      Logger.error('TaskRepository.update failed', error);
      throw error;
    }
  }

  public async delete(id: string): Promise<void> {
    try {
      const existing = await this.findById(id);
      if (existing?.photo_uri) {
        await MediaService.deleteMediaFile(existing.photo_uri);
      }
      await this.db.execute('DELETE FROM tasks WHERE id = ?;', [id]);
      await notificationService.cancelForReference('task', id);
    } catch (error) {
      Logger.error('TaskRepository.delete failed', error);
      throw error;
    }
  }

  private mapRow(row: any): TaskEntity {
    const isCompleted = Number(row.is_completed) === 1 || row.status === 'completed';
    return {
      id: String(row.id),
      title: String(row.title),
      description: row.description ? String(row.description) : null,
      due_date: row.due_date ? String(row.due_date) : null,
      due_time: row.due_time ? String(row.due_time) : null,
      priority: (row.priority || 'medium') as TaskPriority,
      category: (row.category || 'personal') as TaskCategory,
      repeat_interval: (row.repeat_interval || 'none'),
      reminder_minutes: row.reminder_minutes !== undefined && row.reminder_minutes !== null ? Number(row.reminder_minutes) : null,
      location: row.location ? String(row.location) : null,
      photo_uri: row.photo_uri ? String(row.photo_uri) : null,
      photo_thumbnail_uri: row.photo_thumbnail_uri ? String(row.photo_thumbnail_uri) : null,
      status: (row.status || (isCompleted ? 'completed' : 'pending')) as TaskStatus,
      is_completed: isCompleted ? 1 : 0,
      completed_at: row.completed_at ? String(row.completed_at) : null,
      cancelled_at: row.cancelled_at ? String(row.cancelled_at) : null,
      created_at: String(row.created_at),
      updated_at: String(row.updated_at),
    };
  }
}
