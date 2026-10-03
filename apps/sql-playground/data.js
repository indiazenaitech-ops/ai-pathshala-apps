/* SQL Playground data: the school database (seed SQL), example queries and practice answers.
   SQL is the same in every language; the titles/questions live in content.js. */
window.SQLP_DATA = {
  seed: [
    "CREATE TABLE STUDENT (",
    "  rollno  INT NOT NULL PRIMARY KEY,",
    "  name    VARCHAR(30) NOT NULL COLLATE NOCASE,",
    "  class   INT,",
    "  section CHAR(1) COLLATE NOCASE,",
    "  gender  CHAR(1) COLLATE NOCASE,",
    "  city    VARCHAR(20) COLLATE NOCASE,",
    "  dob     DATE,",
    "  stream  VARCHAR(15) COLLATE NOCASE",
    ");",
    "INSERT INTO STUDENT VALUES",
    "(1,'Aarav Sharma',12,'A','M','Delhi','2008-03-14','Science'),",
    "(2,'Ananya Iyer',12,'A','F','Chennai','2008-07-22','Science'),",
    "(3,'Rohan Mehta',12,'A','M','Mumbai','2007-11-05','Science'),",
    "(4,'Priya Nair',12,'A','F','Kochi','2008-01-30','Science'),",
    "(5,'Kabir Singh',12,'B','M','Chandigarh','2008-05-18','Commerce'),",
    "(6,'Ishita Gupta',12,'B','F','Delhi','2008-09-09','Commerce'),",
    "(7,'Mohammed Faiz',12,'B','M','Lucknow','2007-12-25','Commerce'),",
    "(8,'Sneha Patil',12,'B','F','Pune','2008-04-02','Commerce'),",
    "(9,'Arjun Rao',12,'C','M','Hyderabad','2008-06-11','Humanities'),",
    "(10,'Fatima Sheikh',12,'C','F','Bhopal','2008-02-27','Humanities'),",
    "(11,'Vikram Choudhary',12,'C','M','Jaipur','2007-10-19','Humanities'),",
    "(12,'Meera Das',12,'C','F','Kolkata','2008-08-08','Humanities'),",
    "(13,'Aditya Kulkarni',11,'A','M','Pune','2009-01-15','Science'),",
    "(14,'Diya Banerjee',11,'A','F','Kolkata','2009-03-03','Science'),",
    "(15,'Harpreet Kaur',11,'A','F','Amritsar','2008-12-21','Science'),",
    "(16,'Siddharth Jain',11,'A','M','Jaipur','2009-05-29','Science'),",
    "(17,'Nikita Agarwal',11,'B','F','Delhi','2009-07-07','Commerce'),",
    "(18,'Yash Thakur',11,'B','M','Shimla','2009-02-14','Commerce'),",
    "(19,'Zoya Khan',11,'B','F','Lucknow','2009-09-30','Commerce'),",
    "(20,'Rahul Yadav',11,'B','M','Patna','2008-11-11','Commerce'),",
    "(21,'Tanvi Deshpande',11,'C','F','Mumbai','2009-04-24','Humanities'),",
    "(22,'Manoj Behera',11,'C','M','Bhubaneswar','2009-06-06','Humanities'),",
    "(23,'Lavanya Krishnan',11,'C','F','Chennai','2009-08-16','Humanities'),",
    "(24,'Kunal Bose',11,'C','M','Kolkata','2009-10-01','Humanities'),",
    "(25,'Neha Solanki',11,'A','F',NULL,'2009-12-03','Science');",
    "",
    "CREATE TABLE MARKS (",
    "  rollno  INT NOT NULL,",
    "  subject VARCHAR(25) NOT NULL COLLATE NOCASE,",
    "  marks   INT CHECK (marks >= 0 AND marks <= 100),",
    "  PRIMARY KEY (rollno, subject)",
    ");",
    "INSERT INTO MARKS VALUES",
    "(1,'English',78),(1,'Physics',85),(1,'Computer Science',92),",
    "(2,'English',91),(2,'Physics',88),(2,'Computer Science',95),",
    "(3,'English',66),(3,'Physics',58),(3,'Computer Science',71),",
    "(4,'English',84),(4,'Physics',79),(4,'Computer Science',90),",
    "(5,'English',72),(5,'Accountancy',81),(5,'Informatics Practices',77),",
    "(6,'English',88),(6,'Accountancy',93),(6,'Informatics Practices',89),",
    "(7,'English',59),(7,'Accountancy',64),(7,'Informatics Practices',70),",
    "(8,'English',80),(8,'Accountancy',76),(8,'Informatics Practices',85),",
    "(9,'English',69),(9,'History',74),(9,'Informatics Practices',66),",
    "(10,'English',93),(10,'History',89),(10,'Informatics Practices',82),",
    "(11,'English',55),(11,'History',61),(11,'Informatics Practices',58),",
    "(12,'English',86),(12,'History',92),(12,'Informatics Practices',79),",
    "(13,'English',74),(13,'Physics',68),(13,'Computer Science',88),",
    "(14,'English',82),(14,'Physics',77),(14,'Computer Science',91),",
    "(15,'English',79),(15,'Physics',83),(15,'Computer Science',75),",
    "(16,'English',61),(16,'Physics',45),(16,'Computer Science',67),",
    "(17,'English',90),(17,'Accountancy',87),(17,'Informatics Practices',93),",
    "(18,'English',52),(18,'Accountancy',48),(18,'Informatics Practices',60),",
    "(19,'English',77),(19,'Accountancy',72),(19,'Informatics Practices',81),",
    "(20,'English',63),(20,'Accountancy',NULL),(20,'Informatics Practices',57),",
    "(21,'English',85),(21,'History',80),(21,'Informatics Practices',74),",
    "(22,'English',47),(22,'History',31),(22,'Informatics Practices',52),",
    "(23,'English',89),(23,'History',91),(23,'Informatics Practices',86),",
    "(24,'English',68),(24,'History',70),(24,'Informatics Practices',64),",
    "(25,'English',71),(25,'Physics',29),(25,'Computer Science',76);",
    "",
    "CREATE TABLE TEACHER (",
    "  tid     INT NOT NULL PRIMARY KEY,",
    "  name    VARCHAR(30) NOT NULL COLLATE NOCASE,",
    "  subject VARCHAR(25) COLLATE NOCASE,",
    "  salary  INT,",
    "  doj     DATE",
    ");",
    "INSERT INTO TEACHER VALUES",
    "(101,'Meena Iyer','Computer Science',78000,'2012-07-01'),",
    "(102,'Rakesh Verma','Physics',72000,'2010-04-15'),",
    "(103,'Nasreen Ahmed','English',65000,'2015-06-20'),",
    "(104,'Gurpreet Singh','Physical Education',52000,'2018-01-10'),",
    "(105,'Sunita Rao','Accountancy',69000,'2013-08-05'),",
    "(106,'Arvind Menon','History',61000,'2016-07-12'),",
    "(107,'Kavita Joshi','Informatics Practices',58000,'2019-04-01'),",
    "(108,'Debashish Ghosh','Mathematics',81000,'2008-06-16'),",
    "(109,'Lakshmi Narayanan','Music',48000,'2020-07-01'),",
    "(110,'Prakash Patil','Economics',63000,'2017-11-20');",
    "",
    "CREATE TABLE CLUB (",
    "  rollno INT NOT NULL,",
    "  cname  VARCHAR(20) NOT NULL COLLATE NOCASE,",
    "  tid    INT,",
    "  PRIMARY KEY (rollno, cname)",
    ");",
    "INSERT INTO CLUB VALUES",
    "(1,'Robotics',101),(2,'Robotics',101),(13,'Robotics',101),(16,'Robotics',101),(25,'Robotics',101),",
    "(4,'Eco',106),(9,'Eco',106),(10,'Eco',106),(21,'Eco',106),",
    "(6,'Music',109),(12,'Music',109),(23,'Music',109),",
    "(2,'Quiz',103),(5,'Quiz',103),(14,'Quiz',103),(17,'Quiz',103),",
    "(3,'Sports',104),(11,'Sports',104),(15,'Sports',104),(20,'Sports',104);"
  ].join('\n'),

  /* Short descriptions of each table (keys into strings.js) */
  tables: { STUDENT: 'tb_student', MARKS: 'tb_marks', TEACHER: 'tb_teacher', CLUB: 'tb_club' },

  /* Example queries, grouped by topic. Titles are content.js ex[topic][i]. */
  examples: [
    { topic: 'tp_select', items: [
      "SELECT * FROM STUDENT;",
      "SELECT name, class, section FROM STUDENT;",
      "SELECT name, salary, salary * 12 AS annual_salary\nFROM TEACHER;"
    ] },
    { topic: 'tp_where', items: [
      "SELECT * FROM STUDENT\nWHERE class = 12;",
      "SELECT name, city FROM STUDENT\nWHERE gender = 'F' AND stream = 'Science';",
      "SELECT * FROM MARKS\nWHERE marks < 33;"
    ] },
    { topic: 'tp_range', items: [
      "SELECT name, salary FROM TEACHER\nWHERE salary BETWEEN 60000 AND 75000;",
      "SELECT name, city FROM STUDENT\nWHERE city IN ('Delhi', 'Mumbai', 'Kolkata');",
      "SELECT name FROM STUDENT\nWHERE name LIKE 'A%';",
      "SELECT name FROM STUDENT\nWHERE name LIKE '_a%';"
    ] },
    { topic: 'tp_order', items: [
      "SELECT name, salary FROM TEACHER\nORDER BY salary DESC;",
      "SELECT name, class, section FROM STUDENT\nORDER BY class, name;",
      "SELECT rollno, subject, marks FROM MARKS\nORDER BY marks DESC\nLIMIT 5;"
    ] },
    { topic: 'tp_distinct', items: [
      "SELECT DISTINCT city FROM STUDENT;",
      "SELECT DISTINCT stream FROM STUDENT;",
      "SELECT DISTINCT class, section FROM STUDENT;"
    ] },
    { topic: 'tp_agg', items: [
      "SELECT COUNT(*) FROM STUDENT;",
      "SELECT MAX(marks), MIN(marks), AVG(marks), SUM(marks)\nFROM MARKS\nWHERE subject = 'English';",
      "SELECT COUNT(*), COUNT(city) FROM STUDENT;"
    ] },
    { topic: 'tp_group', items: [
      "SELECT stream, COUNT(*) AS students\nFROM STUDENT\nGROUP BY stream;",
      "SELECT subject, AVG(marks) AS average\nFROM MARKS\nGROUP BY subject;",
      "SELECT city, COUNT(*)\nFROM STUDENT\nGROUP BY city\nHAVING COUNT(*) > 1;"
    ] },
    { topic: 'tp_join', items: [
      "SELECT S.name, M.subject, M.marks\nFROM STUDENT S, MARKS M\nWHERE S.rollno = M.rollno;",
      "SELECT S.name, M.marks\nFROM STUDENT S JOIN MARKS M ON S.rollno = M.rollno\nWHERE M.subject = 'Computer Science';",
      "SELECT C.cname, T.name AS incharge, COUNT(*) AS members\nFROM CLUB C JOIN TEACHER T ON C.tid = T.tid\nGROUP BY C.cname, T.name;"
    ] },
    { topic: 'tp_dml', items: [
      "INSERT INTO STUDENT VALUES\n(26, 'Riya Kapoor', 11, 'A', 'F', 'Indore', '2009-05-12', 'Science');\nSELECT * FROM STUDENT WHERE rollno = 26;",
      "UPDATE TEACHER SET salary = salary + 5000\nWHERE subject = 'Computer Science';\nSELECT name, salary FROM TEACHER;",
      "DELETE FROM CLUB WHERE cname = 'Quiz';\nSELECT * FROM CLUB;"
    ] },
    { topic: 'tp_ddl', items: [
      "CREATE TABLE LIBRARY (\n  bookno    INT PRIMARY KEY,\n  title     VARCHAR(40) NOT NULL,\n  author    VARCHAR(30),\n  price     DECIMAL(7,2),\n  issued_to INT\n);\nINSERT INTO LIBRARY VALUES (1, 'Wings of Fire', 'A. P. J. Abdul Kalam', 250.00, 3);\nSELECT * FROM LIBRARY;",
      "ALTER TABLE TEACHER ADD COLUMN phone VARCHAR(10);\nSELECT * FROM TEACHER;",
      "DESC STUDENT;",
      "DROP TABLE IF EXISTS LIBRARY;\nSHOW TABLES;"
    ] },
    { topic: 'tp_null', items: [
      "SELECT name FROM STUDENT\nWHERE city IS NULL;",
      "SELECT rollno, subject FROM MARKS\nWHERE marks IS NULL;",
      "SELECT name, IFNULL(city, '---') AS city\nFROM STUDENT;"
    ] },
    { topic: 'tp_text', items: [
      "SELECT UPPER(name), LOWER(city), LENGTH(name)\nFROM STUDENT;",
      "SELECT name, MID(name, 1, 3) AS short,\n       LEFT(city, 3), RIGHT(city, 2)\nFROM STUDENT;",
      "SELECT CONCAT(name, ' (', city, ')') AS student,\n       INSTR(name, 'a') AS position\nFROM STUDENT;",
      "SELECT TRIM('   CBSE   '), LTRIM('   SQL'), RTRIM('SQL   ');"
    ] },
    { topic: 'tp_date', items: [
      "SELECT NOW(), CURDATE();",
      "SELECT name, dob, YEAR(dob), MONTHNAME(dob), DAYNAME(dob)\nFROM STUDENT;",
      "SELECT name, doj FROM TEACHER\nWHERE YEAR(doj) < 2015\nORDER BY doj;"
    ] },
    { topic: 'tp_math', items: [
      "SELECT POWER(2, 10), MOD(17, 5), ROUND(476.65, 1), ROUND(476.65, -1);",
      "SELECT subject, ROUND(AVG(marks), 2) AS average\nFROM MARKS\nGROUP BY subject;",
      "SELECT 7 / 2, 7 / 2.0, 7 % 2;"
    ] }
  ],

  /* Practice answers (questions are content.js practice[i]). ordered = row order matters. */
  practice: [
    { sql: "SELECT name, city FROM STUDENT;" },
    { sql: "SELECT * FROM STUDENT WHERE class = 11 AND section = 'B';" },
    { sql: "SELECT name FROM STUDENT WHERE city IN ('Kolkata', 'Chennai');" },
    { sql: "SELECT name FROM STUDENT WHERE name LIKE 'S%';" },
    { sql: "SELECT DISTINCT stream FROM STUDENT;" },
    { sql: "SELECT name, dob FROM STUDENT WHERE dob BETWEEN '2009-01-01' AND '2009-12-31' ORDER BY dob;", ordered: true },
    { sql: "SELECT name, salary FROM TEACHER ORDER BY salary DESC;", ordered: true },
    { sql: "SELECT COUNT(*) FROM STUDENT WHERE class = 12;" },
    { sql: "SELECT AVG(salary) FROM TEACHER;" },
    { sql: "SELECT stream, COUNT(*) FROM STUDENT GROUP BY stream;" },
    { sql: "SELECT subject, AVG(marks) FROM MARKS GROUP BY subject HAVING AVG(marks) > 74;" },
    { sql: "SELECT S.name, M.marks FROM STUDENT S, MARKS M WHERE S.rollno = M.rollno AND M.subject = 'English';" },
    { sql: "SELECT rollno, subject FROM MARKS WHERE marks IS NULL;" },
    { sql: "SELECT name FROM STUDENT WHERE rollno NOT IN (SELECT rollno FROM CLUB);" },
    { sql: "SELECT DISTINCT C.cname, T.name FROM CLUB C, TEACHER T WHERE C.tid = T.tid;" }
  ]
};
