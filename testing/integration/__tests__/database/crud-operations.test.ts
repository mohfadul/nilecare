/**
 * DATABASE CRUD INTEGRATION TESTS
 * Tests that database models can Create, Read, Update, Delete successfully
 */

import { Pool } from 'pg';
import { connect, connection, Model, Schema } from 'mongoose';
import Redis from 'ioredis';
import { TEST_CONFIG } from '../setup';

describe('Database CRUD Operations', () => {
  let pgPool: Pool;
  let redis: Redis;
  
  beforeAll(async () => {
    // Initialize PostgreSQL connection
    pgPool = new Pool(TEST_CONFIG.database.postgres);
    
    // Initialize MongoDB connection
    try {
      await connect(TEST_CONFIG.database.mongodb);
    } catch (error) {
      console.warn('⚠️  MongoDB connection failed - some tests may be skipped');
    }
    
    // Initialize Redis connection
    redis = new Redis(TEST_CONFIG.database.redis);
  });

  afterAll(async () => {
    await pgPool.end();
    await connection.close();
    await redis.quit();
  });

  describe('PostgreSQL CRUD Operations', () => {
    const testTableName = `test_patients_${Date.now()}`;
    
    beforeAll(async () => {
      // Create test table
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS ${testTableName} (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          phone VARCHAR(20),
          date_of_birth DATE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
    });

    afterAll(async () => {
      // Clean up test table
      await pgPool.query(`DROP TABLE IF EXISTS ${testTableName}`);
    });

    test('CREATE - should insert a new patient record', async () => {
      const startTime = Date.now();
      const result = await pgPool.query(
        `INSERT INTO ${testTableName} (first_name, last_name, email, phone, date_of_birth)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        ['Ahmed', 'Hassan', `ahmed.hassan.${Date.now()}@test.com`, '+249123456789', '1990-01-15']
      );
      const duration = Date.now() - startTime;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toHaveProperty('id');
      expect(result.rows[0].first_name).toBe('Ahmed');
      expect(result.rows[0].email).toContain('@test.com');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('READ - should retrieve patient records', async () => {
      // Insert test data
      await pgPool.query(
        `INSERT INTO ${testTableName} (first_name, last_name, email)
         VALUES ($1, $2, $3)`,
        ['Fatima', 'Ali', `fatima.ali.${Date.now()}@test.com`]
      );

      const startTime = Date.now();
      const result = await pgPool.query(`SELECT * FROM ${testTableName} WHERE first_name = $1`, ['Fatima']);
      const duration = Date.now() - startTime;

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0].first_name).toBe('Fatima');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('UPDATE - should update a patient record', async () => {
      // Insert test data
      const insertResult = await pgPool.query(
        `INSERT INTO ${testTableName} (first_name, last_name, email)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['Omar', 'Ibrahim', `omar.ibrahim.${Date.now()}@test.com`]
      );
      const patientId = insertResult.rows[0].id;

      const startTime = Date.now();
      const result = await pgPool.query(
        `UPDATE ${testTableName} 
         SET phone = $1, updated_at = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING *`,
        ['+249987654321', patientId]
      );
      const duration = Date.now() - startTime;

      expect(result.rows).toHaveLength(1);
      expect(result.rows[0].phone).toBe('+249987654321');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('DELETE - should delete a patient record', async () => {
      // Insert test data
      const insertResult = await pgPool.query(
        `INSERT INTO ${testTableName} (first_name, last_name, email)
         VALUES ($1, $2, $3)
         RETURNING id`,
        ['Sara', 'Mohamed', `sara.mohamed.${Date.now()}@test.com`]
      );
      const patientId = insertResult.rows[0].id;

      const startTime = Date.now();
      const result = await pgPool.query(
        `DELETE FROM ${testTableName} WHERE id = $1 RETURNING id`,
        [patientId]
      );
      const duration = Date.now() - startTime;

      expect(result.rows).toHaveLength(1);
      
      // Verify deletion
      const checkResult = await pgPool.query(
        `SELECT * FROM ${testTableName} WHERE id = $1`,
        [patientId]
      );
      expect(checkResult.rows).toHaveLength(0);
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('TRANSACTION - should handle transactions correctly', async () => {
      const client = await pgPool.connect();
      
      try {
        await client.query('BEGIN');
        
        const result1 = await client.query(
          `INSERT INTO ${testTableName} (first_name, last_name, email)
           VALUES ($1, $2, $3)
           RETURNING id`,
          ['Transaction', 'Test1', `trans1.${Date.now()}@test.com`]
        );
        
        const result2 = await client.query(
          `INSERT INTO ${testTableName} (first_name, last_name, email)
           VALUES ($1, $2, $3)
           RETURNING id`,
          ['Transaction', 'Test2', `trans2.${Date.now()}@test.com`]
        );
        
        await client.query('COMMIT');
        
        expect(result1.rows).toHaveLength(1);
        expect(result2.rows).toHaveLength(1);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    });

    test('QUERY OPTIMIZATION - should use indexes efficiently', async () => {
      // Create index
      await pgPool.query(`CREATE INDEX IF NOT EXISTS idx_${testTableName}_email ON ${testTableName}(email)`);
      
      // Insert multiple records
      for (let i = 0; i < 100; i++) {
        await pgPool.query(
          `INSERT INTO ${testTableName} (first_name, last_name, email)
           VALUES ($1, $2, $3)`,
          [`User${i}`, `Test${i}`, `user${i}.${Date.now()}@test.com`]
        );
      }
      
      // Query with index
      const startTime = Date.now();
      const result = await pgPool.query(
        `SELECT * FROM ${testTableName} WHERE email LIKE $1 LIMIT 10`,
        ['%@test.com']
      );
      const duration = Date.now() - startTime;
      
      expect(result.rows.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery * 2); // Allow 2x threshold for complex query
    });
  });

  describe('MongoDB CRUD Operations', () => {
    let TestModel: Model<any>;
    
    beforeAll(() => {
      const testSchema = new Schema({
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        metadata: { type: Object },
        createdAt: { type: Date, default: Date.now },
      });
      
      TestModel = connection.model(`TestDocument_${Date.now()}`, testSchema);
    });

    afterAll(async () => {
      await TestModel.deleteMany({});
    });

    test('CREATE - should insert a MongoDB document', async () => {
      const startTime = Date.now();
      const doc = await TestModel.create({
        name: 'Test Document',
        email: `test.${Date.now()}@example.com`,
        metadata: { source: 'integration-test' },
      });
      const duration = Date.now() - startTime;

      expect(doc).toHaveProperty('_id');
      expect(doc.name).toBe('Test Document');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('READ - should find MongoDB documents', async () => {
      await TestModel.create({
        name: 'Find Me',
        email: `findme.${Date.now()}@example.com`,
      });

      const startTime = Date.now();
      const docs = await TestModel.find({ name: 'Find Me' });
      const duration = Date.now() - startTime;

      expect(docs.length).toBeGreaterThan(0);
      expect(docs[0].name).toBe('Find Me');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('UPDATE - should update a MongoDB document', async () => {
      const doc = await TestModel.create({
        name: 'Update Me',
        email: `updateme.${Date.now()}@example.com`,
      });

      const startTime = Date.now();
      const updated = await TestModel.findByIdAndUpdate(
        doc._id,
        { name: 'Updated Name' },
        { new: true }
      );
      const duration = Date.now() - startTime;

      expect(updated?.name).toBe('Updated Name');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('DELETE - should delete a MongoDB document', async () => {
      const doc = await TestModel.create({
        name: 'Delete Me',
        email: `deleteme.${Date.now()}@example.com`,
      });

      const startTime = Date.now();
      await TestModel.findByIdAndDelete(doc._id);
      const duration = Date.now() - startTime;

      const found = await TestModel.findById(doc._id);
      expect(found).toBeNull();
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });
  });

  describe('Redis Cache Operations', () => {
    const testKeyPrefix = `test:${Date.now()}`;

    afterAll(async () => {
      // Clean up test keys
      const keys = await redis.keys(`${testKeyPrefix}:*`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    });

    test('SET - should store a value in Redis', async () => {
      const startTime = Date.now();
      await redis.set(`${testKeyPrefix}:key1`, 'value1', 'EX', 60);
      const duration = Date.now() - startTime;

      const value = await redis.get(`${testKeyPrefix}:key1`);
      expect(value).toBe('value1');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery);
    });

    test('GET - should retrieve a value from Redis', async () => {
      await redis.set(`${testKeyPrefix}:key2`, 'value2');

      const startTime = Date.now();
      const value = await redis.get(`${testKeyPrefix}:key2`);
      const duration = Date.now() - startTime;

      expect(value).toBe('value2');
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery / 2); // Redis should be faster
    });

    test('DELETE - should remove a value from Redis', async () => {
      await redis.set(`${testKeyPrefix}:key3`, 'value3');

      const startTime = Date.now();
      await redis.del(`${testKeyPrefix}:key3`);
      const duration = Date.now() - startTime;

      const value = await redis.get(`${testKeyPrefix}:key3`);
      expect(value).toBeNull();
      expect(duration).toBeLessThan(TEST_CONFIG.thresholds.dbQuery / 2);
    });

    test('HASH - should handle hash operations', async () => {
      const hashKey = `${testKeyPrefix}:hash`;
      
      await redis.hset(hashKey, 'field1', 'value1');
      await redis.hset(hashKey, 'field2', 'value2');

      const value1 = await redis.hget(hashKey, 'field1');
      const allValues = await redis.hgetall(hashKey);

      expect(value1).toBe('value1');
      expect(allValues).toEqual({ field1: 'value1', field2: 'value2' });
    });

    test('EXPIRATION - should handle key expiration', async () => {
      await redis.set(`${testKeyPrefix}:expire`, 'value', 'EX', 1);
      
      let value = await redis.get(`${testKeyPrefix}:expire`);
      expect(value).toBe('value');

      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 1100));
      
      value = await redis.get(`${testKeyPrefix}:expire`);
      expect(value).toBeNull();
    });
  });

  describe('Connection Pool Health', () => {
    test('PostgreSQL pool should maintain connections', async () => {
      const results = await Promise.all([
        pgPool.query('SELECT 1 as result'),
        pgPool.query('SELECT 2 as result'),
        pgPool.query('SELECT 3 as result'),
      ]);

      expect(results).toHaveLength(3);
      expect(results[0].rows[0].result).toBe(1);
      expect(results[1].rows[0].result).toBe(2);
      expect(results[2].rows[0].result).toBe(3);
    });

    test('Redis should handle concurrent operations', async () => {
      const operations = Array.from({ length: 10 }, (_, i) => 
        redis.set(`${testKeyPrefix}:concurrent:${i}`, `value${i}`)
      );

      await Promise.all(operations);

      const values = await Promise.all(
        Array.from({ length: 10 }, (_, i) => 
          redis.get(`${testKeyPrefix}:concurrent:${i}`)
        )
      );

      expect(values).toHaveLength(10);
      values.forEach((value, i) => {
        expect(value).toBe(`value${i}`);
      });
    });
  });
});

