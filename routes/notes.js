const express = require('express')
const router = express.Router(); 
var fetchuser = require("../middleware/fetchuser")
const Notes = require("../models/Notes");
const { body, validationResult } = require("express-validator");

// ROUTE 1 : Get All the Notes: GET "/api/auth/fetchallnotes". login required
router.get('/fetchallnotes',fetchuser,async (req,res)=>{
    try {
    const notes = await Notes.find({user: req.user.id});
    res.json(notes)           
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");       
    }
})

// ROUTE 2 : Add s new Notes using: POST "/api/auth/addnotes". login required
router.post('/addnotes',fetchuser,[
    body("title", "Enter a valid title").isLength({ min: 3 }),
    body("description", "description must be atleast 5 characters").isLength({ min: 5 }),
],
async (req,res)=>{
    try {
    const{title,description,tag}=req.body;
     //Validating the user Inputs
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } 
    const notes = new Notes({
        title,description,tag,user:req.user.id
    })
    const savedNote = await notes.save()
    res.json(savedNote)          
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");   
    }
})
// ROUTE 3 : Update an existing notes : PUT "/api/auth/updatenote". login required
router.put('/updatenote/:id',fetchuser,async(req,res)=>{
    try {
    const {title,description,tag}=req.body;
    //Create a newNotes Object
    const newNotes ={};
    if(title){
        newNotes.title =title;
    }
    if(description){
        newNotes.description =description;
    }
    if(tag){
        newNotes.tag =tag;
    }
    //Fine the notes to be updated and update it
    let notes=await Notes.findById(req.params.id);
    if(!notes){
        return res.status(404).send("Not Found");
    }
    if(notes.user.toString()!==req.user.id){
        return res.status(401).send("Not Allowed");
    }
    notes = await Notes.findByIdAndUpdate(req.params.id,{$set: newNotes},{new: true})
    res.json({notes})          
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");     
    }
})

// ROUTE 4 : Deleting an existing notes : DELETE "/api/notes/deletenote". login required
router.delete('/deletenote/:id',fetchuser,async(req,res)=>{
    try {
    const {title,description,tag}=req.body;
    //Fine the notes to be deleted and delete it
    let notes=await Notes.findById(req.params.id);
    if(!notes){
        return res.status(404).send("Not Found");
    }
    //Allow deletion only user owns this
    if(notes.user.toString()!==req.user.id){
        return res.status(401).send("Not Allowed");
    }
    notes = await Notes.findByIdAndDelete(req.params.id)
    res.json({"Sucess":"Note has been deleted", notes:notes})          
    } catch (error) {
        console.log(error);
        res.status(500).send("Internal Server Error");     
    }
})


module.exports=router;