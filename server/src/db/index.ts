import sqlite3 from 'sqlite3';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export type DatabaseExecutor = {
  exec: (query: string, params: any[]) => Promise<any[]>;
  close: () => Promise<void>;
};

// --- PostgreSQL Driver ---
const createPostgresExecutor = (connectionString: string): DatabaseExecutor => {
  const pool = new Pool({ connectionString });
  return {
    exec: async (query, params) => {
      const client = await pool.connect();
      try {
        const res = await client.query(query, params);
        return res.rows;
      } finally {
        client.release();
      }
    },
    close: async () => {
      await pool.end();
    },
  };
};

// --- SQLite Driver ---
const createSqliteExecutor = (dbPath: string): Promise<DatabaseExecutor> => {
  return new Promise((resolve, reject) => {
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        return reject(err);
      }
    });

    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');

    db.exec(schema, (err) => {
      if (err) {
        return reject(err);
      }

      const executor: DatabaseExecutor = {
        exec: (query, params) => {
          return new Promise((resolve, reject) => {
            db.all(query, params, (err, rows) => {
              if (err) {
                reject(err);
              } else {
                resolve(rows);
              }
            });
          });
        },
        close: () => {
          return new Promise((resolve, reject) => {
            db.close((err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            });
          });
        },
      };
      resolve(executor);
    });
  });
};

// --- Database Factory ---
export const createDatabase = async (): Promise<DatabaseExecutor> => {
  const dbType = process.env.DATABASE_TYPE || 'sqlite';

  if (dbType === 'postgres' && process.env.DATABASE_URL) {
    console.log('Using PostgreSQL database');
    return createPostgresExecutor(process.env.DATABASE_URL);
  }

  console.log('Using SQLite database');
  const dbPath = process.env.DATABASE_PATH || './pos.db';
  return createSqliteExecutor(dbPath);
};
