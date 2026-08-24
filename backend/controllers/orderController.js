const db = require("../config/db");
const { calculateRate } = require("../utils/rateCalculator");
const { notifyStatus } = require("../services/notificationService");
const { autoAssign } = require("../services/assignmentService");

async function quote(req, res) {
  try {
    const result = await calculateRate(req.body);
    res.json(result);
  } catch (e) { res.status(400).json({ message: e.message }); }
}

async function create(req, res) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const b = req.body;
    const calc = await calculateRate(b);

    const customerId = req.user.role === "customer" ? req.user.id : (b.customerId || req.user.id);

    const [result] = await conn.query(
      `INSERT INTO orders
      (customer_id,pickup_address,drop_address,pickup_zone_id,drop_zone_id,
       length_cm,width_cm,height_cm,actual_weight,volumetric_weight,chargeable_weight,
       order_type,payment_type,base_charge,cod_surcharge,total_charge,status,pickup_lat,pickup_lng,drop_lat,drop_lng)
       VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'CREATED',?,?,?,?)`,
      [customerId,b.pickupAddress,b.dropAddress,calc.pickupZone.id,calc.dropZone.id,
       b.length,b.width,b.height,b.actualWeight,calc.volumetricWeight,calc.chargeableWeight,
       b.orderType,b.paymentType,calc.baseCharge,calc.codSurcharge,calc.totalCharge,
       b.pickupLat||null,b.pickupLng||null,b.dropLat||null,b.dropLng||null]
    );

    await conn.query(
      "INSERT INTO order_tracking(order_id,status,actor_id,note) VALUES(?,?,?,?)",
      [result.insertId,"CREATED",req.user.id,"Order created"]
    );

    await conn.commit();
    res.status(201).json({ orderId: result.insertId, calculation: calc });
  } catch (e) {
    await conn.rollback();
    res.status(400).json({ message: e.message });
  } finally { conn.release(); }
}

async function list(req, res) {
  try {
    let sql = `SELECT o.*, c.name customer_name, c.email customer_email, a.name agent_name,
               z1.name pickup_zone, z2.name drop_zone
               FROM orders o
               JOIN users c ON c.id=o.customer_id
               LEFT JOIN users a ON a.id=o.agent_id
               JOIN zones z1 ON z1.id=o.pickup_zone_id
               JOIN zones z2 ON z2.id=o.drop_zone_id`;
    const params = [];
    if (req.user.role === "customer") { sql += " WHERE o.customer_id=?"; params.push(req.user.id); }
    if (req.user.role === "agent") { sql += " WHERE o.agent_id=?"; params.push(req.user.id); }
    sql += " ORDER BY o.created_at DESC";
    const [rows] = await db.query(sql, params);
    res.json(rows);
  } catch(e) { res.status(500).json({message:e.message}); }
}

async function getOne(req, res) {
  try {
    const [orders] = await db.query(
      `SELECT o.*, c.name customer_name,c.email customer_email,c.phone customer_phone,a.name agent_name
       FROM orders o JOIN users c ON c.id=o.customer_id
       LEFT JOIN users a ON a.id=o.agent_id WHERE o.id=?`, [req.params.id]);
    if (!orders.length) return res.status(404).json({message:"Order not found"});
    const [tracking] = await db.query(
      `SELECT t.*, u.name actor_name FROM order_tracking t
       LEFT JOIN users u ON u.id=t.actor_id WHERE t.order_id=? ORDER BY t.created_at ASC`, [req.params.id]);
    res.json({order:orders[0], tracking});
  } catch(e) { res.status(500).json({message:e.message}); }
}

const allowedStatuses = ["ASSIGNED","PICKED_UP","IN_TRANSIT","OUT_FOR_DELIVERY","DELIVERED","FAILED","CANCELLED"];

async function changeStatus(req, res) {
  const status = req.body.status;
  if (!allowedStatuses.includes(status)) return res.status(400).json({message:"Invalid status"});
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query("SELECT * FROM orders WHERE id=? FOR UPDATE", [req.params.id]);
    if (!rows.length) throw new Error("Order not found");
    const order = rows[0];

    if (req.user.role === "agent" && order.agent_id !== req.user.id) throw new Error("This order is not assigned to you");

    await conn.query("UPDATE orders SET status=? WHERE id=?", [status, req.params.id]);
    await conn.query(
      "INSERT INTO order_tracking(order_id,status,actor_id,note) VALUES(?,?,?,?)",
      [req.params.id,status,req.user.id,req.body.note || null]
    );
    await conn.commit();

    const [customers] = await db.query("SELECT * FROM users WHERE id=?", [order.customer_id]);
    if (customers.length) await notifyStatus(customers[0], order, status);

    res.json({message:"Status updated"});
  } catch(e) {
    await conn.rollback();
    res.status(400).json({message:e.message});
  } finally { conn.release(); }
}

async function manualAssign(req, res) {
  try {
    const agentId = Number(req.body.agentId);
    const [agent] = await db.query("SELECT id FROM users WHERE id=? AND role='agent'", [agentId]);
    if (!agent.length) return res.status(400).json({message:"Invalid agent"});
    await db.query("INSERT INTO order_assignments(order_id,agent_id,assigned_by,assignment_type) VALUES(?,?,?,?)",
      [req.params.id,agentId,req.user.id,"MANUAL"]);
    await db.query("UPDATE orders SET agent_id=?,status='ASSIGNED' WHERE id=?", [agentId,req.params.id]);
    await db.query("INSERT INTO order_tracking(order_id,status,actor_id,note) VALUES(?,?,?,?)",
      [req.params.id,"ASSIGNED",req.user.id,"Manually assigned"]);
    res.json({message:"Agent assigned"});
  } catch(e) { res.status(400).json({message:e.message}); }
}

async function auto(req,res) {
  try {
    const agent = await autoAssign(req.params.id);
    await db.query("INSERT INTO order_tracking(order_id,status,actor_id,note) VALUES(?,?,?,?)",
      [req.params.id,"ASSIGNED",req.user.id,"Automatically assigned to nearest available agent"]);
    res.json({message:"Auto-assigned", agent});
  } catch(e) { res.status(400).json({message:e.message}); }
}

async function reschedule(req,res) {
  try {
    const [rows] = await db.query("SELECT * FROM orders WHERE id=?", [req.params.id]);
    if (!rows.length) return res.status(404).json({message:"Order not found"});
    if (req.user.role !== "customer" || rows[0].customer_id !== req.user.id) return res.status(403).json({message:"Only the customer can reschedule"});
    if (rows[0].status !== "FAILED") return res.status(400).json({message:"Only failed orders can be rescheduled"});
    await db.query("INSERT INTO reschedules(order_id,new_date,reason,requested_by) VALUES(?,?,?,?)",
      [req.params.id,req.body.newDate,req.body.reason||"Customer requested reschedule",req.user.id]);
    await db.query("UPDATE orders SET scheduled_date=?,agent_id=NULL,status='CREATED' WHERE id=?",
      [req.body.newDate,req.params.id]);
    await db.query("INSERT INTO order_tracking(order_id,status,actor_id,note) VALUES(?,?,?,?)",
      [req.params.id,"CREATED",req.user.id,"Delivery rescheduled"]);
    res.json({message:"Delivery rescheduled. Admin can auto-assign a new agent."});
  } catch(e) { res.status(400).json({message:e.message}); }
}

module.exports = { quote, create, list, getOne, changeStatus, manualAssign, auto, reschedule };
