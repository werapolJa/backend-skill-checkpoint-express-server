// Create PostgreSQL Connection Pool here !
import * as pg from "pg";
const { Pool } = pg.default;

const connectionPool = new Pool({
  connectionString:
  "postgresql://postgres:034424274@localhost:5432/questions",
});

export default connectionPool;
