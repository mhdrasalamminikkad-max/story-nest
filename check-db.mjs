import Database from "better-sqlite3";

const db = new Database("./storynest.db");
const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all();
console.log("Database tables:", tables.map(t => t.name).join(", "));
db.close();
