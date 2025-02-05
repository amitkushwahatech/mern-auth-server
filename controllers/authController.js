import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import userModel from "../modules/userModel.js";
import transporter from "../config/nodemailer.js";
import { EMAIL_VERIFY_TEMPLATE, PASSWORD_RESET_TEMPLATE } from "../config/emailTemplates.js";

export const register = async (req, res) => {
  const { name, email, password } = req.body;
console.log(req.body);

  if (!name || !email || !password) {
    return res.json({ success: false, message: "Missing Details" });
  }

  try {
      
      const existingUser = await userModel.findOne({ email });
      
      if (existingUser) {
          return res.json({ success: false, message: "User already exists" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new userModel({ name, email, password:hashedPassword });
        
        await user.save();
        
       
    //token gen for auth
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });
console.log("create done")

const mailOptions = {
    from: process.env.SENDER_EMAIL,
    to: email,
    subject: 'Welcome to BLOG',
    text: `Welcome to BLOG webaite. Your account has been created with email id: ${email}`
}

const info = await transporter.sendMail(mailOptions);
console.log("Message sent: %s", info)
    return res.json({success: true})
  } catch (error) {
   return  res.json({ success: false, message: error });
  }
};

export const login = async (req, res) => {
console.log(req.body);

  const { email, password } = req.body;

  if (!email || !password) {
    return res.json({
      success: false,
      message: "email and password are required",
    });
  }

  try {
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "invalid email" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.json({ success: false, message: "invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV == "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      maxAge: 1 * 24 * 60 * 60 * 1000,
    });

    return res.json({success: true,message: token});
  } catch (error) {
    return res.json({ success: false, message: error.message });
  }
};


export const logout = async (req,res)=>{
    try{
        res.clearCookie('token',{
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
        })

        return res.json({success: true, message: "Logged Out"})

    }catch(error){
        return res.json({success: false , message: error.message})
    }
}


export const sendVerifyOtp = async (req,res)=>{

    
    try{
        const {userId} = req.body;
        
        const user = await userModel.findById(userId);
        
        if(user.isAccountVerified){
            return res.json({success: false, message: "Account Already verified"})
        }
        
        const otp =  String(Math.floor(100000 + Math.random() * 900000))
        
        user.verifyOtp = otp;
        user.verifyOtpExpireAt = Date.now()+ 60*60*1000*2;
        
        await user.save();
        
        
        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Account verification OTP',
            // text: `Your  OTP is ${otp} . verify you arccount ,  email id: ${user.email}`,
            html: EMAIL_VERIFY_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email)
        }

    await transporter.sendMail(mailOptions);

    return res.json({success: true, message: 'Verification OTP sent on email'})

    }catch (error){
        res.json({success: false, message: error.message})
    }
}


export const verifyEmail = async (req,res) =>{
    
    console.log("vrf email2");
    
    const {userId, otp} = req.body;
    
    if(!userId || !otp){
        return res.json({success: false , message: "Missing Details"});
    }
    console.log("vrf email3", otp);
    
    try{
        const user = await userModel.findById(userId)

        if(!user){
            return res.json({success: false, message: "User not found"})
        }
        console.log("vrf email1",otp, user.verifyOtp);

        if(user.verifyOtp === '' || user.verifyOtp != otp){
            return res.json({success: false, message: "Invalid OTP"})
        }



        if(user.verifyOtpExpireAt < Date.now()){
            return  res.json({success: false , message: 'OTP Expired'});
        }

        user.isAccountVerified = true;
        user.verifyOtp = '';
        user.verifyOtpExpireAt = 0;
          
        await user.save();
        return res.json({success: true, message: 'Email verified successfully'})

    }catch(error){
        return res.json({success: false, message: error.message})
    }
}

// check if user is Authentication
export const isAuthenticated = async (req,res)=>{
    try{

        return res.json({success: true})
    } catch(error){
        res.json({success: false , message: error.message})
    }

}

// Send Password Reset OTP
export const sendResetOtp = async (req,res)=>{
    const {email} = req.body;

    if(!email){
        return res.json({success: false, message: "Emial is required"})

    }

    try{

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false , message: "User not found"})
        }

        const otp = String(Math.floor(100000 + Math.random() * 900000));
        user.resetOtp = otp;
        user.resetOtpExpireAt = Date.now() + 15*60*1000

        await user.save();

        const mailOptions = {
            from: process.env.SENDER_EMAIL,
            to: user.email,
            subject: 'Password Reset OTP',
            // text: `Your  OTP for resetting your passsword is ${otp} . verify you arccount ,  email id: ${user.email}`,
            html: PASSWORD_RESET_TEMPLATE.replace("{{otp}}", otp).replace("{{email}}", user.email),
        }

        await transporter.sendMail(mailOptions);

        return res.json({success: true, message: 'Otp send to your email'});

    }catch(error){
        return res.json({success: false , message: error.message})
    }
}


//Reset User Passsword
export const resetPassword = async (req,res)=>{
    const {email, otp, newPassword} = req.body;


    if(!email || !otp || !newPassword){
        return res.json({success: false, message: 'Email , otp and new password are required'})
    }

    try{

        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success: false, message: 'User not found'})

        }

        if(user.resetOtp === "" || user.resetOtp != otp){
            return res.json({success: false , message: 'Invalid OTP'})
        }

        if(user.resetOtpExpireAt < Date.now()){
            return res.json({success: false , message: "OTP Expired"})
        }

        const hashedPasssword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPasssword;
        user.resetOtp = '';
        user.resetOtpExpireAt = 0;

        await user.save();

        return res.json({success: true , message: "Password has been reset successfully"})

    }catch(error){
        return res.json({success: false, message: error.message

        })
    }
}