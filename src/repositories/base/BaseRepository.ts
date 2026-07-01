import { pool, sql } from '../../config/database';

export abstract class BaseRepository {
  protected async executeQuery<T>(query: string, params: Record<string, any> = {}): Promise<T[]> {
    try {
      const request = pool.request();

      // Add parameters safely to prevent SQL injection
      Object.entries(params).forEach(([key, value]) => {
        // Determine SQL data type based on value type
        let sqlType;
        if (typeof value === 'string') {
          // Check if string is a UUID format (36 characters with dashes)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(value)) {
            sqlType = sql.UniqueIdentifier;
          } else {
            sqlType = sql.NVarChar;
          }
        } else if (typeof value === 'number') {
          sqlType = sql.Int;
        } else if (typeof value === 'boolean') {
          sqlType = sql.Bit;
        } else if (value instanceof Date) {
          sqlType = sql.DateTime2;
        } else {
          sqlType = sql.NVarChar; // Default to string
        }

        request.input(key, sqlType, value);
      });

      const result = await request.query(query);
      return result.recordset as T[];
    } catch (error) {
      console.error('Database query error:', error);
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  protected async executeScalar<T>(query: string, params: Record<string, any> = {}): Promise<T> {
    const result = await this.executeQuery<T>(query, params);
    if (result.length === 0) {
      throw new Error('No records found');
    }
    return result[0];
  }

  protected async executeNonQuery(query: string, params: Record<string, any> = {}): Promise<number> {
    try {
      const request = pool.request();

      // Add parameters safely
      Object.entries(params).forEach(([key, value]) => {
        let sqlType;
        if (typeof value === 'string') {
          // Check if string is a UUID format (36 characters with dashes)
          const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
          if (uuidRegex.test(value)) {
            sqlType = sql.UniqueIdentifier;
          } else {
            sqlType = sql.NVarChar;
          }
        } else if (typeof value === 'number') {
          sqlType = sql.Int;
        } else if (typeof value === 'boolean') {
          sqlType = sql.Bit;
        } else if (value instanceof Date) {
          sqlType = sql.DateTime2;
        } else {
          sqlType = sql.NVarChar;
        }

        request.input(key, sqlType, value);
      });

      const result = await request.query(query);
      return result.rowsAffected?.[0] || 0;
    } catch (error) {
      console.error('Database non-query error:', error);
      throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
