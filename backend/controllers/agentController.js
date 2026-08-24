const db = require("../config/db");
async function orders(req,res){
  const [rows]=await db.query(`SELECT o.*,c.name customer_name,c.phone customer_phone
    FROM orders o JOIN users c ON c.id=o.customer_id WHERE o.agent_id=? ORDER BY o.created_at DESC`,[req.user.id]);
  res.json(rows);
}
async function location(req,res){
  await db.query("UPDATE agents SET current_lat=?,current_lng=? WHERE user_id=?",[req.body.lat,req.body.lng,req.user.id]);
  res.json({message:"Location updated"});
}
async function availability(req,res){
  await db.query("UPDATE agents SET available=? WHERE user_id=?",[req.body.available?1:0,req.user.id]);
  res.json({message:"Availability updated"});
}
module.exports={orders,location,availability};
