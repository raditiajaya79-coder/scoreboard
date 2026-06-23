import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  db.run("DELETE FROM rounds WHERE name = 'Babak 1: Cepat Tepat'");
  db.run("UPDATE rounds SET name = 'Babak 1: Pertanyaan Cerdas Cermat' WHERE name = 'Babak 3: Rebutan'");
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Database updated successfully");
  }
});
