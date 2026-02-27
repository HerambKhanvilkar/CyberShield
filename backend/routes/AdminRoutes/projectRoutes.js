const express = require('express');
const router = express.Router();
const FellowshipProfile = require('../../models/FellowshipProfile');

router.get('/contributor/autocompleteByname', async(req, res)=>{
    try{
        const letter = req.query.letter;

        if(!letter){
            return res.status(400).json({ message: "Please provide first letter"});
        }

        const contributor_details = await FellowshipProfile.find(
            {
                firstName: {
                    $regex: "^" + letter,
                    $options: "i"
                }
            },
            {
                firstName: 1,
                email: 1,
                assigned_role: 1,
                _id: 0
            }
        )
        res.status(200).json(contributor_details);
    }catch(err){
        console.log(err);
        res.status(500).json({ message: "Unable to autocomplete"});
    }
})
router.get('/contributor/autocompleteByrole', async(req, res)=>{
    try{
        const letter = req.query.letter;

        if(!letter){
            return res.status(400).json({ message: "Please provide first letter"});
        }

        const contributor_details = await FellowshipProfile.find(
            {
                assigned_role: {
                    $regex: "^" + letter,
                    $options: "i"
                }
            },
            {
                firstName: 1,
                email: 1,
                assigned_role: 1,
                _id: 0
            }
        )
        res.status(200).json(contributor_details);
    }catch(err){
        console.log(err);
        res.status(500).json({ message: "Unable to autocomplete"});
    }
})

module.exports = router;