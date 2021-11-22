const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
var fetchuser = require("../middleware/fetchuser")

const JWT_SECRET = "inotebook@keerthan";

// ROUTE 1 : Create a user using : POST "/api/auth/createUser". NO login required
router.post(
  "/createUser",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("password", "Password must be atleast 5 characters").isLength({
      min: 5,
    }),
    body("phoneNumber", "Enter a valid phonenumber").isLength({ min: 10, max: 10 })
  ],
  async (req, res) => {
    //Validating the user Inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    //check whether the user with email exist
    try {
      let user = await User.findOne({ email: req.body.email });
      if (user) {
        return res
          .status(400)
          .json({ error: "sorry user with this email already exists" });
      }
      //hashing password
      const salt = bcrypt.genSaltSync(10);
      const secPass = bcrypt.hashSync(req.body.password, salt);
      //saving in Database
      user = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: secPass,
        phoneNumber: req.body.phoneNumber
      });
      //creating JWT Token
      console.log("hi")
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.status(201).json({ authToken });
    } catch (error) {
      console.log(error);
      res.status(500).send("Some Internal Error");
    }
  }
);
// ROUTE 2 : Authenitcate a user using : POST "/api/auth/login". NO login required
router.post(
  "/login",
  [body("email", "Enter a valid Email").isEmail(),
  body("password", "Password cannot b blank").exists(),
  ],
  async (req, res) => {
    //Validating the user Inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Please try to login with correct credentials" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ error: "Please try to login with correct credentials" });
      }
      const data = {
        user: {
          id: user.id,
        },
      };
      const authToken = jwt.sign(data, JWT_SECRET);
      res.status(201).json({ authToken });
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  })

// ROUTE 3 : Get logged in user details : GET "/api/auth/getuser". login required
router.get("/getuser", fetchuser, async (req, res) => {
  try {
    userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user)
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
})

//ROUTE 4 : Forgot password : POST "/api/auth/changepasscheck" , login not required
router.post("/changepasscheck", async (req, res) => {
  try {
    email = req.body.email;
    num = req.body.number;
    const user = await User.find({ email: email }).select("-password");
    rnum = user[0].phoneNumber.substr(6)
    if (num === rnum) {
      res.status(200).json({ id: user[0]._id, value: true });
    } else {
      res.status(409).json({ value: false });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
})

//ROUTE 5 : Change password : PUT "/api/auth/changepassword" , login not required
router.put("/changepassword",
  [
    body("password", "Password cannot be blank").exists(),
  ]
  , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      //hashing password
      const salt = bcrypt.genSaltSync(10);
      const secPass = bcrypt.hashSync(req.body.password, salt);
      const headerid = req.header("id-token");

      const user = await User.findByIdAndUpdate(headerid, { $set: { password: secPass } }, { new: true }).select("-password")
      res.json({ user })
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  })

//ROUTE 6 : Update Profile : PUT "/api/auth/updateprofile" , login required
router.put("/updateprofile",
  [
    body("name", "Enter a valid name").isLength({ min: 3 }),
    body("email", "Enter a valid Email").isEmail(),
    body("phoneNumber", "Enter a valid phonenumber").isLength({ min: 10, max: 10 })
  ], fetchuser
  , async (req, res) => {
    const { name, email, phoneNumber } = req.body
    const newUser = {};
    if (name) {
      newUser.name = name;
    }
    if (email) {
      newUser.email = email;
    }
    if (phoneNumber) {
      newUser.phoneNumber = phoneNumber;
    }
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      userId = req.user.id;
      const user = await User.findByIdAndUpdate(userId, { $set: newUser }, { new: true }).select("-password")
      res.json(user)
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  })

//ROUTE 5 : Reset password : PUT "/api/auth/resetpassword" , login not required
router.put("/resetpassword",
  [
    body("opassword", "old Password cannot be blank").exists(),
    body("password", "Password cannot be blank").exists()
  ], fetchuser
  , async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      userId = req.user.id;
      const user = await User.findById(userId);
      const { opassword, password } = req.body
      const passwordCompare = await bcrypt.compare(opassword, user.password);
      if (!passwordCompare) {
        return res.status(400).json({ error: "Please try to login with correct credentials" });
      } else {
        //hashing password
        const salt = bcrypt.genSaltSync(10);
        const secPass = bcrypt.hashSync(password, salt);
        const ruser = await User.findByIdAndUpdate(userId, { $set: { password: secPass } }, { new: true }).select("-password")
        res.json({ ruser })
      }
    } catch (error) {
      console.log(error);
      res.status(500).send("Internal Server Error");
    }
  })

module.exports = router;
