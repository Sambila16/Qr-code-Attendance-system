const bcrypt = require('bcryptjs');
const db = require('./init');

const users = [
  { reg: 'ADM-0001', pass: 'admin123', name: 'System Administrator', role: 'admin', course: null, year: null },
  { reg: 'CR-2023-001', pass: 'cr12345', name: 'Denisi Sambila', role: 'cr', course: 'Information Systems Management', year: 3 },
  { reg: 'T21-03-12345', pass: 'student123', name: 'Amina Juma', role: 'student', course: 'Information Systems Management', year: 3 },
  { reg: 'T21-03-12346', pass: 'student123', name: 'Baraka Mushi', role: 'student', course: 'Information Systems Management', year: 3 },
  { reg: 'T21-03-12347', pass: 'student123', name: 'Consolata Kway', role: 'student', course: 'Information Systems Management', year: 3 },
];

const insert = db.prepare(`
  INSERT OR IGNORE INTO users (registration_number, password_hash, full_name, role, course, year_of_study)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const u of users) {
  const hash = bcrypt.hashSync(u.pass, 10);
  insert.run(u.reg, hash, u.name, u.role, u.course, u.year);
}

console.log('Seed complete. Sample credentials:');
console.table(users.map(({ reg, pass, role }) => ({ registration_number: reg, password: pass, role })));
