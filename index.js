const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
const app = express();
const port = 3000;

app.use(bodyParser.json());

const courseAlreadyExists = (data, req) => {
  for (const i in data) {
    console.log(data[i].courseName);
    console.log(req.body.courseName);
    if (data[i].courseName === req.body.courseName) {
      console.log(data[i].courseName);
      console.log(req.body.courseName);
      return true;
    }
  }
  return false;
}

const alreadyExists = (data, req) => {
  for (const entity in data) {
    if (data[entity].username === req.body.username) {
      return true;
    }
  }
  return false;
}

const adminAuth = (req, res, next) => {
  fs.readFile("admins.json", "utf-8", (err, data) => {
    if (err) throw err;
    const admins = JSON.parse(data);
    if (admins.length === 0) res.json({ message: "no admins exists" });
    let verified = false;
    for (const i in admins) {
      if (admins[i].username === req.body.username && admins[i].password === req.body.password) {
        verified = true;
      }
    }
    if (verified) next();
    else { res.status(404).json({ message: "admin not found" }) };
  });
};

const userAuth = (req, res, next) => {
  fs.readFile("users.json", "utf-8", (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    if (users.length === 0) res.status(404).json({ message: "internal error" })
    const verified = users.find(c => c.username === req.body.username && c.password === req.body.password);
    console.log(verified);
    if (!verified) res.status(404).json({ message: "unverified" });
    else {
      req.verified = verified;
      console.log("verified");
      next();
    };
  });
}
// Admin routes
app.post("/admin/signup", (req, res) => {
  const newAdmin = { ...req.body }
  const message = {
    mess: "admin has been created successfully",
  }
  fs.readFile("admins.json", "utf-8", (err, data) => {
    if (err) throw err;
    const fData = JSON.parse(data);
    const alrExists = alreadyExists(fData, req);
    if (alrExists) res.status(404).json({ message: "admin already exists" });
    else {
      fData.push(newAdmin);
      fs.writeFile("admins.json", JSON.stringify(fData), err => {
        if (err) throw err;
        res.status(200).json(message);
      })
    }
  })
});

app.post("/admin/login", adminAuth, (req, res) => {
  res.status(200).json({ message: "login successfull" });
});

app.post("/admin/courses", adminAuth, (req, res) => {
  let newCourse = {
    id: Math.floor(Math.random() * 100),
    courseName: req.body.courseName,
    coursePrice: req.body.coursePrice,
  }
  if (!newCourse.id) { res.status(404).json({ message: "internal error" }) }
  if (!(newCourse.courseName)) { res.status(404).json({ message: "please type in a course" }) }
  else {
    fs.readFile("courses.json", "utf-8", (err, data) => {
      if (err) throw err;
      const courses = JSON.parse(data);
      const alreadyExists = courseAlreadyExists(data, req);
      if (alreadyExists) res.json({ message: "the course already exists" });
      else {
        courses.push(newCourse);
        fs.writeFile("courses.json", JSON.stringify(courses), (err) => {
          if (err) throw err;
          res.status(201).json({ message: "the course has been added" });
        });
      }
    });
  };
});

app.put("/admin/courses/:courseId", adminAuth, (req, res) => {
  const newCourse = {
    id: req.params.courseId,
    courseName: req.body.courseName,
    coursePrice: req.body.coursePrice,
    paymentUrl: req.body.paymentUrl,
  };

  fs.readFile("courses.json", "utf-8", (err, data) => {
    if (err) throw err;
    const courses = JSON.parse(data);
    courses.push(newCourse);
    fs.writeFile("courses.json", JSON.stringify(courses), (err) => {
      if (err) throw err;
      res.status(201).json({ message: "the course has been added" });
    });
  });
});

app.get("/admin/courses", adminAuth, (req, res) => {
  // logic to get all courses
  fs.readFile("courses.json", "utf-8", (err, data) => {
    if (err) throw err; const courses = JSON.parse(data);
    if (courses.length <= 0) res.status(404).json({ message: "no courses are there" });
    else res.status(200).json(courses);
  })
});

// User routes
app.post("/users/signup", (req, res) => {
  const addUser = {
    id: Math.floor(Math.random() * 100),
    ...req.body,
    hasPurchasedCourses: [],
  };

  fs.readFile("users.json", "utf-8", (err, data) => {
    if (err) throw err;
    const users = JSON.parse(data);
    const alrExists = alreadyExists(users, req);
    if (alrExists) res.status(404).json({ message: "user already exist" });
    else {
      fs.readFile("admins.json", "utf-8", (err, adminData) => {
        if (err) throw err;
        const admins = JSON.parse(adminData);
        const exists = alreadyExists(admins, req);
        if (exists) res.status(404).json({ message: "user already exists as an admin" });
        else {
          users.push(addUser);
          fs.writeFile("users.json", JSON.stringify(users), (err) => {
            if (err) throw err;
            res.status(200).json({ message: "user successfully created" });
          });
        }
      })
    };
  });
});

app.post("/users/login", userAuth, (req, res) => {
  res.status(200).json({ message: "logged in successfully" });
});

app.get("/users/courses", userAuth, (req, res) => {
  fs.readFile("courses.json", "utf-8", (err, data) => {
    if (err) throw err;
    const courses = JSON.parse(data);
    if (courses.length < 1) res.status(404).json({ message: "no courses exist" });
    else res.status(200).json(courses);
  })
});

app.post("/users/courses/:courseId", userAuth, (req, res) => {
  fs.readFile("courses.json", "utf-8", (err, data) => {
    if (err) throw err;
    const courses = JSON.parse(data);
    if (courses.length < 1) res.status(404).json({ message: "no courses exist" });
    else {
      const checkCourse = courses.findIndex(c => {
        return c.id === parseInt(req.params.courseId);
      });
      if (checkCourse === -1) return res.json({ message: "course does not exist" })
      const alreadyPurchased = req.verified.hasPurchasedCourses.findIndex(c => {
        console.log(c);
        console.log(req.params.courseId);
        return c === req.params.courseId;
      });
      if (alreadyPurchased !== -1) return res.json({ message: "already bought" });
      const purchased = courses.find(c =>
        c.id === parseInt(req.params.courseId)
      );
      fs.readFile("users.json", "utf-8", (err, data) => {
        if (err) throw err;
        const userData = JSON.parse(data);
        const match = userData.find(c => c.username === req.verified.username);
        console.log(match);
        match.hasPurchasedCourses.push(purchased.id);
        fs.writeFile("users.json", JSON.stringify(userData), (err) => {
          if (err) throw err;
          res.json({ message: "done" });
        });
      });
    };
  });
});

app.get("/users/purchasedCourses", userAuth, (req, res) => {
  res.status(200).json(req.verified.hasPurchasedCourses);
});
app.use((req, res, next) => {
  res.status(404).json({ message: "doesnt exist" });
})
app.listen(port, () => {
  console.log(`the server is started on port ${port}`);
});
