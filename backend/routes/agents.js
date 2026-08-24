const router=require("express").Router();
const c=require("../controllers/agentController");
const {auth,allow}=require("../middleware/auth");
router.use(auth,allow("agent"));
router.get("/me/orders",c.orders);
router.put("/me/location",c.location);
router.put("/me/availability",c.availability);
module.exports=router;
