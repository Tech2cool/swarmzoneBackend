import express from "express";
import cors from "cors";
import cookieParser from 'cookie-parser';
import { cpuInfo, diskInfo, findLevelInfo, getCoinsManyInfo, getCoinsOneInfo, getLevelOneInfo, getServerInfoByIP, loginToAcount, memInfo, registerNewAccount, startCSServer, stopServer, systemUptime, updateCoinsInfo, updateLevelInfo } from "./routesFunctions.js";
import 'dotenv/config'
import {validateUser, validationLogin, validationRegister } from "./middleWare.js";
import { homePage } from "./home.js";
import { allowedOrigins } from "./constant.js";


const app = express();

const corsOptions = {
    origin: allowedOrigins,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
    
};

app.use(cors(corsOptions));

// app.use(cors())
app.use(express.json());
app.use(cookieParser());

const PORT = process.env.PORT || 8081

app.listen(PORT,()=>{
    console.log(`Listening on PORT ${PORT}`)
})
// console.log(os.platform())
// console.log(os.arch())
// console.log(os.availableParallelism()) //cores
// console.log(os.freemem())
// console.log(os.homedir())
// console.log(os.hostname())
// console.log(os.loadavg())
// console.log(os.machine())
// console.log(os.networkInterfaces())
// console.log(os.tmpdir())
// console.log(os.totalmem())
// console.log(os.type()) // system type
// console.log(os.uptime()) //uptime
// console.log(os.userInfo()) //user info 
// console.log(os.version()) //os Version 


app.get("/cpu-info", cpuInfo)

app.get("/memory-info", memInfo)
app.get("/disk-info", diskInfo)

app.get("/system-uptime", systemUptime)


app.post("/login", validationLogin, loginToAcount)
app.post("/register", validationRegister, registerNewAccount)

app.get("/get-level-info", validateUser, getLevelOneInfo)
app.get("/find-levels", validateUser, findLevelInfo)
app.post("/update-levels", validateUser, updateLevelInfo)

app.post("/update-coins", validateUser, updateCoinsInfo)
app.get("/get-coins-info", validateUser, getCoinsOneInfo)
app.get("/get-coins-many-info", validateUser, getCoinsManyInfo)

app.get("/get-server-ip-info", getServerInfoByIP)
app.get("/start-cs-server", startCSServer)
app.get("/stop-cs-server", stopServer)


app.get("/", (req,res)=>{
    res.send(homePage)
})