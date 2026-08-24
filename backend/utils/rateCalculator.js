const db = require("../config/db");

async function detectZone(address) {
  const [rows] = await db.query(
    "SELECT z.id, z.name FROM zones z JOIN zone_areas a ON a.zone_id=z.id WHERE LOWER(?) LIKE CONCAT('%', LOWER(a.area_name), '%') LIMIT 1",
    [address]
  );
  return rows[0] || null;
}

async function calculateRate(input) {
  const { pickupAddress, dropAddress, length, width, height, actualWeight, orderType, paymentType } = input;

  const pickupZone = await detectZone(pickupAddress);
  const dropZone = await detectZone(dropAddress);

  if (!pickupZone || !dropZone) {
    throw new Error("Pickup or drop address does not match a configured zone area");
  }

  const volumetricWeight = (Number(length) * Number(width) * Number(height)) / 5000;
  const chargeableWeight = Math.max(Number(actualWeight), volumetricWeight);
  const routeType = pickupZone.id === dropZone.id ? "INTRA" : "INTER";

  const [rates] = await db.query(
    `SELECT * FROM rate_cards
     WHERE order_type=? AND route_type=?
       AND min_weight <= ? AND max_weight >= ?
     ORDER BY min_weight ASC LIMIT 1`,
    [orderType, routeType, chargeableWeight, chargeableWeight]
  );

  if (!rates.length) throw new Error("No rate card configured for this chargeable weight");

  const baseCharge = Number(rates[0].base_charge);
  let codSurcharge = 0;

  if (paymentType === "COD") {
    const [cod] = await db.query(
      "SELECT surcharge FROM cod_rates WHERE order_type=? LIMIT 1",
      [orderType]
    );
    codSurcharge = cod.length ? Number(cod[0].surcharge) : 0;
  }

  return {
    pickupZone,
    dropZone,
    volumetricWeight: Number(volumetricWeight.toFixed(2)),
    chargeableWeight: Number(chargeableWeight.toFixed(2)),
    routeType,
    rateCardId: rates[0].id,
    baseCharge,
    codSurcharge,
    totalCharge: Number((baseCharge + codSurcharge).toFixed(2))
  };
}

module.exports = { calculateRate, detectZone };
