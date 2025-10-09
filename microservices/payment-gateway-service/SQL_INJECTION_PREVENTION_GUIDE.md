# 🛡️ SQL Injection Prevention Guide

**NileCare Payment Gateway - Database Security Best Practices**

---

## ⚠️ **Critical: Your Query Validation Issues**

### **Problem with Your Current Code:**

```typescript
// ❌ YOUR CODE: Overly restrictive validation
private validateQuery(query: string): void {
  const dangerousPatterns = [
    /(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b)(?![^\[]*\])/i,  // ❌ Blocks legitimate operations!
    /;.*(\bDROP\b|\bDELETE\b|\bUPDATE\b|\bINSERT\b)/i,
    /UNION.*SELECT/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      throw new Error('Potentially dangerous query detected');  // ❌ Your bulkInsert() would fail!
    }
  }
}
```

**Issues:**
1. ❌ Blocks your own `bulkInsert()` method (uses INSERT)
2. ❌ Blocks legitimate UPDATE/DELETE operations
3. ❌ Blacklist approach is unreliable (SQL injection can bypass regex)
4. ❌ False positives will break your application

---

## ✅ **The Right Approach: Parameterized Queries**

### **Why Parameterized Queries Are Better:**

```typescript
// ❌ VULNERABLE: String concatenation
const sql = `SELECT * FROM users WHERE email = '${email}'`;
// Attacker input: email = "' OR '1'='1"
// Result: SELECT * FROM users WHERE email = '' OR '1'='1'  (returns all users!)

// ✅ SECURE: Parameterized query
const sql = `SELECT * FROM users WHERE email = ?`;
const params = [email];
// Attacker input: email = "' OR '1'='1"
// Result: Treated as literal string, no injection possible
```

---

## 🎯 **Defense Strategy**

### **1. Primary Defense: Parameterized Queries** ✅

Always use `?` placeholders with separate parameter arrays:

```typescript
// ✅ GOOD: Parameterized query
async findUser(email: string) {
  const sql = 'SELECT * FROM users WHERE email = ?';
  return await connection.execute(sql, [email]);
}

// ❌ BAD: String concatenation
async findUser(email: string) {
  const sql = `SELECT * FROM users WHERE email = '${email}'`;  // VULNERABLE!
  return await connection.execute(sql);
}
```

### **2. Secondary Defense: Input Validation** ✅

Validate input data types and formats:

```typescript
// ✅ GOOD: Validate before querying
async findUserById(userId: string) {
  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)) {
    throw new Error('Invalid user ID format');
  }
  
  const sql = 'SELECT * FROM users WHERE id = ?';
  return await connection.execute(sql, [userId]);
}
```

### **3. Tertiary Defense: Whitelist Table/Column Names** ✅

When table/column names come from user input:

```typescript
// ✅ GOOD: Whitelist approach
private validateTableName(tableName: string): void {
  const allowedTables = ['users', 'payments', 'transactions'];
  
  if (!allowedTables.includes(tableName)) {
    throw new Error('Invalid table name');
  }
}

// ❌ BAD: Blacklist approach (your current code)
private validateQuery(query: string): void {
  const dangerousPatterns = [/DROP/i, /DELETE/i];  // Can be bypassed!
  // ...
}
```

---

## 📊 **Comparison: Blacklist vs Whitelist**

| Approach | Security | Maintainability | False Positives |
|----------|----------|-----------------|-----------------|
| **❌ Blacklist (Your Code)** | 🔴 Weak | 🔴 High complexity | 🔴 Many |
| **✅ Whitelist (Recommended)** | 🟢 Strong | 🟢 Simple | 🟢 None |
| **✅ Parameterized Queries** | 🟢 Strongest | 🟢 Very simple | 🟢 None |

---

## 🔒 **Secure Query Patterns**

### **Pattern 1: Simple Select**

```typescript
// ✅ SECURE
async getUserByEmail(email: string): Promise<User | null> {
  const sql = `
    SELECT id, email, username, role 
    FROM users 
    WHERE email = ? AND deleted_at IS NULL
  `;
  
  const [rows] = await connection.execute(sql, [email]);
  return rows[0] || null;
}
```

### **Pattern 2: Dynamic Filters**

```typescript
// ✅ SECURE: Build WHERE clause with parameters
async searchUsers(filters: UserFilters): Promise<User[]> {
  const params: any[] = [];
  const conditions: string[] = ['deleted_at IS NULL'];
  
  if (filters.email) {
    conditions.push('email = ?');
    params.push(filters.email);
  }
  
  if (filters.role) {
    conditions.push('role = ?');
    params.push(filters.role);
  }
  
  const sql = `
    SELECT * FROM users 
    WHERE ${conditions.join(' AND ')}
  `;
  
  const [rows] = await connection.execute(sql, params);
  return rows;
}
```

### **Pattern 3: Bulk Insert**

```typescript
// ✅ SECURE: Parameterized bulk insert
async bulkInsert(tableName: string, data: any[]): Promise<void> {
  // Validate table name (whitelist)
  this.validateTableName(tableName);
  
  const columns = Object.keys(data[0]);
  const placeholders = data.map(() => 
    `(${columns.map(() => '?').join(', ')})`
  ).join(', ');
  
  const values = data.flatMap(row => Object.values(row));
  
  // Use backticks for identifier quoting
  const sql = `
    INSERT INTO \`${tableName}\` 
    (${columns.map(c => `\`${c}\``).join(', ')})
    VALUES ${placeholders}
  `;
  
  await connection.execute(sql, values);
}
```

### **Pattern 4: Transactions**

```typescript
// ✅ SECURE: Transactional operations
async transferFunds(fromId: string, toId: string, amount: number): Promise<void> {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Debit from account
    await connection.execute(
      'UPDATE accounts SET balance = balance - ? WHERE id = ?',
      [amount, fromId]
    );
    
    // Credit to account
    await connection.execute(
      'UPDATE accounts SET balance = balance + ? WHERE id = ?',
      [amount, toId]
    );
    
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
```

---

## ❌ **Common Mistakes to Avoid**

### **Mistake 1: String Concatenation**

```typescript
// ❌ VULNERABLE
const sql = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ SECURE
const sql = 'SELECT * FROM users WHERE email = ?';
const params = [email];
```

### **Mistake 2: Template Literals with User Input**

```typescript
// ❌ VULNERABLE
const sql = `SELECT * FROM ${tableName} WHERE id = ${userId}`;

// ✅ SECURE
this.validateTableName(tableName);  // Whitelist check
const sql = `SELECT * FROM \`${tableName}\` WHERE id = ?`;
const params = [userId];
```

### **Mistake 3: Insufficient Validation**

```typescript
// ❌ WEAK: Blacklist approach
if (input.includes('DROP') || input.includes('DELETE')) {
  throw new Error('Invalid input');
}

// ✅ STRONG: Whitelist + parameterized
const allowedValues = ['active', 'inactive', 'pending'];
if (!allowedValues.includes(input)) {
  throw new Error('Invalid status');
}
const sql = 'UPDATE users SET status = ? WHERE id = ?';
```

### **Mistake 4: Logging Sensitive Data**

```typescript
// ❌ INSECURE: Logs actual values
this.logger.debug('Query executed', { sql, params });

// ✅ SECURE: Redacts sensitive data
this.logger.debug('Query executed', { 
  sql: this.sanitizeQueryForLogging(sql),
  paramCount: params.length  // Count only, not values
});
```

---

## 🧪 **Testing for SQL Injection**

### **Test Cases to Verify:**

```typescript
// Test 1: Basic injection attempt
const maliciousEmail = "' OR '1'='1";
const user = await findUserByEmail(maliciousEmail);
// Should return null, not all users

// Test 2: Comment injection
const maliciousEmail = "admin@example.com'--";
const user = await findUserByEmail(maliciousEmail);
// Should return null, not bypass authentication

// Test 3: Union injection
const maliciousEmail = "' UNION SELECT * FROM passwords--";
const user = await findUserByEmail(maliciousEmail);
// Should return null, not expose other tables

// Test 4: Time-based blind injection
const maliciousEmail = "' OR SLEEP(5)--";
const startTime = Date.now();
const user = await findUserByEmail(maliciousEmail);
const duration = Date.now() - startTime;
// Should complete quickly, not sleep
```

---

## ✅ **Security Checklist**

Before deploying database code:

- [x] All queries use parameterized statements (`?` placeholders)
- [x] No string concatenation with user input
- [x] Table names validated with whitelist
- [x] Column names validated (alphanumeric + underscore only)
- [x] Input validation before queries
- [x] Sensitive data redacted from logs
- [x] Transaction support with rollback
- [x] Connection pooling configured
- [x] Query timeouts set
- [x] Error messages don't expose SQL structure

---

## 📚 **Additional Resources**

- [OWASP SQL Injection Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html)
- [MySQL2 Prepared Statements](https://github.com/sidorares/node-mysql2#using-prepared-statements)
- [TypeORM Query Builder](https://typeorm.io/select-query-builder) (if you switch to TypeORM)

---

## 🎯 **Summary**

### **Your Current Code Issues:**

1. ❌ Blocks legitimate INSERT/UPDATE/DELETE (including your own `bulkInsert()`)
2. ❌ Blacklist approach can be bypassed
3. ❌ False positives will break functionality
4. ❌ Framework mismatch (NestJS decorators in Express.js project)

### **Recommended Approach:**

1. ✅ Use parameterized queries (already done - keep this!)
2. ✅ Whitelist table/column names instead of blacklisting keywords
3. ✅ Validate input data types and formats
4. ✅ Use the secure `DatabaseQueryService` I provided
5. ✅ Remove the overly restrictive `validateQuery()` method

---

**Remember:** Parameterized queries are your primary defense against SQL injection. Blacklist validation is a weak secondary defense that causes more problems than it solves.

