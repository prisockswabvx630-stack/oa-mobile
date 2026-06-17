const mysql = require('mysql2/promise');

async function main() {
  const connection = await mysql.createConnection('mysql://root:root@localhost:3306/oa_system');
  try {
    const [tables] = await connection.query('SHOW TABLES');
    console.log('Tables in database:');
    for (const row of tables) {
      const tableName = Object.values(row)[0];
      const [[countRow]] = await connection.query(`SELECT COUNT(*) as count FROM \`${tableName}\``);
      console.log(`- ${tableName}: ${countRow.count}`);
      if (countRow.count > 0 && tableName !== 'sys_permission' && tableName !== 'sys_role_permission') {
        const [rows] = await connection.query(`SELECT * FROM \`${tableName}\` LIMIT 3`);
        console.log(JSON.stringify(rows, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    await connection.end();
  }
}

main();
