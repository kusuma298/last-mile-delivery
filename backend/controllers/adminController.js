const db = require("../config/db");

async function zones(req,res) {
  const [rows] = await db.query("SELECT z.*, COUNT(a.id) area_count FROM zones z LEFT JOIN zone_areas a ON a.zone_id=z.id GROUP BY z.id ORDER BY z.id");
  res.json(rows);
}
async function createZone(req,res) {
  const [r] = await db.query("INSERT INTO zones(name) VALUES(?)",[req.body.name]);
  res.status(201).json({id:r.insertId,name:req.body.name});
}
async function addArea(req,res) {
  const [r] = await db.query("INSERT INTO zone_areas(zone_id,area_name) VALUES(?,?)",[req.params.id,req.body.areaName]);
  res.status(201).json({id:r.insertId});
}
async function rates(req,res) {
  const [rows] = await db.query("SELECT * FROM rate_cards ORDER BY order_type,route_type,min_weight");
  res.json(rows);
}
async function addRate(req,res) {
  const {orderType,routeType,minWeight,maxWeight,baseCharge}=req.body;
  const [r] = await db.query("INSERT INTO rate_cards(order_type,route_type,min_weight,max_weight,base_charge) VALUES(?,?,?,?,?)",
    [orderType,routeType,minWeight,maxWeight,baseCharge]);
  res.status(201).json({id:r.insertId});
}
async function setCod(req,res) {
  await db.query("INSERT INTO cod_rates(order_type,surcharge) VALUES(?,?) ON DUPLICATE KEY UPDATE surcharge=VALUES(surcharge)",
    [req.body.orderType,req.body.surcharge]);
  res.json({message:"COD surcharge saved"});
}
async function agents(req,res) {
  const [rows] = await db.query(`SELECT u.id,u.name,u.email,u.phone,a.available,a.current_lat,a.current_lng
    FROM users u JOIN agents a ON a.user_id=u.id WHERE u.role='agent'`);
  res.json(rows);
}
async function orders(req,res) {
  let sql=`SELECT o.*,c.name customer_name,a.name agent_name,z1.name pickup_zone,z2.name drop_zone
           FROM orders o JOIN users c ON c.id=o.customer_id
           LEFT JOIN users a ON a.id=o.agent_id
           JOIN zones z1 ON z1.id=o.pickup_zone_id JOIN zones z2 ON z2.id=o.drop_zone_id WHERE 1=1`;
  const p=[];
  if(req.query.status){sql+=" AND o.status=?";p.push(req.query.status);}
  if(req.query.agentId){sql+=" AND o.agent_id=?";p.push(req.query.agentId);}
  if(req.query.zoneId){sql+=" AND (o.pickup_zone_id=? OR o.drop_zone_id=?)";p.push(req.query.zoneId,req.query.zoneId);}
  sql+=" ORDER BY o.created_at DESC";
  const [rows]=await db.query(sql,p);res.json(rows);
}
module.exports={zones,createZone,addArea,rates,addRate,setCod,agents,orders};
