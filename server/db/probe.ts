import pg from 'pg';

const { Client } = pg;
const passwordsToTry = ['', 'postgres', 'admin', 'root', 'password', '123456', '1234', 'postgres123', 'root123', 'system', 'belea'];

async function probe() {
  for (const pw of passwordsToTry) {
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: pw,
      database: 'postgres',
    });
    try {
      await client.connect();
      console.log(`SUCCESS! Password is: "${pw}"`);
      await client.end();
      return pw;
    } catch (err: any) {
      console.log(`Failed with password: "${pw}" (${err.message})`);
    }
  }
  console.log('None of the standard passwords matched.');
}

probe();
