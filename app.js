const $ = (s) => document.querySelector(s);
const state = { revenueHidden:false, dashboardFilters:{type:"all",product:"all",period:"today"}, chartRange: "7d", page: "overview", products: JSON.parse(localStorage.getItem("cashfy_products") || "[]"), sales: JSON.parse(localStorage.getItem("cashfy_sales") || "[]"), customers: JSON.parse(localStorage.getItem("cashfy_customers") || "[]") };
const money = value => Number(value || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const save = () => { localStorage.setItem("cashfy_products",JSON.stringify(state.products)); localStorage.setItem("cashfy_sales",JSON.stringify(state.sales)); localStorage.setItem("cashfy_customers",JSON.stringify(state.customers)); };
/* Registro demonstrativo único para validar faturamento e histórico */
if(!localStorage.getItem("cashfy_demo_sale_8000")) {
 state.sales.unshift({id:"cashfy-demo-sale-8000",amount:8000,type:"venda",status:"Aprovada",productName:"Venda de teste",dateISO:new Date().toISOString()});
 localStorage.setItem("cashfy_demo_sale_8000","1");
 save();
}
const titles = {overview:["Dashboard","Acompanhe suas vendas e resultados em um só lugar."],products:["Produtos","Cadastre e organize os produtos que você vende."],sales:["Vendas","Acompanhe os pedidos registrados na sua operação."],customers:["Clientes","Consulte os clientes cadastrados na sua base."],settings:["Configurações","Gerencie as informações básicas do seu espaço."]};
function render(){
 const [title,subtitle]=titles[state.page]; $("#crumb").textContent=title; $("#pageTitle").textContent=title; $("#pageSubtitle").textContent=subtitle;
 $("#pageContent").innerHTML=state.page==="overview"?overview():state.page==="products"?productsPage():state.page==="sales"?salesPage():state.page==="customers"?customersPage():settingsPage();
 if(state.page==="overview")bindRevenueChart();
}
function parseSaleDate(s){
 const raw=s.dateISO||s.createdAt||s.timestamp||s.date||s.created_at;if(!raw)return null;
 if(typeof raw==="number"){const d=new Date(raw);return isNaN(d)?null:d;}
 const br=String(raw).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
 const d=br?new Date(Number(br[3]),Number(br[2])-1,Number(br[1])):new Date(raw);return isNaN(d)?null:d;
}
function chartBuckets(range){
 const today=new Date();today.setHours(0,0,0,0);
 const step=range==="12m"?"month":range==="90d"?"week":"day";
 const count=range==="7d"?7:range==="30d"?30:12,buckets=[];
 for(let i=0;i<count;i++){
  const from=new Date(today);
  if(step==="day")from.setDate(today.getDate()+i);
  if(step==="week")from.setDate(today.getDate()+i*7);
  if(step==="month"){from.setDate(1);from.setMonth(today.getMonth()+i);}
  const to=new Date(from);
  if(step==="day")to.setHours(23,59,59,999);
  if(step==="week"){to.setDate(to.getDate()+6);to.setHours(23,59,59,999);}
  if(step==="month"){to.setMonth(to.getMonth()+1);to.setDate(0);to.setHours(23,59,59,999);}
  const amount=state.sales.reduce((sum,s)=>{const d=parseSaleDate(s);return d&&d>=from&&d<=to?sum+Number(s.amount||s.total||s.price||0):sum;},0);
  buckets.push({from,to,amount,label:step==="month"?from.toLocaleDateString("pt-BR",{month:"short"}):step==="week"?"Sem "+from.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"}):from.toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"})});
 }
 return buckets;
}
function chartGeometry(values){
 const max=Math.max(1,...values),pts=values.map((v,i)=>({x:12+i*696/Math.max(1,values.length-1),y:198-(v/max)*176}));
 let line="M "+pts[0].x+" "+pts[0].y;
 for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];line+=" Q "+((a.x+b.x)/2)+" "+a.y+" "+b.x+" "+b.y;}
 return {pts,line,area:line+" L "+pts[pts.length-1].x+" 198 L "+pts[0].x+" 198 Z"};
}
function filteredDashboardSales(){
 const f=state.dashboardFilters||{type:"all",product:"all",period:"today"};
 const now=new Date();now.setHours(0,0,0,0);
 const start=new Date(now);
 if(f.period==="7d")start.setDate(start.getDate()-6);
 else if(f.period==="30d")start.setDate(start.getDate()-29);
 else if(f.period==="month")start.setDate(1);
 return state.sales.filter(s=>{
  if(f.product!=="all"){
   const product=String(s.productId||s.product_id||s.productName||s.product_name||s.product||"");
   if(product!==String(f.product))return false;
  }
  if(f.type!=="all"){
   const type=String(s.type||s.status||"venda").toLowerCase();
   if(f.type==="sale"&&!/(venda|sale|paid|aprov)/.test(type))return false;
   if(f.type==="refund"&&!/(reembolso|estorno|refund)/.test(type))return false;
  }
  if(f.period!=="all"){
   const d=parseSaleDate(s);if(!d)return false;d.setHours(0,0,0,0);
   if(d<start||d>now)return false;
  }
  return true;
 });
}
function overview(){
 const sales=filteredDashboardSales();
 const total=sales.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
 const range=state.chartRange||"7d",buckets=chartBuckets(range),values=buckets.map(b=>b.amount),geo=chartGeometry(values),hasSales=values.some(v=>v>0);
 const rangeLabel={"7d":"Últimos 7 dias","30d":"Últimos 30 dias","90d":"Últimas 12 semanas","12m":"Últimos 12 meses"}[range];
 const ticks=[0,1,2,3].map(i=>'<line x1="12" y1="'+(22+i*58)+'" x2="708" y2="'+(22+i*58)+'" stroke="#29243a" stroke-dasharray="3 6"/>').join("");
 const inds=[0,Math.floor((buckets.length-1)/3),Math.floor(2*(buckets.length-1)/3),buckets.length-1].filter((v,i,a)=>a.indexOf(v)===i);
 const labels=inds.map(i=>'<span>'+buckets[i].label+'</span>').join("");
 const px=geo.pts[geo.pts.length-1].x,py=geo.pts[geo.pts.length-1].y;
 const f=state.dashboardFilters;
 const productOptions=[["all","Todos os produtos"],...state.products.map(p=>[String(p.id),p.name])];
 const typeOptions=[["all","Todos"],["sale","Vendas"],["refund","Reembolsos"]];
 const periodOptions=[["today","Hoje"],["7d","Últimos 7 dias"],["30d","Últimos 30 dias"],["month","Este mês"],["all","Todo o período"]];
 const dropdown=(label,key,options)=>'<div class="filter-field"><span class="filter-label">'+label+'</span><div class="custom-select" data-custom-select="'+key+'"><button class="custom-select-trigger" type="button" aria-expanded="false"><span>'+escapeHtml((options.find(o=>o[0]===String(f[key]))||options[0])[1])+'</span><i></i></button><div class="custom-select-menu" hidden>'+options.map(o=>'<button type="button" class="custom-select-option '+(String(f[key])===o[0]?"selected":"")+'" data-filter-key="'+key+'" data-filter-value="'+escapeHtml(o[0])+'">'+escapeHtml(o[1])+(String(f[key])===o[0]?'<span>✓</span>':'')+'</button>').join("")+'</div></div></div>';
 return '<section class="dashboard-filters">'+dropdown("Tipo","type",typeOptions)+dropdown("Produtos","product",productOptions)+dropdown("Período","period",periodOptions)+'<button class="dashboard-update" id="updateDashboard" type="button"><span>Atualizar</span><i>↻</i></button></section><div class="stats dashboard-summary"><article class="stat-card stat-card-primary"><div class="stat-top">Vendas realizadas <button class="visibility-btn '+(state.revenueHidden?"is-hidden":"")+'" id="toggleRevenueVisibility" type="button" aria-label="'+(state.revenueHidden?"Mostrar vendas realizadas":"Ocultar vendas realizadas")+'" aria-pressed="'+(state.revenueHidden?"true":"false")+'" title="'+(state.revenueHidden?"Mostrar valor":"Ocultar valor")+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/><path class="eye-slash" d="M3 3 21 21"/></svg></button></div><div class="stat-value revenue-private '+(state.revenueHidden?"blurred":"")+'">'+money(total)+'</div><div class="stat-note">Total no período selecionado</div></article><article class="stat-card quantity-card"><div class="stat-top">Quantidade de vendas <span class="stat-icon">▤</span></div><div class="stat-value">'+sales.length+'</div><div class="stat-note">Vendas no filtro selecionado</div></article></div><section class="panel revenue-panel"><div class="panel-head revenue-head"><div><p class="eyebrow">DESEMPENHO</p><h3>Faturamento</h3><div class="revenue-total" id="chartRevenue">'+money(values.reduce((a,b)=>a+b,0))+'</div><span class="muted" id="chartDate">'+rangeLabel+'</span></div><div class="range-tabs" role="group" aria-label="Período do gráfico">'+[["7d","7 dias"],["30d","30 dias"],["90d","12 semanas"],["12m","12 meses"]].map(([v,t])=>'<button class="range-btn '+(range===v?"active":"")+'" data-range="'+v+'">'+t+'</button>').join("")+'</div></div><div class="revenue-chart-wrap" id="revenueChartWrap"><svg class="revenue-chart" id="revenueChart" viewBox="0 0 720 220" preserveAspectRatio="none" role="img" aria-label="Gráfico de faturamento por período"><defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#a879ff" stop-opacity=".42"/><stop offset="100%" stop-color="#8d5aff" stop-opacity=".015"/></linearGradient><linearGradient id="revenueStroke" x1="0" x2="1"><stop stop-color="#8e5cff"/><stop offset="100%" stop-color="#c2a3ff"/></linearGradient></defs>'+ticks+'<path class="revenue-area" d="'+(hasSales?geo.area:"")+'" fill="url(#revenueFill)"/><path class="revenue-line" d="'+geo.line+'" fill="none" stroke="url(#revenueStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line id="chartCrosshair" x1="'+px+'" x2="'+px+'" y1="15" y2="200" stroke="#c6a8ff" stroke-width="1" stroke-dasharray="4 5" opacity="0"/><circle id="chartDot" cx="'+px+'" cy="'+py+'" r="5" fill="#c19aff" stroke="#171024" stroke-width="3" opacity="0"/></svg><div class="chart-tooltip" id="chartTooltip" hidden></div></div><div class="chart-xlabels">'+labels+'</div><div class="chart-foot"><span><i class="legend-dot"></i> Faturamento por período</span><span>'+(hasSales?"Arraste no gráfico para consultar":"Suas vendas registradas aparecerão aqui")+'</span></div></section><div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>Comece por aqui</h3><span class="muted">Primeiros passos</span></div><div class="empty-state"><div class="empty-icon">✦</div><strong>Monte sua operação</strong><p>Cadastre seu primeiro produto para começar a organizar seu catálogo.</p><button class="primary-btn" data-action="new-product">Cadastrar produto</button></div></section></div><section class="panel table-panel"><div class="panel-head"><h3>Produtos recentes</h3><button class="text-btn" data-page="products">Ver todos</button></div>'+productTable(5)+'</section>';
}
function bindRevenueChart(){
 const svg=$("#revenueChart");if(!svg)return;
 const buckets=chartBuckets(state.chartRange||"7d"),values=buckets.map(b=>b.amount),max=Math.max(1,...values);
 const cross=$("#chartCrosshair"),dot=$("#chartDot"),tip=$("#chartTooltip"),revenue=$("#chartRevenue"),date=$("#chartDate");let active=false;
 const clearSelection=()=>{
  active=false;cross.setAttribute("opacity","0");dot.setAttribute("opacity","0");tip.hidden=true;
  revenue.textContent=money(values.reduce((sum,v)=>sum+v,0));
  date.textContent=({"7d":"Últimos 7 dias","30d":"Últimos 30 dias","90d":"Últimas 12 semanas","12m":"Últimos 12 meses"}[state.chartRange||"7d"]);
 };
 const selectAt=e=>{
  const rect=svg.getBoundingClientRect(),x=Math.max(0,Math.min(720,(e.clientX-rect.left)/rect.width*720)),idx=Math.max(0,Math.min(buckets.length-1,Math.round(x/720*(buckets.length-1))));
  const px=12+idx*696/Math.max(1,buckets.length-1),py=198-(values[idx]/max)*176,b=buckets[idx];
  cross.setAttribute("x1",px);cross.setAttribute("x2",px);cross.setAttribute("opacity","1");dot.setAttribute("cx",px);dot.setAttribute("cy",py);dot.setAttribute("opacity","1");
  revenue.textContent=money(b.amount);date.textContent=b.from.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"})+(b.to.getDate()!==b.from.getDate()?" — "+b.to.toLocaleDateString("pt-BR",{day:"2-digit",month:"long"}):"");
  tip.hidden=false;tip.textContent=money(b.amount);tip.style.left=Math.max(3,Math.min(82,px/720*100))+"%";
 };
 svg.addEventListener("pointerdown",e=>{active=true;svg.setPointerCapture(e.pointerId);selectAt(e);});
 svg.addEventListener("pointermove",e=>{if(active||e.pointerType==="mouse")selectAt(e);});
 svg.addEventListener("pointerup",clearSelection);svg.addEventListener("pointercancel",clearSelection);svg.addEventListener("pointerleave",e=>{if(e.pointerType==="mouse"&&!active)clearSelection();});
}

function productTable(limit=100){if(!state.products.length)return '<div class="empty-row">Nenhum produto cadastrado ainda.</div>';return `<div class="table-wrap"><table><thead><tr><th>PRODUTO</th><th>PREÇO</th><th>STATUS</th><th>CADASTRO</th><th></th></tr></thead><tbody>${state.products.slice(0,limit).map(p=>`<tr><td><span class="product-title">${escapeHtml(p.name)}</span><span class="product-sub">${escapeHtml(p.description||"Sem descrição")}</span></td><td>${money(p.price)}</td><td><span class="pill">Ativo</span></td><td>${p.date}</td><td><button class="text-btn" data-delete="${p.id}">Excluir</button></td></tr>`).join("")}</tbody></table></div>`}
function productsPage(){return `<section class="panel table-panel"><div class="panel-head"><h3>Todos os produtos</h3><span class="muted">${state.products.length} produto(s)</span></div>${productTable()}</section>`}
function salesPage(){return `<section class="panel table-panel"><div class="panel-head"><h3>Histórico de vendas</h3><span class="muted">${state.sales.length} registro(s)</span></div>${state.sales.length?`<div class="table-wrap"><table><thead><tr><th>REGISTRO</th><th>VALOR</th><th>STATUS</th><th>DATA</th></tr></thead><tbody>${state.sales.map(s=>{const d=parseSaleDate(s);return `<tr><td><span class="product-title">${escapeHtml(s.productName||s.product_name||"Venda")}</span></td><td>${money(s.amount||s.total||s.price||0)}</td><td><span class="pill">${escapeHtml(s.status||"Registrada")}</span></td><td>${d?d.toLocaleString("pt-BR"):"—"}</td></tr>`}).join("")}</tbody></table></div>`:`<div class="empty-state"><div class="empty-icon">↗</div><strong>Nenhuma venda registrada</strong><p>Os registros de venda aparecerão aqui quando o checkout for integrado.</p></div>`}</section>`}
function customersPage(){return `<section class="panel"><div class="panel-head"><h3>Base de clientes</h3><span class="muted">${state.customers.length} cliente(s)</span></div><div class="empty-state"><div class="empty-icon">♙</div><strong>Nenhum cliente cadastrado</strong><p>Os clientes serão adicionados quando o cadastro e o checkout estiverem conectados.</p></div></section>`}
function settingsPage(){return `<section class="panel"><div class="panel-head"><h3>Minha operação</h3></div><p class="muted">Cashfy — painel em desenvolvimento.</p><p class="muted">Os dados desta primeira versão ficam salvos neste navegador. Ainda não existe conta, banco de dados ou sincronização entre dispositivos.</p></section>`}
function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function openModal(){$("#modal").hidden=false;$("#productForm").reset();$("#productForm").elements.name.focus();}
function closeModal(){$("#modal").hidden=true;}
document.addEventListener("click",e=>{
 const range=e.target.closest("[data-range]");if(range){state.chartRange=range.dataset.range;render();return;}
 if(!e.target.closest(".custom-select")){document.querySelectorAll(".custom-select-menu").forEach(m=>m.hidden=true);document.querySelectorAll(".custom-select-trigger").forEach(b=>b.setAttribute("aria-expanded","false"));}
 const trigger=e.target.closest(".custom-select-trigger");if(trigger){const wrap=trigger.closest(".custom-select");const wasOpen=!wrap.querySelector(".custom-select-menu").hidden;document.querySelectorAll(".custom-select-menu").forEach(m=>m.hidden=true);document.querySelectorAll(".custom-select-trigger").forEach(b=>b.setAttribute("aria-expanded","false"));if(!wasOpen){wrap.querySelector(".custom-select-menu").hidden=false;trigger.setAttribute("aria-expanded","true");}return;}
 const option=e.target.closest(".custom-select-option");if(option){const wrap=option.closest(".custom-select");const key=option.dataset.filterKey;state.dashboardFilters[key]=option.dataset.filterValue;wrap.querySelector(".custom-select-trigger span").textContent=option.textContent.replace("✓","").trim();wrap.querySelectorAll(".custom-select-option").forEach(b=>{b.classList.toggle("selected",b===option);const mark=b.querySelector("span");if(mark)mark.remove();if(b===option)b.insertAdjacentHTML("beforeend","<span>✓</span>");});wrap.querySelector(".custom-select-menu").hidden=true;wrap.querySelector(".custom-select-trigger").setAttribute("aria-expanded","false");return;}
 const update=e.target.closest("#updateDashboard");if(update){render();return;}
 const nav=e.target.closest("[data-page]");if(nav){state.page=nav.dataset.page;document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page===state.page));render();$("#sidebar").classList.remove("open");}
 const visibility=e.target.closest("#toggleRevenueVisibility");if(visibility){state.revenueHidden=!state.revenueHidden;const value=$(".revenue-private");value.classList.toggle("blurred",state.revenueHidden);visibility.classList.toggle("is-hidden",state.revenueHidden);visibility.setAttribute("aria-pressed",String(state.revenueHidden));visibility.setAttribute("aria-label",state.revenueHidden?"Mostrar faturamento":"Ocultar faturamento");visibility.title=state.revenueHidden?"Mostrar faturamento":"Ocultar faturamento";return;}
 if(e.target.closest('[data-action="new-product"]'))openModal();
 const del=e.target.closest("[data-delete]");if(del&&confirm("Excluir este produto?")){state.products=state.products.filter(p=>p.id!==del.dataset.delete);save();render();}
});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const data=new FormData(e.currentTarget);state.products.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:data.get("name").trim(),price:Number(data.get("price")),description:data.get("description").trim(),date:new Date().toLocaleDateString("pt-BR")});save();closeModal();state.page="products";document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page==="products"));render();});
$("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
render();