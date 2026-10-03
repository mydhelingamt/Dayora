import { TaskRepository } from '../src/repositories/taskRepository';
import { TaskEntity } from '../src/repositories/types';
import { DatabaseClient } from '../src/database/types';

describe('TaskRepository Integration Tests', () => {
  let inMemoryDb: Map<string, TaskEntity>;
  let mockDb: DatabaseClient;
  let repo: TaskRepository;
  const refDate = new Date(2026, 8, 10, 12, 0, 0); // 2026-09-10 at 12:00 PM

  beforeEach(() => {
    inMemoryDb = new Map<string, TaskEntity>();

    mockDb = {
      initialize: jest.fn(async () => {}),
      isInitialized: jest.fn(() => true),
      close: jest.fn(async () => {}),
      execute: jest.fn(async (sql: string, params: unknown[] = []) => {
        // SELECT * FROM tasks WHERE id = ? LIMIT 1
        if (sql.includes('SELECT * FROM tasks WHERE id = ?')) {
          const id = params[0] as string;
          const entity = inMemoryDb.get(id);
          return { rowsAffected: entity ? 1 : 0, rows: entity ? [entity] : [] };
        }

        // INSERT INTO tasks
        if (sql.includes('INSERT INTO tasks')) {
          const entity: TaskEntity = {
            id: params[0] as string,
            title: params[1] as string,
            description: (params[2] as string) || null,
            due_date: (params[3] as string) || null,
            due_time: (params[4] as string) || null,
            priority: (params[5] as any) || 'medium',
            category: (params[6] as any) || 'personal',
            repeat_interval: (params[7] as any) || 'none',
            reminder_minutes: params[8] !== null && params[8] !== undefined ? Number(params[8]) : null,
            location: (params[9] as string) || null,
            photo_uri: (params[10] as string) || null,
            status: (params[11] as any) || 'pending',
            is_completed: Number(params[12]) || 0,
            completed_at: (params[13] as string) || null,
            cancelled_at: (params[14] as string) || null,
            created_at: (params[15] as string) || new Date().toISOString(),
            updated_at: (params[16] as string) || new Date().toISOString(),
          };
          inMemoryDb.set(entity.id, entity);
          return { rowsAffected: 1, rows: [] };
        }

        // UPDATE tasks
        if (sql.includes('UPDATE tasks')) {
          if (sql.includes("status = 'completed'")) {
            // completeTask
            const completedAt = params[0] as string;
            const updatedAt = params[1] as string;
            const id = params[2] as string;
            const existing = inMemoryDb.get(id);
            if (existing) {
              inMemoryDb.set(id, {
                ...existing,
                status: 'completed',
                is_completed: 1,
                completed_at: completedAt,
                updated_at: updatedAt,
              });
            }
          } else if (sql.includes("status = 'cancelled'")) {
            // cancelTask
            const cancelledAt = params[0] as string;
            const updatedAt = params[1] as string;
            const id = params[2] as string;
            const existing = inMemoryDb.get(id);
            if (existing) {
              inMemoryDb.set(id, {
                ...existing,
                status: 'cancelled',
                is_completed: 0,
                cancelled_at: cancelledAt,
                updated_at: updatedAt,
              });
            }
          } else if (sql.includes("status = 'pending'")) {
            // reopenTask
            const updatedAt = params[0] as string;
            const id = params[1] as string;
            const existing = inMemoryDb.get(id);
            if (existing) {
              inMemoryDb.set(id, {
                ...existing,
                status: 'pending',
                is_completed: 0,
                completed_at: null,
                cancelled_at: null,
                updated_at: updatedAt,
              });
            }
          } else {
            // General update
            const id = params[15] as string;
            const existing = inMemoryDb.get(id);
            if (existing) {
              inMemoryDb.set(id, {
                ...existing,
                title: params[0] as string,
                description: (params[1] as string) || null,
                due_date: (params[2] as string) || null,
                due_time: (params[3] as string) || null,
                priority: params[4] as any,
                category: params[5] as any,
                repeat_interval: params[6] as any,
                reminder_minutes: params[7] !== null ? Number(params[7]) : null,
                location: (params[8] as string) || null,
                photo_uri: (params[9] as string) || null,
                status: params[10] as any,
                is_completed: Number(params[11]),
                completed_at: (params[12] as string) || null,
                cancelled_at: (params[13] as string) || null,
                updated_at: params[14] as string,
              });
            }
          }
          return { rowsAffected: 1, rows: [] };
        }

        // DELETE FROM tasks WHERE id = ?
        if (sql.includes('DELETE FROM tasks WHERE id = ?')) {
          const id = params[0] as string;
          inMemoryDb.delete(id);
          return { rowsAffected: 1, rows: [] };
        }

        // Stats count queries
        if (sql.includes('SELECT COUNT(*) as count FROM tasks')) {
          const all = Array.from(inMemoryDb.values());
          if (sql.includes('due_date < ?')) {
            // Overdue
            const count = all.filter((t) => t.status === 'pending' && t.due_date && t.due_date < '2026-09-10').length;
            return { rowsAffected: 1, rows: [{ count }] };
          }
          if (sql.includes('due_date > ?')) {
            // Upcoming
            const count = all.filter((t) => t.status === 'pending' && t.due_date && t.due_date > '2026-09-10').length;
            return { rowsAffected: 1, rows: [{ count }] };
          }
        }

        // SELECT * FROM tasks (filtered / all)
        let results = Array.from(inMemoryDb.values());
        if (sql.includes("due_date = ? AND status = 'pending'")) {
          const dateParam = params[0] as string;
          results = results.filter((t) => t.due_date === dateParam && t.status === 'pending');
        } else if (sql.includes("due_date > ? AND status = 'pending'")) {
          const dateParam = params[0] as string;
          results = results.filter((t) => t.due_date && t.due_date > dateParam && t.status === 'pending');
        } else if (sql.includes("status = 'completed'")) {
          results = results.filter((t) => t.status === 'completed');
        } else if (sql.includes("status = 'pending'")) {
          results = results.filter((t) => t.status === 'pending');
        }

        return { rowsAffected: results.length, rows: results };
      }) as unknown as DatabaseClient['execute'],
      executeTransaction: jest.fn(async (queries) => {
        for (const q of queries) {
          await mockDb.execute(q.sql, q.params);
        }
      }),
    };

    repo = new TaskRepository(mockDb);
  });

  it('creates and finds a task with complete fields', async () => {
    const task: TaskEntity = {
      id: 'task_1',
      title: 'Order birthday cake',
      description: 'Artisanal chocolate cake with lettering',
      due_date: '2026-09-10',
      due_time: '14:30',
      priority: 'high',
      category: 'celebration',
      repeat_interval: 'none',
      reminder_minutes: 30,
      location: 'Downtown Bakery',
      photo_uri: 'file:///data/cake.jpg',
      status: 'pending',
      is_completed: 0,
      created_at: '2026-09-10T10:00:00Z',
      updated_at: '2026-09-10T10:00:00Z',
    };

    await repo.create(task);
    const found = await repo.findById('task_1');

    expect(found).not.toBeNull();
    expect(found?.title).toBe('Order birthday cake');
    expect(found?.category).toBe('celebration');
    expect(found?.priority).toBe('high');
    expect(found?.due_time).toBe('14:30');
    expect(found?.reminder_minutes).toBe(30);
    expect(found?.location).toBe('Downtown Bakery');
    expect(found?.photo_uri).toBe('file:///data/cake.jpg');
    expect(found?.status).toBe('pending');
  });

  it('completes a non-recurring task without generating duplicate instances', async () => {
    const task: TaskEntity = {
      id: 'task_single',
      title: 'Single Task',
      description: null,
      due_date: '2026-09-10',
      priority: 'medium',
      category: 'work',
      repeat_interval: 'none',
      status: 'pending',
      is_completed: 0,
      created_at: '2026-09-10T10:00:00Z',
      updated_at: '2026-09-10T10:00:00Z',
    };

    await repo.create(task);
    const { completedTask, nextRecurringTask } = await repo.completeTask('task_single', refDate);

    expect(completedTask.status).toBe('completed');
    expect(completedTask.is_completed).toBe(1);
    expect(completedTask.completed_at).toBeTruthy();
    expect(nextRecurringTask).toBeNull();
    expect(inMemoryDb.size).toBe(1);
  });

  it('completes a recurring task and atomically generates the next scheduled instance', async () => {
    const recurringTask: TaskEntity = {
      id: 'task_repeat',
      title: 'Weekly Standup Planning',
      description: 'Prepare milestone roadmap',
      due_date: '2026-09-10',
      due_time: '10:00',
      priority: 'high',
      category: 'work',
      repeat_interval: 'weekly',
      reminder_minutes: 15,
      location: 'Conference Room B',
      photo_uri: null,
      status: 'pending',
      is_completed: 0,
      created_at: '2026-09-10T08:00:00Z',
      updated_at: '2026-09-10T08:00:00Z',
    };

    await repo.create(recurringTask);
    const { completedTask, nextRecurringTask } = await repo.completeTask('task_repeat', refDate);

    // Current task marked completed
    expect(completedTask.status).toBe('completed');
    expect(completedTask.is_completed).toBe(1);

    // Next occurrence spawned 7 days later
    expect(nextRecurringTask).not.toBeNull();
    expect(nextRecurringTask?.id).not.toBe('task_repeat');
    expect(nextRecurringTask?.due_date).toBe('2026-09-17'); // +7 days
    expect(nextRecurringTask?.due_time).toBe('10:00');
    expect(nextRecurringTask?.priority).toBe('high');
    expect(nextRecurringTask?.category).toBe('work');
    expect(nextRecurringTask?.repeat_interval).toBe('weekly');
    expect(nextRecurringTask?.status).toBe('pending');
    expect(nextRecurringTask?.is_completed).toBe(0);

    // Both records exist in SQLite (completed archive + new pending instance)
    expect(inMemoryDb.size).toBe(2);
  });

  it('cancels and reopens task lifecycle states', async () => {
    const task: TaskEntity = {
      id: 'task_cancel_test',
      title: 'Doctor Appointment',
      description: null,
      due_date: '2026-09-10',
      priority: 'urgent',
      category: 'health',
      repeat_interval: 'none',
      status: 'pending',
      is_completed: 0,
      created_at: '2026-09-10T08:00:00Z',
      updated_at: '2026-09-10T08:00:00Z',
    };

    await repo.create(task);

    // Cancel task
    await repo.cancelTask('task_cancel_test');
    let item = await repo.findById('task_cancel_test');
    expect(item?.status).toBe('cancelled');
    expect(item?.cancelled_at).toBeTruthy();

    // Reopen task
    await repo.reopenTask('task_cancel_test');
    item = await repo.findById('task_cancel_test');
    expect(item?.status).toBe('pending');
    expect(item?.is_completed).toBe(0);
    expect(item?.cancelled_at).toBeNull();
  });

  it('deletes task from SQLite', async () => {
    const task: TaskEntity = {
      id: 'task_del',
      title: 'To Be Deleted',
      description: null,
      due_date: '2026-09-10',
      priority: 'low',
      category: 'other',
      repeat_interval: 'none',
      status: 'pending',
      is_completed: 0,
      created_at: '2026-09-10T08:00:00Z',
      updated_at: '2026-09-10T08:00:00Z',
    };

    await repo.create(task);
    expect(inMemoryDb.has('task_del')).toBe(true);

    await repo.delete('task_del');
    expect(inMemoryDb.has('task_del')).toBe(false);
    const found = await repo.findById('task_del');
    expect(found).toBeNull();
  });
});
