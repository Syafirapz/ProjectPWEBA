const fs = require("fs");
const express = require("express");
const mysql = require("mysql2");
const expressLayouts = require("express-ejs-layouts");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const path = require("path");
const moment = require("moment");
const multer = require("multer");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");

var flash = require("express-flash");
var session = require("express-session");

const app = express();
const port = 3000;

// session
app.use(
  session({
    cookie: {
      maxAge: 60000,
    },
    store: new session.MemoryStore(),
    saveUninitialized: true,
    resave: "true",
    secret: "secret",
  })
);

app.use(flash());
//buat folder penampung file jika tidak ada
if (!fs.existsSync("./uploads")) {
  fs.mkdirSync("./uploads");
}

// middleware untuk parsing request body
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

app.set("views", path.join(__dirname, "/views"));
app.use(express.static(path.join(__dirname, "public")));
app.use("/css", express.static(path.resolve(__dirname, "assets/css")));
app.use("/img", express.static(path.resolve(__dirname, "assets/img")));

// template engine
app.set("view engine", "ejs");

// layout ejs
app.use(expressLayouts);

// mengatur folder views
app.set("views", "./views");

const saltRounds = 10;

// create the connection to database
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  database: "db_pira",
});

//database connection
db.connect((err) => {
  if (err) throw err;
});

//register dan login
app.get("/register", function (req, res) {
  res.render("register", {
    title: "Register",
    layout: "layouts/auth-layout",
  });
});

app.post("/register", function (req, res) {
  const { username, email, noHp, password, confirm_password } = req.body;
  // check if username already exists
  const sqlCheck = "SELECT * FROM users WHERE username = ?"; //+ req.body.username;
  db.query(sqlCheck, username, (err, result) => {
    if (err) throw err;

    if (result.length > 0) {
      // username already exists, send error response
      return res.status(400).send("Username sudah terdaftar!");
    }

    if (password !== confirm_password) {
      // Passwords do not match, send error response
      return res.status(400).send("Password tidak cocok!");
    }

    // hash password
    bcrypt.hash(password, saltRounds, function (err, hash) {
      if (err) throw err;

      // insert user to database
      const sqlInsert =
        "INSERT INTO users (username, email, noHp,  password) VALUES (?, ?, ?, ?)";
      const values = [username, email, noHp, hash];
      db.query(sqlInsert, values, (err, result) => {
        if (err) throw err;
        console.log("User registered successfully");
        req.flash("success", "Data Berhasil Disimpan!");
        res.redirect("/login");
        // res.status(200).json({
        //   status: "success",
        //   message: "registrasi berhasil",
        //   data: values
        // });
      });
    });
  });
});

// login page
app.get("/login", function (req, res) {
  res.render("login", {
    title: "Login",
    layout: "layouts/auth-layout",
    username: "",
  });
});

app.post("/login", function (req, res) {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], function (err, result) {
    if (err) throw err;
    console.log(result);
    if (result.length === 0) {
      // res.status(401).send('username atau password salah!');
      // return;
      req.flash("error", err);

      // render to add.js
      res.render("layouts/auth-layout", {
        username: username,
      });
    }

    const user = result[0];

    // compare password
    bcrypt.compare(password, result[0].password, function (err, isValid) {
      if (err) throw err;

      if (!isValid) {
        res.status(401).send("username atau password salah!");
        return;
      }

      // generate token
      const token = jwt.sign({ user_id: user.user_id }, "secret_key");
      res.cookie("token", token, { httpOnly: true });
      res.redirect("/");
      // res.status(200).json({
      //   status: "success",
      //   message: "login berhasil",
      //   data: {
      //     username: username,
      //     password: password,
      //     token: token,
      //   },
      // });
    });
  });
});

// logout
app.get("/logout", function (req, res) {
  res.clearCookie("token");
  res.redirect("/login");
});

// middleware untuk memeriksa apakah user sudah login atau belum
function requireAuth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    res.redirect("/login");
    return;
  }

  jwt.verify(token, "secret_key", function (err, decoded) {
    if (err) {
      res.redirect("/login");
      return;
    }

    req.user_id = decoded.user_id;
    next();
  });
}

// protected route
app.get("/", requireAuth, function (req, res) {
  if (!req.user_id) {
    res.redirect("/login");
    return;
  }
  const user_id = req.user_id;
  //hanya form yang login yang muncul
  // const selectSql =  'SELECT forms.*, users.* FROM forms INNER JOIN users ON users.user_id = forms.user_id WHERE users.user_id = ?';
  //semua form muncul
  const selectSql =
    "SELECT forms.*, users.* FROM forms INNER JOIN users ON users.user_id = forms.user_id";
  db.query(selectSql, [user_id], (err, result) => {
    if (err) throw err;
    res.render("index", {
      forms: result,
      moment: moment,
      title: "Dashboard",
      layout: "layouts/main-layout",
    });
  });
});

//ganti password
app.post("/ganti-password", requireAuth, (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user_id;

  // Check if current password matches with database
  const sql = "SELECT password FROM users WHERE user_id = ?";
  db.query(sql, [userId], (err, result) => {
    if (err) {
      throw err;
    }

    const hashedPassword = result[0].password;
    bcrypt.compare(currentPassword, hashedPassword, (error, isMatch) => {
      if (error) {
        throw error;
      }

      if (isMatch) {
        // If current password matches, hash new password and update database
        bcrypt.hash(newPassword, saltRounds, (err, hashedNewPassword) => {
          if (err) {
            throw err;
          }

          const updateSql = "UPDATE users SET password = ? WHERE user_id = ?";
          db.query(updateSql, [hashedNewPassword, userId], (err, result) => {
            if (err) {
              throw err;
            }
            console.log("Password updated successfully");
            res.status(200).json({
              status: "success",
              message: "password berhasil diubah",
              data: {
                user_id: user_id,
                currentPassword: currentPassword,
                newPassword: newPassword,
              },
            });
          });
        });
      } else {
        // If current password doesn't match, send error message
        res.status(401).send("Invalid current password");
      }
    });
  });
});

app.post("/add-form", requireAuth, function (req, res) {
  let user_id = req.user_id;
  let title = req.body.title;
  let deadline = req.body.deadline;
  let description = req.body.description;
  let sql =
    "INSERT INTO forms (user_id, title, deadline, description) VALUES (?, ?, ?, ?)";
  db.query(sql, [user_id, title, deadline, description], (err, result) => {
    if (err) {
      throw err;
    }
    console.log("data berhasil ditambahkan");
    req.flash("success", "Data Berhasil Disimpan!");
    res.redirect("/pengumuman");
    // res.status(200).json({
    //   status: "success",
    //   message: "form berhasil ditambahkan",
    //   data: {
    //     user_id: user_id,
    //     title: title,
    //     description: description,
    //   },
    // });
  });
});

//add-form page
app.get("/add-form", function (req, res) {
  res.render("index", {
    title: "add form",
    layout: "layouts/new-task-layout",
  });
});

//detail form
app.get("/detail-form/:form_id", function (req, res) {
  const form_id = req.params.form_id;
  const sql = "SELECT * FROM forms WHERE form_id = ?";
  db.query(sql, [form_id], function (err, result) {
    if (err) throw err;
    res.render("detail-form", {
      form: result[0],
      moment: moment,
      title: "Detail Form",
      layout: "layouts/main-layout",
    });
  });
});

app.get("/pengumuman", requireAuth, function (req, res) {
  const sql = "SELECT * FROM forms JOIN users ON users.user_id = forms.user_id";
  // const formSql = 'SELECT * FROM forms WHERE form_id = ?';
  db.query(sql, (err, result) => {
    console.log(result);
    if (err) throw err;
    // const formCreator = formResult[0].user_id;
    // if (user_id === formCreator){
    res.render("index", {
      data: result,
      moment: moment,
      title: "pengumuman",
      layout: "layouts/task1-layout",
      msg: "You cannot submit your own form",
    });
    // }
  });
});


app.get("/submission", requireAuth, function (req, res) {
  let user_id = req.user_id;
  const sql = "SELECT * FROM submissions JOIN users ON users.user_id = submissions.user_id JOIN forms ON forms.form_id = submissions.form_id WHERE submissions.user_id = ?";
  // const formSql = 'SELECT * FROM forms WHERE form_id = ?';
  db.query(sql, [user_id], (err, result) => {
    console.log(result);
    if (err) throw err;
    // const formCreator = formResult[0].user_id;
    // if (user_id === formCreator){
    res.render("index", {
      data: result,
      moment: moment,
      title: "pengumuman",
      layout: "layouts/task2-layout",
      msg: "You cannot submit your own form",
    });
    // }
  });
});

app.get("/detail-pengumuman/:form_id", requireAuth, (req, res) => {
  const user_id = req.user_id;
  const form_id = req.params.form_id;

  // check if user is the creator of the form
  const formSql = "SELECT * FROM forms WHERE form_id = ?";
  db.query(formSql, [form_id], function (err, formResult) {
    if (err) throw err;

    const formCreator = formResult[0].user_id;
    if (user_id === formCreator) {
      res.send("You cannot submit your own form");
    }

    // check if user has submitted the form
    const submissionSql =
      "SELECT * FROM submissions WHERE form_id = ? AND user_id = ?";
    db.query(
      submissionSql,
      [form_id, user_id],
      function (err, submissionResult) {
        if (err) throw err;
        let isSubmitted = false;
        let submission = null;
        if (submissionResult.length > 0) {
          isSubmitted = true;
          submission = submissionResult[0];
        }

        res.render("detail-pengumuman", {
          user: user_id,
          form: formResult[0],
          moment: moment,
          title: "Detail Pengumuman",
          layout: "layouts/main-layout",
          isSubmitted: isSubmitted,
          submission: submission,
        });
      }
    );
  });
});

//download file pada detail pengumuman
app.get("/download/:user_id/:form_id", requireAuth, (req, res) => {
  const userId = req.params.user_id;
  const formId = req.params.form_id;

  // check if user has access to the form
  const formSql = "SELECT * FROM forms WHERE form_id = ?";
  db.query(formSql, [formId], function (err, formResult) {
    if (err) throw err;
    if (formResult.length === 0) {
      res.status(404).send("Form not found");
      return;
    }

    // check if submission exists
    const submissionSql =
      "SELECT * FROM submissions WHERE user_id = ? AND form_id = ?";
    db.query(submissionSql, [userId, formId], function (err, submissionResult) {
      if (err) throw err;
      if (submissionResult.length === 0) {
        res.status(404).send("Submission not found");
        return;
      }

      const submission = submissionResult[0];
      const filePath = `uploads/${submission.uploaded_file}`;

      res.download(filePath, submission.file_name, function (err) {
        if (err) {
          console.log(err);
          res.status(500).send("Internal server error");
        }
      });
    });
  });
});

// Create multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

// Create multer upload configuration
const upload = multer({ storage: storage });

// Handle file upload
app.post("/upload", upload.single("uploaded_file"), requireAuth, (req, res) => {
  // const { user_id, form_id, description } = req.body;
  const user_id = req.user_id;
  const form_id = req.body.form_id;

  const uploaded_file = req.file.filename;

  // Check if user has already submitted for the form
  const submissionSql = `SELECT * FROM submissions WHERE user_id = ? AND form_id = ?`;
  const submissionValues = [user_id, form_id];
  db.query(submissionSql, submissionValues, (err, submissionResult) => {
    if (err) {
      throw err;
    }

    // Insert data to MySQL
    const insertSql = `INSERT INTO submissions (user_id, form_id, uploaded_file) VALUES (?, ?, ?)`;
    const insertValues = [user_id, form_id, uploaded_file];
    db.query(insertSql, insertValues, (err, result) => {
      if (err) {
        throw err;
      }
      console.log("Data inserted to MySQL!");
      res.redirect("/pengumuman");
      // res.status(200).json({
      //   status: "success",
      //   message: "submit berhasil!",
      //   data: {
      //     user_id: user_id,
      //     form_id: form_id,
      //     uploaded_file: uploaded_file,
      //     // description: description,
      //   },
      // });
    });
  });
});

//profil page
app.get("/profil", requireAuth, function (req, res) {
  let user_id = req.user_id;
  const selectSql = `SELECT * FROM users WHERE user_id = ${user_id}`;
  db.query(selectSql, (err, result) => {
    if (err) throw err;
    // Periksa apakah user sudah login dan aktif
    if (result[0].active === 0) {
      res.render("index", {
        user: result[0],
        user_id: result[0].user_id,
        username: result[0].username,
        email: result[0].email,
        noHp: result[0].noHp,
        title: "Profil",
        layout: "layouts/profil-layout",
      });
    } else {
      // Jika user tidak aktif, arahkan kembali ke halaman login
      res.redirect("/login");
    }
  });
});

//upload avatar dan email
// Handle file upload
app.post("/edit-profil", upload.single("avatar"), requireAuth, (req, res) => {
  let user_id = req.user_id;
  const { username, email } = req.body;
  const avatar = req.file.filename;

  // Insert data to MySQL
  const updateUserSql = `UPDATE users SET username=?, email=?,  avatar=? WHERE user_id=${user_id}`;
  const values = [username, email, avatar];
  db.query(updateUserSql, values, (err, result) => {
    if (err) {
      throw err;
    }
    console.log("profil berhasil diubah");
    if (avatar != "") {
      // Copy file to img directory
      const source = path.join(__dirname, "uploads", avatar);
      const destination = path.join(__dirname, "assets", "img", avatar);
      fs.copyFileSync(source, destination);
    }
    res.redirect("/profil");
    // res.status(200).json({
    //   status: "success",
    //   message: "profil berhasil diubah",
    //   data: {
    //     username: username,
    //     user_id: user_id,
    //     email: email,
    //     avatar: avatar,
    //   },
    // });
  });
});

//edit user page
app.get("/edit-profil/(:id)", function (req, res) {
  let user_id = req.params.id;
  const selectSql = `SELECT * FROM users WHERE user_id = ${user_id}`;
  db.query(selectSql, (err, result) => {
    if (err) throw err;
    // Periksa apakah user sudah login dan aktif
    if (result[0].active === 0) {
      res.render("index", {
        user: result[0],
        user_id: result[0].user_id,
        username: result[0].username,
        email: result[0].email,
        noHp: result[0].noHp,
        title: "Edit Profil",
        layout: "layouts/edit-profil-layout",
      });
    } else {
      // Jika user tidak aktif, arahkan kembali ke halaman login
      res.redirect("/login");
    }
  });
  // res.render("index", {

  // });
});

app.get("/notifikasi", function (req, res) {
  const sql = "SELECT * FROM forms JOIN users ON users.user_id = forms.user_id";
  // const formSql = 'SELECT * FROM forms WHERE form_id = ?';
  db.query(sql, (err, result) => {
    console.log(result);
    if (err) throw err;
    res.render("index", {
      title: "Noitikasi",
      moment: moment,
      layout: "layouts/notifikasi-layout",
      data: result,
    });
  });
});

app.listen(port, () => {
  console.log(`listening on port ${port}`);
  const url = 'http://localhost:' + port;
  require('child_process').exec(`start ${url}`);
});
