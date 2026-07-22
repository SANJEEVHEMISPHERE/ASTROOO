const AstrologerLogin = require("../models/astrologerLogin.model");
const bcrypt = require("bcrypt");


// Create Astrologer Login

exports.createAstrologerLogin = async (req,res)=>{

    try{

        const {email,password} = req.body;


        if(!email || !password){

            return res.status(400).json({
                success:false,
                message:"Email and password are required"
            });

        }


        // check existing email

        const existingAstrologer = await AstrologerLogin.findOne({
            email
        });


        if(existingAstrologer){

            return res.status(400).json({
                success:false,
                message:"Email already registered"
            });

        }



        // hash password

        const hashedPassword = await bcrypt.hash(password,10);



        const astrologerLogin = await AstrologerLogin.create({

            email,
            password:hashedPassword

        });



        res.status(201).json({

            success:true,

            message:"Astrologer registered successfully",

            astrologerLogin:{
                id:astrologerLogin._id,
                email:astrologerLogin.email
            }

        });



    }
    catch(error){

        console.log(error);

        res.status(500).json({

            success:false,
            message:"Server Error"

        });

    }

};