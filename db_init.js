const mysql = require('mysql2');
const con = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'sasa'
});

con.connect(function(err) {
  if (err) throw err;
  con.query('CREATE DATABASE IF NOT EXISTS translate', function (err) {
    if (err) throw err;
  });

  con.changeUser({database: 'translate'}, function (err) {
    if (err) throw err;
  });

  const createTable = `CREATE TABLE IF NOT EXISTS strings
    (id int primary key auto_increment, keyword VARCHAR(255), locale VARCHAR(20), translation VARCHAR(4056))
    DEFAULT CHARSET=utf8
    `;
  con.query(createTable, function (err) {
    if (err) throw err;
  });

  const addIndex = 'ALTER TABLE `strings` ADD INDEX `keyword_locale_index` (`keyword`,`locale`)';
  con.query(addIndex, function (err) {
    if (err) throw err;
  });

  console.log('database initialized');
});
