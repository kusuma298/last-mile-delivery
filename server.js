require("dotenv").config();
const express=require("express");
const cors=require("cors");
const path=require("path");
const db=require("./config/db");

const app=express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

app.use("/api/auth",require("./routes/auth"));
app.use("/api/orders",require("./routes/orders"));
app.use("/api/admin",require("./routes/admin"));
app.use("/api/agents",require("./routes/agents"));

app.get("/api/health",async(req,res)=>{
  try { await db.query("SELECT 1"); res.json({status:"ok",database:"connected"}); }
  catch(e){res.status(500).json({status:"error",message:e.message});}
});

app.use(express.static(path.join(__dirname,"../frontend")));
app.get("*",(req,res)=>{
  if(req.path.startsWith("/api/")) return res.status(404).json({message:"API route not found"});
  res.sendFile(path.join(__dirname,"../frontend/index.html"));
});

const PORT=Number(process.env.PORT||5000);
app.listen(PORT,()=>console.log(`Last-Mile Delivery Tracker running on http://localhost:${PORT}`));
