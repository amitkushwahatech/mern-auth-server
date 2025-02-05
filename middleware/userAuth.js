import jwt from "jsonwebtoken";

const userAuth = async (req, res, next) =>{
    const {token} = req.cookies;
  console.log("token1",token);
  
    if(!token){
        return res.json({success : false, message: "Not 1 Authorizes Login Again"})
    }


    try{
        const tokenDecode = jwt.verify(token,process.env.JWT_SECRET)
  console.log("tokendecode1",tokenDecode);

        if(tokenDecode.id){
            req.body.userId = tokenDecode.id
        }else{
            return res.json({success: false, message: 'Not Authorized Login Again 2'});

        }

        next();
    }catch(error){
        return res.send({success: false , message: error.message});
    }
}

export default userAuth;