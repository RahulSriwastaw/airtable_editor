fetch('http://localhost:3000/api/tables/TestTable/records/1', {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ fields: { question_hi: 'TEST' }, editorName: 'Tester' })
}).then(res => res.json()).then(console.log);
