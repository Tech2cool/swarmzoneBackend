

import si from "systeminformation";
import os from "os";
import axios from "axios";
import jwt from "jsonwebtoken";
import saltedMd5 from 'salted-md5';
import { queryGameServerInfo }  from 'steam-server-query';
import { getDatabaseConnection,DB_NAMES } from "./database_config.js";
import { randomUUID } from "crypto";
import { exec } from 'child_process';
import fs from "fs"
import 'dotenv/config'

const LOGGED_IN = "LOGGED_IN"
const LOGGED_OUT = "LOGGED_OUT"

export const generateJWTToken = (user)=>{
    try {
        const token = jwt.sign(user,process.env.JWT_SKEY,{expiresIn:"30m"})
        return token
    } catch (error) {
        // console.log(error);
        return error.message
    }
}

export const verifyJWTToken = (token) => {
    try {
        const decrypatedData = jwt.verify(token, process.env.JWT_SKEY);
        // console.log(decrypatedData)
        return decrypatedData;
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Handle token expiration error
            // console.log('Token expired:', error.expiredAt);
            
            return "token_expired"; // Or handle as needed in your application
        } else {
            // Handle other JWT verification errors
            // console.error('JWT verification error:', error.message);
            return "token_verification_failed"; // Or handle as needed in your application
        }
    }
}

export const cpuInfo=async(req, res)=>{
    try {
        const cpuInfo = await si.cpu();
        const cpuLoad = await si.currentLoad();
        const systemStats = {
            cpuInfo: cpuInfo,
            cpuUsage: cpuLoad,
        };
        // console.log(systemStats);
        res.json(systemStats)
    } catch (error) {
        res.status(500).json({error:error.message})
    }
}
export const memInfo = async(req, res)=>{
    try {
        const memInfo = await si.mem();
        // console.log(systemStats);
        const systemInfo={
            percentage: Math.round(memInfo?.used/memInfo?.total*100),
            usedMB: Math.round(memInfo?.used/1024/1024),
            usedGB: Math.round(memInfo?.used/1e9),
            totalMB: Math.round(memInfo?.total/1024/1024),
            totalGB: Math.round(memInfo?.total/1e9),
            memory: memInfo,
        }
        // <p>Memory Used: {Math.round(data.memory.used/1024/1024)}MB of {Math.round(data.memory.total/1e9)}GB</p>

        res.json(systemInfo)
        
    } catch (error) {
        res.status(500).json({error:error.message})
    }
}

export const diskInfo = async(req, res)=>{
    try {
        const diskInfo = await si.fsSize();
        // console.log(systemStats);
        res.json(diskInfo)
    } catch (error) {
        res.status(500).json({error:error.message})
    }
}
export const systemUptime = (req, res)=>{
    try {
        const upTime = os.uptime();
        // console.log(systemStats);
        const day = Math.round(upTime/86400);
        const hour = Math.round(upTime/60/60)%60;
        const minutes = Math.round(upTime/60)%60;
        const seconds = Math.round(upTime%60);
        const systemInfo={
            day,
            hour,
            minutes,
            seconds,
            upTime,
        }
        res.json(systemInfo)
    } catch (error) {
        res.status(500).json({error: error.message})
    }
}

export const loginToAcount = async(req,res)=>{
    try {
        const db_registersystem = await getDatabaseConnection(DB_NAMES.REGISTER_SYSTEM)
        const username = req.body.username?.toLowerCase();
        const password = req.body.password;

        const saltedPassword = await saltedMd5(password, process.env.SALT, true);
        const sql = "SELECT * FROM registersystem WHERE (LOWER(Name) = LOWER(?))";

        const [results, fields] = await db_registersystem.query(sql, username)
            
        if (results?.length <= 0) return res.json({ message: "User Doesn't Exist" });
        if (results[0]?.Password !== saltedPassword) return res.json({ message: "Entered Wrong Password"});
        const accessToken = generateJWTToken({ results });
        const verifiedToken = verifyJWTToken(accessToken)

        if(verifiedToken === "token_expired") res.clearCookie("token")

        const data = {
            username: results[0]?.Name,
            email: results[0]?.Email,
            status: results[0]?.Status,
            wLogged: LOGGED_IN,
            token: accessToken,
            created_token_time: verifiedToken?.iat,
            expiry_token_time: verifiedToken?.exp,
        };

        const sql2 = "UPDATE `registersystem` SET `WLogged` = ? WHERE `Name` = ?;";
        await db_registersystem.query(sql2, [LOGGED_IN, username])

        res.cookie("token", accessToken, { httpOnly: true });
        return res.json(data);

    } catch (error) {
        return res.json({message: error.message})
    }    
}

export const registerNewAccount = async (req,res)=>{
    try {
        const db_registersystem = await getDatabaseConnection(DB_NAMES.REGISTER_SYSTEM)
        const username = req.body.username?.toLowerCase();
        const email = req.body.email?.toLowerCase();
        const password = req.body.password;
        const type = req?.body?.type || "player";

        const sql_existing = "SELECT * FROM registersystem WHERE (LOWER(Name) = LOWER(?))";
        const sql_create_new = "INSERT INTO `registersystem` (`Name`, `Password`, `Status`, `Email`, `WLogged`, `type`) VALUES (?, ?, ?, ?, ?, ?)";
        const [results] = await db_registersystem.query(sql_existing, username)
        if(results.length > 0) return res.json({message:"Username Already Exist"})
        const saltedPassword = await saltedMd5(password, process.env.SALT, true);

        const [results2] = await db_registersystem.query(
            sql_create_new, [
            username, 
            saltedPassword,
            LOGGED_OUT,
            email,
            LOGGED_OUT,
            type
        ])

        // console.log(results2)
        return res.json({message: "Registration Successful"})
    } catch (error) {
        return res.json({message: error.message})
    }
}

export const getLevelOneInfo = async(req, res)=>{
    try {
        const user = req.user
        const username = user.results[0]?.Name
        if(!user) return res.json({message: "unauthorized access detected"})
        const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
        const sql = "SELECT * FROM thelevel WHERE (LOWER(player_id) = LOWER(?))"
        const [results] = await db_zm_swarm.query(sql, username)
        // return res.json(user.results[0]?.Name)
        if(results.length <=0) return res.json({message: `record not found for ${username}`})
        return res.json(results)
    } catch (error) {
        return res.json({message: error.message})
    }
}

export const findLevelInfo = async(req, res)=>{
    try {
        const user = req.user;
        const name = req.body.name;
        const type = user.results[0]?.type
        // console.log(type)
        // if(type === "player" || type === undefined || type === null || type === "") return res.json({message: "staff allowed Only"})
        if(type === "owner" || type === "staff"){
            const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
        
            const sql = "SELECT * FROM `thelevel` WHERE `player_id` LIKE ?"
            const userInput = `%${name}%`; // Replace with actual user input
    
            const [results] = await db_zm_swarm.query(sql, userInput)
            // return res.json(user.results[0]?.Name)
            if(results.length <=0) return res.json({message: `record not found for ${name}`})
            return res.json(results)    
        }else {
            return res.json({message: "staff allowed Only"})
        }
    } catch (error) {
        return res.json({message: error.message})
    }
}

export const updateLevelInfo = async(req, res)=>{
    try {
        const user = req.user;
        const name = req.body.name;
        const level = req.body?.level;
        const xp = req.body?.xp;
        const prestige = req.body?.prestige;
        const type = user.results[0]?.type
        // console.log(user)
        // if(type === "player" || type === undefined || type === null || type === "") return res.json({message: "staff allowed Only"})
        if(user.results[0]?.Name === name || type === "owner" || type === "staff"){
            const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
        
            const sql = "SELECT * FROM `thelevel` WHERE `player_id` = ?"
            const userInput = `${name}`; // Replace with actual user input

            const [results] = await db_zm_swarm.query(sql, userInput)
            // return res.json(user.results[0]?.Name)
            if(results.length <=0) return res.json({message: `record not found for ${name}`})
            if(level){
                const sql2 = "UPDATE `thelevel` SET `player_level` = ? WHERE `player_id` = ?;";
                const [results2]= await db_zm_swarm.query(sql2, [level, name])
            }
            if(xp){
                const sql2 = "UPDATE `thelevel` SET `player_xp` = ? WHERE `player_id` = ?;";
                const [results2] = await db_zm_swarm.query(sql2, [xp, name])
            }
            if(prestige){
                const sql2 = "UPDATE `thelevel` SET `player_prestige` = ? WHERE `player_id` = ?;";
                const [results2] = await db_zm_swarm.query(sql2, [prestige, name])
            } 
            const [results2] = await db_zm_swarm.query(sql, userInput)

            return res.json(results2)
        }else {
            return res.json({message: "you can Only change your details"})
        }
    } catch (error) {
        return res.json({message: error.message})
    }
}

export const updateCoinsInfo = async(req, res)=>{
    try {
        const user = req.user;
        const name = req.body.name;
        const coins = req.body?.coins;
        const type = user.results[0]?.type
        const username = user.results[0]?.Name
        // console.log(user)
        // if(type === "player" || type === undefined || type === null || type === "") return res.json({message: "staff allowed Only"})
        if(user.results[0]?.Name === name || type === "owner" || type === "staff"){
            const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
        
            const sql = "SELECT * FROM `coin_system` WHERE `Name` = ?"
            const userInput = `${name}`; // Replace with actual user input

            const [results] = await db_zm_swarm.query(sql, userInput)
            // return res.json(user.results[0]?.Name)
            if(results.length <=0) return res.json({message: `record not found for ${name}`})
            const sql2 = "UPDATE `coin_system` SET `Coins` = ? WHERE `Name` = ?;";
            await db_zm_swarm.query(sql2, [coins, name])
            const [results2] = await db_zm_swarm.query(sql, userInput)
            if(type === "staff" || type === "owner"){
                setShopLogs(randomUUID(), name, username, "coins", coins, true, "redeem_code", results[0].Coins, results2[0].Coins, new Date())
            }else{
                setShopLogs(randomUUID(), name, "none","coins", coins, true, "redeem_code", results[0].Coins, results2[0].Coins, new Date())
            }
            return res.json(results2)
        }else {
            return res.json({message: "you can Only change your details"})
        }
    } catch (error) {
        return res.json({message: error.message})
    }
}
export const getCoinsOneInfo = async(req, res)=>{
    try {
        const user = req.user
        const username = user.results[0]?.Name
        if(!user) return res.json({message: "unauthorized access detected"})
        const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
        const sql = "SELECT * FROM `coin_system` WHERE (LOWER(`Name`) = LOWER(?))"

        const [results] = await db_zm_swarm.query(sql, username)
        // return res.json(user.results[0]?.Name)
        if(results.length <=0) return res.json({message: `record not found for ${username}`})
        return res.json(results)
    } catch (error) {
        return res.json({message: error.message})
    }
}
export const getCoinsManyInfo = async(req, res)=>{
    try {
        const user = req.user
        const name = req.body.name
        const username = user.results[0]?.Name
        const type = user.results[0]?.type
        if(type === "owner" || type === "staff"){
            const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
            const sql = "SELECT * FROM `coin_system` WHERE (LOWER(`Name`) LIKE LOWER(?))"
            const userinfo= `%${name}%`
            const [results] = await db_zm_swarm.query(sql, userinfo)
            // return res.json(user.results[0]?.Name)
            if(results.length <=0) return res.json({message: `record not found for ${name}`})
            return res.json(results)    
        } else{
            return res.json({message: "unauthorized access detected"})
        }
    } catch (error) {
        return res.json({message: error.message})
    }
}

export const setShopLogs= async(
    tid, 
    name, 
    given_by_admin_name, 
    resource_name, 
    resource_amount, 
    purchased_with_coins,
    purchased_coins_from,
    coins_before_purchase,
    coins_after_purchase,
    purchased_time)=>{
    
    const db_zm_swarm = await getDatabaseConnection(DB_NAMES.ZM_SWARM)
    const sql2 = "INSERT INTO `logs`(\
     `tid`, \
     `name`,\
     `given_by_admin_name`,\
      `resource_name`, \
      `resource_amount`, \
      `purchased_with_coins`, \
      `purchased_coins_from`, \
      `coins_before_purchase`, \
      `coins_after_purchase`, \
      `purchased_time`) \
      VALUES ( \
        ?,\
        ?,\
        ?,\
        ?,\
        ?,\
        ?,\
        ?,\
        ?,\
        ?,\
        ?)";
    
    await db_zm_swarm.query(sql2, 
    [
        tid, 
        name, 
        given_by_admin_name, 
        resource_name, 
        resource_amount, 
        purchased_with_coins, 
        purchased_coins_from, 
        coins_before_purchase, 
        coins_after_purchase, 
        purchased_time
    ])

}

export const getServerInfoByIP = async(req, res)=>{
    try {
    const ip = req.body.ip; 
    const resp = await queryGameServerInfo(ip)
    return res.json(resp)
    } catch (error) {
        return res.json({message: error.message})
    }
}
export const startCSServer = (req, res)=>{
    try {
        startCSServerCMD("/home/ogp_agent/OGP_User_Files/tes/2", "ogp_game_startup.pid", "185.34.52.106","27018","bb_megabuild4",32)
        return res.json({message:"server Started"})
    } catch (error) {
        return res.json({message: error.message})
    }
}
let serverProcess;
const isWindows = process.platform === 'win32';
const session_name = "testing_hlds_linux"

export const startCSServerCMD = (path, pid_file="", ip, port, map, max_players, addtionalParams="")=>{
    const cs16Directory = "/home/ogp_agent/OGP_User_Files/tes/2";
    const pid = 'pidfile.txt';
    // const cs16Directory = path;
    const serverCommandLinux = `./hlds_run -game cstrike -pidfile ${pid_file} +map ${map} +ip ${ip} +port ${port} +maxplayers ${max_players} ${addtionalParams}`;
    const serverCommand = `hlds.exe -console -pidfile ${pid} -game cstrike +map ${map} +ip ${ip} +port ${port} +maxplayers ${max_players} ${addtionalParams}`;
    const serverManual = `hlds.exe -console -pidfile pidfile.txt -game cstrike +map de_dust2 +ip 192.168.1.103 +port 27015 +maxplayers 32`;
    exec(`screen -S ${session_name} -d -m ${serverCommandLinux}`, { cwd: path },(error, stdout, stderr) => {
        if (error) {
            console.error(`Error starting HLDS: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return;
        }
        console.log("HLDS started successfully.");
        console.log(`stdout: ${stdout}`);
        });

    // serverProcess = exec(serverCommand, { cwd: cs16Directory }, (error, stdout, stderr) => {
    //     if (error) {
    //         console.error(`Error starting server: ${error.message}`);
    //         return;
    //     }
    //     console.log(stdout)
    //     // Handle the rest of the response
    // });

    // serverProcess.stdout.on('data', (data) => {
    //     console.log(`stdout: ${data}`);
    // });

    // serverProcess.stderr.on('data', (data) => {
    //     console.error(`stderr: ${data}`);
    // });

    // serverProcess.on('close', (code) => {
    //     console.log(`Server process exited with code ${code}`);
    // });

    // console.log(`Server process PID: ${serverProcess.pid}`);

}
export const stopServer = (req , res)=>{
    const resp = stopServercmd()
    return res.json(resp)
}
export function stopServercmd() {

    exec(`screen -S ${session_name} -X quit`, (error, stdout, stderr) => {
        // exec('taskkill /F /IM hlds.exe', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping HLDS: ${error.message}`);
            return "error_stoping_hlds";
        }
        console.log("HLDS stopped successfully.");
        return "hlds_stopped";
    });

    // if (serverProcess && serverProcess.pid) {
    //     const killCommand = isWindows ? `taskkill /pid ${serverProcess.pid} /f` : `kill -9 ${serverProcess.pid}`;
    //     exec(killCommand, (error, stdout, stderr) => {
    //         if (error) {
    //             console.error(`Error stopping server: ${error.message}`);
    //             return;
    //         }
    //         console.log('Server stopped successfully.');
    //         return "terminated"
    //     });
    // } else {
    //     console.log('Server is not running.');
    //     return "not running"
    // }
}


// Function to stop HLDS
function stopHLDS() {
    exec('Stop-Process -Name hlds_run', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error stopping HLDS: ${error.message}`);
            return;
        }
        console.log("HLDS stopped successfully.");
    });
}

