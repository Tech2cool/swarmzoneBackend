import yup from 'yup';
import { verifyJWTToken } from './routesFunctions.js';
import { allowedOrigins } from './constant.js';

export const loginSchema = yup.object({
    username:yup.string().required(),
    password:yup.string().min(6).required(),
})

export const registerSchema = yup.object({
    username:yup.string().required(),
    email:yup.string().email().required(),
    password:yup.string().min(6).required(),
})

export const validationLogin = async (req,res,next)=>{
    const body = req.body;

    try {
        await loginSchema.validate(body)
        
        return next()
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}
export const validationRegister = async (req,res,next)=>{
    const body = req.body;

    try {
        await registerSchema.validate(body)
        
        return next()
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}

export const validateUser = async(req,res,next)=>{
    try {
        // if (!allowedOrigins.includes(req.header('origin'))){return res.status(403).send('Origin not allowed');}
        const token = req.cookies.token;
        // console.log(token)
        if(!token) return res.json({message:"unauthorized"})
        const tokenCheck = verifyJWTToken(token)
        // console.log(tokenCheck)
        if(tokenCheck === "token_expired") {res.clearCookie("token"); return res.json({message:"session expired"})}
        if(tokenCheck === "token_verification_failed") return res.json({message:"unauthorized"})
        req.user = tokenCheck;
        return next()
    } catch (error) {
        return res.status(400).json({ error: error.message });
    }
}