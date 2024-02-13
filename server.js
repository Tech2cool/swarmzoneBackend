import express from "express";
import axios from "axios";
import os from "os";
import cors from "cors";
import si from "systeminformation";


const app = express();
app.use(cors())
app.use(express.json());

const PORT = 8081

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
// // console.log(os.networkInterfaces())
// console.log(os.tmpdir())
// console.log(os.totalmem())
// console.log(os.type()) // system type
// console.log(os.uptime()) //uptime
// console.log(os.userInfo()) //user info 
// console.log(os.version()) //os Version 


app.get("/cpu-info", async(req, res)=>{
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
        res.status(500).json({error:error})
    }
})

app.get("/memory-info", async(req, res)=>{
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
        res.status(500).json({error:error})
    }
})
app.get("/disk-info", async(req, res)=>{
    try {
        const diskInfo = await si.fsSize();
        // console.log(systemStats);
        res.json(diskInfo)
    } catch (error) {
        res.status(500).json({error:error})
    }
})

app.get("/system-uptime", (req, res)=>{
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
        res.status(500).json({error:error})
    }
})