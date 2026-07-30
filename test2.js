const { createClient } = require('@libsql/client');
try { 
  const client = createClient({url: 'file:./dev.db'});
  console.log("Success");
} catch(e) { 
  console.error("Error:", e.message);
}
