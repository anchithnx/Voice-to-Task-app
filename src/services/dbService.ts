import SQLite, { SQLiteDatabase } from 'react-native-sqlite-storage';
import { Task } from '../models/task';

SQLite.enablePromise(true);

class DBService {
  private db: SQLiteDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    this.db = await SQLite.openDatabase({ name: 'voice_to_task.db', location: 'default' });
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task TEXT NOT NULL,
        date TEXT,
        time TEXT,
        created_at TEXT
      )
    `);
  }

  async insertTask(task: Task): Promise<void> {
    await this.init();
    await this.db!.executeSql(
      'INSERT INTO tasks (task, date, time, created_at) VALUES (?, ?, ?, ?)',
      [task.task, task.date, task.time, task.createdAt],
    );
  }

  async getAllTasks(): Promise<Task[]> {
    await this.init();
    const [result] = await this.db!.executeSql(
      'SELECT * FROM tasks ORDER BY created_at DESC',
    );
    const tasks: Task[] = [];
    for (let i = 0; i < result.rows.length; i++) {
      const row = result.rows.item(i);
      tasks.push({
        id: row.id,
        task: row.task,
        date: row.date,
        time: row.time,
        createdAt: row.created_at,
      });
    }
    return tasks;
  }

  async deleteTask(id: number): Promise<void> {
    await this.init();
    await this.db!.executeSql('DELETE FROM tasks WHERE id = ?', [id]);
  }

  async updateTask(task: Task): Promise<void> {
    await this.init();
    await this.db!.executeSql(
      'UPDATE tasks SET task = ?, date = ?, time = ? WHERE id = ?',
      [task.task, task.date, task.time, task.id],
    );
  }
}

export default new DBService();
