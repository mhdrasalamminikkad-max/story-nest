import Database from 'better-sqlite3';

const db = new Database('storynest.db');

try {
  console.log('Looking for your user account...');
  
  // Get all parent settings to find matching email
  const allSettings = db.prepare('SELECT user_id FROM parent_settings LIMIT 5').all();
  console.log('Sample user IDs:', allSettings);
  
  // For now, let's just set the first user as admin (or update based on user ID)
  // If you know your user ID, we can update it directly
  console.log('\nPlease provide your user ID from the console/browser');
  console.log('Your email: mhdrasalamminikkad8@gmail.com');
  console.log('You can find your user ID in browser DevTools Console -> auth.currentUser.uid');
  
  // Example: Update a specific user ID
  if (process.argv[2]) {
    const userId = process.argv[2];
    const result = db.prepare('UPDATE parent_settings SET is_admin = 1 WHERE user_id = ?').run(userId);
    console.log(`✅ Admin status updated for user ${userId}! Rows affected:`, result.changes);
    
    const check = db.prepare('SELECT user_id, is_admin FROM parent_settings WHERE user_id = ?').get(userId);
    console.log('Updated record:', check);
  }
  
} catch(e) {
  console.error('Error:', e.message);
}

db.close();
