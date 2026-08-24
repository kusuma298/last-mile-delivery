let token=localStorage.getItem("token");
let currentUser=JSON.parse(localStorage.getItem("user")||"null");
let lastQuote=null;

const $=id=>document.getElementById(id);
function show(id){["landing","login","register","app"].forEach(x=>$(x).classList.add("hidden"));$(id).classList.remove("hidden");}
function showPanel(id){document.querySelectorAll(".panel").forEach(x=>x.classList.add("hidden"));$(id).classList.remove("hidden");}
function headers(){return {"Content-Type":"application/json",...(token?{Authorization:"Bearer "+token}:{})};}
async function api(url,opt={}){let r=await fetch("/api"+url,{...opt,headers:{...headers(),...(opt.headers||{})}});let d=await r.json();if(!r.ok)throw Error(d.message||"Request failed");return d;}

async function login(){
 try{
  let d=await api("/auth/login",{method:"POST",body:JSON.stringify({email:$("loginEmail").value,password:$("loginPassword").value})});
  token=d.token;currentUser=d.user;localStorage.setItem("token",token);localStorage.setItem("user",JSON.stringify(currentUser));enterApp();
 }catch(e){$("loginMsg").textContent=e.message;}
}
async function register(){
 try{
  await api("/auth/register",{method:"POST",body:JSON.stringify({name:$("regName").value,email:$("regEmail").value,phone:$("regPhone").value,password:$("regPassword").value})});
  $("regMsg").textContent="Registered. Please login.";
 }catch(e){$("regMsg").textContent=e.message;}
}
function enterApp(){
 show("app");
 $("adminTab").classList.toggle("hidden",currentUser.role!=="admin");
 $("agentTab").classList.toggle("hidden",currentUser.role!=="agent");
 $("createTab").classList.toggle("hidden",!["customer","admin"].includes(currentUser.role));
 loadDashboard();
}
function logout(){localStorage.clear();token=null;currentUser=null;show("landing");}
async function loadDashboard(){
 showPanel("dashboardPanel");
 try{
  let rows=await api("/orders");
  $("orders").innerHTML=rows.length?rows.map(o=>`
   <div class="order">
    <b>Order #${o.id}</b> — <span class="status">${o.status}</span>
    <p>${o.pickup_address} → ${o.drop_address}</p>
    <p>Charge: ₹${o.total_charge} | ${o.order_type} | ${o.payment_type}</p>
    <button onclick="openTrack(${o.id})">View Timeline</button>
    ${o.status==="FAILED"&&currentUser.role==="customer"?`<button onclick="reschedule(${o.id})">Reschedule</button>`:""}
   </div>`).join(""):"No orders yet.";
 }catch(e){$("orders").textContent=e.message}
}
async function getQuote(){
 try{
  lastQuote=await api("/orders/quote",{method:"POST",body:JSON.stringify({
   pickupAddress:$("pickup").value,dropAddress:$("drop").value,
   length:$("length").value,width:$("width").value,height:$("height").value,
   actualWeight:$("weight").value,orderType:$("orderType").value,paymentType:$("payment").value
  })});
  $("quote").innerHTML=`<div class="order">
   <b>Quote</b><p>Pickup zone: ${lastQuote.pickupZone.name}</p>
   <p>Drop zone: ${lastQuote.dropZone.name}</p>
   <p>Volumetric weight: ${lastQuote.volumetricWeight} kg</p>
   <p>Chargeable weight: ${lastQuote.chargeableWeight} kg</p>
   <p>Route: ${lastQuote.routeType}</p>
   <p>Base: ₹${lastQuote.baseCharge} | COD: ₹${lastQuote.codSurcharge}</p>
   <h3>Total: ₹${lastQuote.totalCharge}</h3></div>`;
  $("confirmOrder").classList.remove("hidden");
 }catch(e){$("quote").textContent=e.message}
}
async function createOrder(){
 try{
  let b={pickupAddress:$("pickup").value,dropAddress:$("drop").value,length:$("length").value,width:$("width").value,height:$("height").value,actualWeight:$("weight").value,orderType:$("orderType").value,paymentType:$("payment").value};
  let d=await api("/orders",{method:"POST",body:JSON.stringify(b)});
  alert("Order created: #"+d.orderId);$("confirmOrder").classList.add("hidden");loadDashboard();showPanel("dashboardPanel");
 }catch(e){alert(e.message)}
}
async function openTrack(id){$("trackId").value=id;showPanel("trackPanel");track();}
async function track(){
 try{
  let d=await api("/orders/"+$("trackId").value);
  $("tracking").innerHTML=`<div class="order"><h3>Order #${d.order.id} — ${d.order.status}</h3>
   <p>${d.order.pickup_address} → ${d.order.drop_address}</p>
   <p>Total: ₹${d.order.total_charge}</p>
   <div class="timeline">${d.tracking.map(t=>`<div class="event"><b>${t.status}</b><br><span class="small">${t.created_at} — ${t.actor_name||"System"}</span><br>${t.note||""}</div>`).join("")}</div></div>`;
 }catch(e){$("tracking").textContent=e.message}
}
async function reschedule(id){
 let date=prompt("Enter new delivery date (YYYY-MM-DD):");
 if(!date)return;
 try{await api("/orders/"+id+"/reschedule",{method:"POST",body:JSON.stringify({newDate:date})});alert("Rescheduled");loadDashboard();}
 catch(e){alert(e.message)}
}
async function loadAdminOrders(){
 showPanel("adminPanel");
 let rows=await api("/admin/orders");
 $("adminContent").innerHTML=`<h3>All Orders</h3>`+rows.map(o=>`<div class="order"><b>#${o.id}</b> ${o.status}<br>${o.customer_name}<br>${o.pickup_zone} → ${o.drop_zone}<br>Agent: ${o.agent_name||"Unassigned"}<br>
 <button onclick="autoAssign(${o.id})">Auto Assign</button></div>`).join("");
}
async function autoAssign(id){try{let d=await api("/orders/"+id+"/auto-assign",{method:"POST"});alert(d.message);loadAdminOrders()}catch(e){alert(e.message)}}
async function loadAgents(){let rows=await api("/admin/agents");$("adminContent").innerHTML=rows.map(a=>`<div class="order"><b>${a.name}</b> — ${a.available?"Available":"Busy"}<br>${a.email}<br>Location: ${a.current_lat||"-"}, ${a.current_lng||"-"}</div>`).join("")}
async function loadZones(){let rows=await api("/admin/zones");$("adminContent").innerHTML=rows.map(z=>`<div class="order"><b>${z.name}</b> — ${z.area_count} configured areas</div>`).join("")}
async function loadRates(){let rows=await api("/admin/rates");$("adminContent").innerHTML=rows.map(r=>`<div class="order">${r.order_type} | ${r.route_type} | ${r.min_weight}-${r.max_weight} kg | ₹${r.base_charge}</div>`).join("")}
async function loadAgentOrders(){
 let rows=await api("/agents/me/orders");
 $("agentOrders").innerHTML=rows.map(o=>`<div class="order"><b>#${o.id}</b> — ${o.status}<br>${o.pickup_address} → ${o.drop_address}
 <select onchange="updateStatus(${o.id},this.value)"><option value="">Update status</option><option>PICKED_UP</option><option>IN_TRANSIT</option><option>OUT_FOR_DELIVERY</option><option>DELIVERED</option><option>FAILED</option></select></div>`).join("");
}
async function updateStatus(id,status){if(!status)return;try{await api("/orders/"+id+"/status",{method:"PUT",body:JSON.stringify({status})});loadAgentOrders()}catch(e){alert(e.message)}}
async function setAvailability(){try{await api("/agents/me/availability",{method:"PUT",body:JSON.stringify({available:$("available").checked})})}catch(e){alert(e.message)}}
function loadAgentPanel(){showPanel("agentPanel");loadAgentOrders();}
if(token&&currentUser){enterApp();}
if(currentUser?.role==="agent") $("agentTab").onclick=loadAgentPanel;
