const db = require("../config/db");

async function autoAssign(orderId) {
  const [orderRows] = await db.query("SELECT * FROM orders WHERE id=?", [orderId]);
  if (!orderRows.length) throw new Error("Order not found");
  const order = orderRows[0];

  const [agents] = await db.query(
    `SELECT u.id, u.name, u.phone, a.current_lat, a.current_lng,
            (ABS(a.current_lat-COALESCE(?,a.current_lat)) + ABS(a.current_lng-COALESCE(?,a.current_lng))) distance_score
     FROM users u
     JOIN agents a ON a.user_id=u.id
     WHERE u.role='agent' AND a.available=1
     ORDER BY distance_score ASC
     LIMIT 1`,
    [order.pickup_lat, order.pickup_lng]
  );

  if (!agents.length) throw new Error("No available delivery agent");

  const agent = agents[0];
  await db.query(
    "INSERT INTO order_assignments(order_id,agent_id,assigned_by,assignment_type) VALUES(?,?,?,?)",
    [orderId, agent.id, null, "AUTO"]
  );
  await db.query("UPDATE orders SET agent_id=?, status='ASSIGNED' WHERE id=?", [agent.id, orderId]);
  return agent;
}

module.exports = { autoAssign };
