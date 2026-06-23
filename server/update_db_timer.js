import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) {
    console.error(err.message);
  }
});

db.serialize(() => {
  db.run("UPDATE rounds SET timer_type = 'none', duration = 0 WHERE name LIKE '%Cerdas Cermat%'");
});

db.close((err) => {
  if (err) {
    console.error(err.message);
  } else {
    console.log("Database updated: Cerdas Cermat timer_type set to 'none'");
  }
});
