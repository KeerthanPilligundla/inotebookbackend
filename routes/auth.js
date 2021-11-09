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
      });
      //creating JWT Token
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
  [ body("email", "Enter a valid Email").isEmail(),
    body("password","Password cannot b blank").exists(),
  ],
  async (req, res) => {
    //Validating the user Inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const{email , password}=req.body;
    try {
      let user = await User.findOne({email});
      if(!user){
        return res.status(400).json({error:"Please try to login with correct credentials"});
      }
      const passwordCompare=await bcrypt.compare(password,user.password);
      if(!passwordCompare){
        return res.status(400).json({error:"Please try to login with correct credentials"});
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

// ROUTE 3 : Get logged in user details : POST "/api/auth/getuser". login required
router.post("/getuser", fetchuser , async (req,res)=>{
  try {
    userId=req.user.id;
    const user = await User.findById(userId).select("-password");
    res.json(user)
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error"); 
  }
})
module.exports = router;
