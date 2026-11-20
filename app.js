const $ = (s) => document.querySelector(s);
let introFinished=false;
const state = { revenueHidden:false, dashboardFilters:{type:"all",product:"all",period:"today"}, chartRange: "7d", page: "overview", products: JSON.parse(localStorage.getItem("cashfy_products") || "[]"), sales: JSON.parse(localStorage.getItem("cashfy_sales") || "[]"), customers: JSON.parse(localStorage.getItem("cashfy_customers") || "[]") };
const money = value => Number(value || 0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const save = () => { localStorage.setItem("cashfy_products",JSON.stringify(state.products)); localStorage.setItem("cashfy_sales",JSON.stringify(state.sales)); localStorage.setItem("cashfy_customers",JSON.stringify(state.customers)); };
/* Registro demonstrativo único para validar faturamento e histórico */
if(!localStorage.getItem("cashfy_demo_sale_8000")) {
 state.sales.unshift({id:"cashfy-demo-sale-8000",amount:8000,type:"venda",status:"Aprovada",productName:"Venda de teste",dateISO:new Date().toISOString()});
 localStorage.setItem("cashfy_demo_sale_8000","1");
 save();
}
const titles = {
 overview:["Dashboard","Acompanhe suas vendas e resultados em um só lugar."],
 products:["Produtos","Cadastre e organize os produtos que você vende."],
 sales:["Vendas","Acompanhe os pedidos registrados na sua operação."],
 customers:["Clientes","Consulte os clientes cadastrados na sua base."],
 subscriptions:["Assinaturas","Gerencie cobranças recorrentes e planos."],
 refunds:["Reembolsos","Acompanhe solicitações e status de reembolso."],
 affiliates:["Afiliados","Organize parceiros e comissões de divulgação."],
 coupons:["Cupons","Crie e acompanhe cupons de desconto."],
 checkout:["Checkout","Configure a experiência de pagamento dos seus clientes."],
 balance:["Saldo e saques","Consulte saldo disponível e solicitações de saque."],
 transactions:["Transações","Consulte movimentações financeiras da operação."],
 reports:["Relatórios","Acompanhe indicadores e resultados da sua operação."],
 integrations:["Integrações","Conecte serviços usados pela sua operação."],
 settings:["Configurações","Gerencie as informações básicas do seu espaço."]
};
function modulePage(page){
 const details={
  subscriptions:["Cobranças recorrentes","Planos, periodicidade e situação das assinaturas."],
  refunds:["Solicitações de reembolso","Acompanhe pedidos, motivos e andamento."],
  affiliates:["Programa de afiliados","Parceiros, links de divulgação e comissões."],
  coupons:["Descontos e campanhas","Cupons, regras de uso e validade."],
  checkout:["Página de pagamento","Aparência, campos e opções de pagamento."],
  balance:["Visão financeira","Saldo disponível, valores pendentes e saques."],
  transactions:["Extrato de movimentações","Entradas, saídas, taxas e status."],
  reports:["Desempenho da operação","Vendas, conversão, faturamento e produtos."],
  integrations:["Conexões disponíveis","Serviços externos e chaves de integração."]
 };
 const item=details[page];
 return '<section class="module-grid"><article class="panel module-card"><p class="eyebrow">CASHFY • '+escapeHtml(titles[page][0].toUpperCase())+'</p><h3>'+escapeHtml(item[0])+'</h3><p class="muted">'+escapeHtml(item[1])+'</p><div class="module-status"><span class="module-status-dot"></span> Área visual em preparação</div></article><article class="panel module-card"><h3>Integração necessária</h3><p class="muted">Esta área já está organizada no painel. As operações reais serão ativadas quando os serviços de pagamento e a estrutura de dados forem conectados.</p></article></section>';
}
function render(){
 const current=titles[state.page]?state.page:"overview";
 if(current!==state.page)state.page="overview";
 const [title,subtitle]=titles[current]; $("#crumb").textContent=title; $("#pageTitle").textContent=title; $("#pageSubtitle").textContent=subtitle;
 $("#pageContent").innerHTML=current==="overview"?overview():current==="products"?productsPage():current==="sales"?salesPage():current==="customers"?customersPage():current==="settings"?settingsPage():modulePage(current);
 if(current==="overview")bindRevenueChart();
 if(introFinished)startRevealSequence();
}

function startRevealSequence(){
 const groups=[
  ...Array.from(document.querySelectorAll(".sidebar > *")),
  ...Array.from(document.querySelectorAll(".topbar > *")),
  ...Array.from(document.querySelectorAll(".content > .cashfy-hero, .content > .page-heading, #pageContent > *, .content > footer"))
 ];
 groups.forEach((el,i)=>{
  el.classList.remove("cashfy-reveal");
  el.style.setProperty("--reveal-delay",(i*85)+"ms");
  void el.offsetWidth;
  el.classList.add("cashfy-reveal");
 });
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
 const rangeLabel={"7d":"Próximos 7 dias","30d":"Próximos 30 dias","90d":"Próximas 12 semanas","12m":"Próximos 12 meses"}[range];
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
const settingsDefaults={
 accountName:"Conta de teste",accountEmail:"",accountPhone:"",accountPhoto:"",accountLanguage:"pt-BR",
 companyName:"",tradeName:"",documentType:"CPF",documentNumber:"",birthDate:"",companyEmail:"",companyPhone:"",companyWebsite:"",companySegment:"",companyAddress:"",companyNumber:"",companyComplement:"",companyDistrict:"",companyCity:"",companyState:"SP",companyZip:"",
 bankName:"",bankCode:"",bankAgency:"",bankAccount:"",bankAccountType:"corrente",pixKey:"",payoutSchedule:"manual",payoutMinimum:"10",autoPayout:false,
 pixEnabled:true,cardEnabled:true,boletoEnabled:false,installmentsEnabled:true,maxInstallments:"12",minPayment:"5",maxPayment:"50000",acceptInternational:false,saveCard:false,
 pixFee:"0.99",cardFee:"4.99",boletoFee:"3.49",installmentFee:"2.99",refundFee:"0",chargebackFee:"0",settlementDays:"D+30",anticipationEnabled:false,
 checkoutName:"Checkout Cashfy",checkoutHeadline:"Finalize sua compra com segurança",checkoutDescription:"",checkoutLogo:"",checkoutColor:"#9565ff",checkoutBackground:"#0d0a16",checkoutButtonText:"Finalizar compra",checkoutRedirect:"",checkoutCancelRedirect:"",checkoutPhoneRequired:true,checkoutAddressRequired:false,checkoutCpfRequired:true,checkoutTermsRequired:true,checkoutCouponEnabled:true,checkoutBump:false,checkoutOnePage:true,
 fraudEnabled:true,fraudReview:"medium",blockVpn:false,blockPrepaid:false,maxAttempts:"5",refundWindow:"7",
 notifyEmail:"",notifyWhatsapp:"",notifyApproved:true,notifyRefused:true,notifyPending:true,notifyRefund:true,notifyChargeback:true,notifyWithdraw:true,notifyNewCustomer:false,notifyDailyReport:false,
 twoFactor:false,sessionAlerts:true,loginAlerts:true,apiEnvironment:"sandbox",webhookUrl:"",webhookEvents:"payment.approved,payment.refused,refund.created",apiKeyLabel:"",googleAnalytics:"",metaPixel:"",
 theme:"dark",currency:"BRL",timezone:"America/Sao_Paulo",dateFormat:"DD/MM/YYYY",compactNumbers:false,
 taxDocumentEnabled:false,taxBusinessName:"",taxDocumentNumber:"",taxMunicipalRegistration:"",taxServiceCode:"",taxEmail:"",
 supportEmail:"",supportWhatsapp:"",supportHours:"",termsUrl:"",privacyUrl:"",refundPolicyUrl:"",dataExportRequested:false
};
let cashfySettings={...settingsDefaults,...JSON.parse(localStorage.getItem("cashfy_settings")||"{}")};
const settingOptions={
 accountLanguage:[["pt-BR","Português (Brasil)"]],
 documentType:[["CPF","CPF"],["CNPJ","CNPJ"]],
 companySegment:[["digital","Produtos digitais"],["physical","Produtos físicos"],["services","Serviços"],["education","Educação e cursos"],["other","Outro"]],
 bankAccountType:[["corrente","Conta corrente"],["poupanca","Conta poupança"]],
 payoutSchedule:[["manual","Solicitação manual"],["daily","Diariamente (quando disponível)"],["weekly","Semanalmente"]],
 settlementDays:[["D+1","D+1"],["D+7","D+7"],["D+14","D+14"],["D+30","D+30"]],
 maxInstallments:[["1","À vista"],["2","2x"],["3","3x"],["6","6x"],["10","10x"],["12","12x"],["18","18x"]],
 fraudReview:[["low","Mais flexível"],["medium","Equilibrado"],["high","Mais rigoroso"]],
 refundWindow:[["7","7 dias"],["14","14 dias"],["30","30 dias"],["custom","Definido pela política"]],
 apiEnvironment:[["sandbox","Sandbox (testes)"],["production","Produção"]],
 theme:[["dark","Escuro"],["light","Claro"],["system","Seguir dispositivo"]],
 currency:[["BRL","Real brasileiro (BRL)"]],
 timezone:[["America/Sao_Paulo","Brasília (GMT-3)"],["America/Manaus","Manaus (GMT-4)"],["America/Rio_Branco","Rio Branco (GMT-5)"]],
 dateFormat:[["DD/MM/YYYY","DD/MM/AAAA"],["YYYY-MM-DD","AAAA-MM-DD"]],
 companyState:["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(v=>[v,v])
};
function settingField(label,key,type,placeholder,note){
 type=type||"text";const value=cashfySettings[key]??"";let control="";
 if(type==="select"){
  const options=settingOptions[key]||[];
  control='<select class="settings-input" name="'+key+'" data-setting="'+key+'">'+options.map(o=>'<option value="'+o[0]+'" '+(String(value)===o[0]?"selected":"")+'>'+o[1]+'</option>').join("")+'</select>';
 }else if(type==="textarea"){
  control='<textarea class="settings-input" rows="3" name="'+key+'" data-setting="'+key+'" placeholder="'+escapeHtml(placeholder||"")+'">'+escapeHtml(value)+'</textarea>';
 }else{
  control='<input class="settings-input" type="'+type+'" name="'+key+'" data-setting="'+key+'" value="'+escapeHtml(value)+'" placeholder="'+escapeHtml(placeholder||"")+'">';
 }
 return '<label class="settings-field"><span>'+label+'</span>'+control+(note?'<small>'+note+'</small>':"")+'</label>';
}
function settingToggle(label,key,note){
 return '<label class="settings-toggle"><span><strong>'+label+'</strong>'+(note?'<small>'+note+'</small>':"")+'</span><input type="checkbox" name="'+key+'" data-setting="'+key+'" '+(cashfySettings[key]?"checked":"")+'><i></i></label>';
}
function settingsCard(icon,title,description,content){
 return '<section class="panel settings-card"><div class="settings-card-head"><span class="settings-icon">'+icon+'</span><div><h3>'+title+'</h3><p>'+description+'</p></div></div>'+content+'</section>';
}
function settingsPage(){
 const cards=[
 settingsCard("♙","Minha conta e acesso","Identificação, contato e idioma da sua conta.",'<div class="settings-fields">'+settingField("Nome de exibição","accountName")+settingField("E-mail principal","accountEmail","email","seu@email.com")+settingField("Telefone","accountPhone","tel","(11) 99999-9999")+settingField("Idioma","accountLanguage","select")+'</div><p class="settings-note">Alteração de e-mail, senha e recuperação de acesso exigem autenticação no servidor.</p>'),
 settingsCard("▣","Empresa e verificação cadastral","Dados do titular, endereço e informações comerciais.",'<div class="settings-fields">'+settingField("Razão social / nome completo","companyName")+settingField("Nome fantasia","tradeName")+settingField("Tipo de documento","documentType","select")+settingField("CPF ou CNPJ","documentNumber")+settingField("Data de nascimento / abertura","birthDate","date")+settingField("Segmento","companySegment","select")+settingField("E-mail comercial","companyEmail","email")+settingField("Telefone comercial","companyPhone","tel")+settingField("Site da empresa","companyWebsite","url","https://")+settingField("CEP","companyZip")+settingField("Endereço","companyAddress")+settingField("Número","companyNumber")+settingField("Complemento","companyComplement")+settingField("Bairro","companyDistrict")+settingField("Cidade","companyCity")+settingField("Estado","companyState","select")+'</div><div class="settings-status"><b>●</b> Verificação de identidade pendente de integração KYC</div><p class="settings-note">Documentos pessoais e comprovantes devem ser enviados por fluxo seguro do backend, nunca armazenados neste navegador.</p>'),
 settingsCard("▤","Conta bancária, recebimentos e saques","Dados de destino e preferências de repasse.",'<div class="settings-fields">'+settingField("Banco","bankName","text","Nome da instituição")+settingField("Código do banco","bankCode")+settingField("Agência","bankAgency")+settingField("Conta e dígito","bankAccount")+settingField("Tipo de conta","bankAccountType","select")+settingField("Chave Pix","pixKey")+settingField("Forma de repasse","payoutSchedule","select")+settingField("Valor mínimo para saque (R$)","payoutMinimum","number","10")+'</div>'+settingToggle("Solicitar repasse automático","autoPayout","Disponível somente após integração bancária e aprovação da conta.")+'<div class="settings-status"><b>●</b> Conta bancária não verificada — saques desativados</div>'),
 settingsCard("＄","Meios de pagamento","Métodos que poderão ser oferecidos ao comprador.",settingToggle("Pix","pixEnabled","Confirmação automática depende da API Pix do provedor.")+settingToggle("Cartão de crédito","cardEnabled","Depende de adquirente, tokenização e antifraude.")+settingToggle("Boleto bancário","boletoEnabled","Depende de emissão e conciliação bancária.")+settingToggle("Permitir parcelamento","installmentsEnabled")+settingToggle("Aceitar cartões internacionais","acceptInternational","Sujeito ao contrato e às regras do adquirente.")+settingToggle("Permitir salvar cartão","saveCard","Exige tokenização PCI; nunca armazene número ou CVV no Cashfy.")+'<div class="settings-fields">'+settingField("Máximo de parcelas","maxInstallments","select")+settingField("Valor mínimo por cobrança (R$)","minPayment","number")+settingField("Valor máximo por cobrança (R$)","maxPayment","number")+'</div>'),
 settingsCard("%","Taxas, tarifas e prazos","Tabela de referência para simulação. Não representa taxas contratadas.",'<div class="settings-fields">'+settingField("Taxa Pix (%)","pixFee","number")+settingField("Taxa cartão (%)","cardFee","number")+settingField("Taxa boleto (R$)","boletoFee","number")+settingField("Adicional por parcela (%)","installmentFee","number")+settingField("Tarifa de reembolso (R$)","refundFee","number")+settingField("Tarifa de contestação (R$)","chargebackFee","number")+settingField("Prazo estimado de recebimento","settlementDays","select")+'</div>'+settingToggle("Habilitar antecipação de recebíveis","anticipationEnabled","Requer contrato, análise de risco e cálculo real pelo provedor.")+'<p class="settings-note">As tarifas oficiais, retenções, reservas e datas de liquidação devem vir do contrato e da API do processador.</p>'),
 settingsCard("▣","Checkout e experiência de compra","Personalização da página de pagamento e dados do comprador.",'<div class="settings-fields">'+settingField("Nome no checkout","checkoutName")+settingField("Título da página","checkoutHeadline")+settingField("Descrição / instruções","checkoutDescription","textarea","Informações para o comprador")+settingField("URL da logo","checkoutLogo","url","https://")+settingField("Cor dos botões","checkoutColor","color")+settingField("Cor de fundo","checkoutBackground","color")+settingField("Texto do botão","checkoutButtonText")+settingField("Redirecionamento após aprovação","checkoutRedirect","url","https://")+settingField("Redirecionamento após cancelamento","checkoutCancelRedirect","url","https://")+'</div>'+settingToggle("Solicitar telefone","checkoutPhoneRequired")+settingToggle("Solicitar endereço","checkoutAddressRequired")+settingToggle("Solicitar CPF","checkoutCpfRequired")+settingToggle("Exigir aceite dos termos","checkoutTermsRequired")+settingToggle("Exibir campo de cupom","checkoutCouponEnabled")+settingToggle("Checkout em uma página","checkoutOnePage")+settingToggle("Oferecer order bump","checkoutBump","Oferta adicional; precisa de implementação de checkout e cobrança.") ),
 settingsCard("↗","Pós-venda e recuperação","Regras de comunicação e recursos comerciais.",'<div class="settings-fields">'+settingField("Prazo de referência para reembolso","refundWindow","select")+'</div><p class="settings-note">Upsell, recuperação de carrinho, recuperação de Pix e assinaturas precisam de fluxos próprios conectados ao checkout e ao provedor.</p><div class="settings-status"><b>●</b> Automações ainda não conectadas</div>'),
 settingsCard("⬡","Antifraude e prevenção a riscos","Preferências iniciais de análise e revisão de transações.",settingToggle("Habilitar análise antifraude","fraudEnabled","A análise efetiva depende de serviço antifraude integrado.")+'<div class="settings-fields">'+settingField("Nível de revisão","fraudReview","select")+settingField("Máximo de tentativas","maxAttempts","number")+'</div>'+settingToggle("Bloquear conexões via VPN","blockVpn","Sinal de risco; não garante prevenção isoladamente.")+settingToggle("Bloquear cartões pré-pagos","blockPrepaid","Aplicação depende do retorno do adquirente.")+'<p class="settings-note">Regras não substituem monitoramento, análise de chargeback e políticas do provedor.</p>'),
 settingsCard("♧","Notificações e relatórios","Escolha alertas e endereço de recebimento.",'<div class="settings-fields">'+settingField("E-mail de notificações","notifyEmail","email","alertas@empresa.com")+settingField("WhatsApp para alertas","notifyWhatsapp","tel","(11) 99999-9999")+'</div>'+settingToggle("Pagamento aprovado","notifyApproved")+settingToggle("Pagamento recusado","notifyRefused")+settingToggle("Pagamento pendente","notifyPending")+settingToggle("Reembolso","notifyRefund")+settingToggle("Contestação / chargeback","notifyChargeback")+settingToggle("Saque e repasse","notifyWithdraw")+settingToggle("Novo cliente","notifyNewCustomer")+settingToggle("Resumo diário de vendas","notifyDailyReport")),
 settingsCard("♢","Segurança da conta","Controles que serão ativados com autenticação real.",settingToggle("Autenticação em duas etapas","twoFactor","Requer provedor de autenticação e códigos de recuperação.")+settingToggle("Avisar sobre novo dispositivo","sessionAlerts")+settingToggle("Alertas de tentativas de acesso","loginAlerts")+'<div class="settings-status"><b>●</b> Senhas, sessões ativas, dispositivos confiáveis e recuperação de conta exigem backend de autenticação.</div><p class="settings-note">Não informe senhas, códigos de autenticação ou dados completos de cartão nesta página.</p>'),
 settingsCard("⌘","API, webhooks e integrações","Preparação de conexões com sistemas externos.",'<div class="settings-fields">'+settingField("Ambiente","apiEnvironment","select")+settingField("Nome da chave (identificação)","apiKeyLabel")+settingField("URL de webhook","webhookUrl","url","https://seu-dominio.com/webhook")+settingField("Eventos de webhook","webhookEvents","textarea","payment.approved, refund.created")+settingField("Google Analytics ID","googleAnalytics")+settingField("Meta Pixel ID","metaPixel")+'</div><div class="settings-status"><b>●</b> API, assinaturas de webhook e integrações não conectadas</div><p class="settings-note">Chaves secretas devem ser geradas e guardadas exclusivamente no servidor. Webhooks precisam de assinatura, repetição segura e registro de entregas.</p>'),
 settingsCard("◐","Preferências da plataforma","Idioma, moeda, fuso e aparência do painel.",'<div class="settings-fields">'+settingField("Tema","theme","select")+settingField("Moeda","currency","select")+settingField("Fuso horário","timezone","select")+settingField("Formato de data","dateFormat","select")+'</div>'+settingToggle("Números compactos nos relatórios","compactNumbers")),
 settingsCard("▧","Dados fiscais e documentos","Informações fiscais para futura emissão de documentos.",settingToggle("Habilitar emissão fiscal","taxDocumentEnabled","Exige integração fiscal e validação contábil.")+'<div class="settings-fields">'+settingField("Nome / razão social fiscal","taxBusinessName")+settingField("CPF / CNPJ fiscal","taxDocumentNumber")+settingField("Inscrição municipal","taxMunicipalRegistration")+settingField("Código de serviço","taxServiceCode")+settingField("E-mail para documentos","taxEmail","email")+'</div><p class="settings-note">O Cashfy não emite notas fiscais nesta versão. Consulte a contabilidade sobre as obrigações aplicáveis.</p>'),
 settingsCard("§","Suporte, políticas e privacidade","Canais de atendimento, documentos legais e dados.",'<div class="settings-fields">'+settingField("E-mail de suporte","supportEmail","email","suporte@cashfy.com")+settingField("WhatsApp de suporte","supportWhatsapp","tel")+settingField("Horário de atendimento","supportHours")+settingField("Termos de uso (URL)","termsUrl","url","https://")+settingField("Política de privacidade (URL)","privacyUrl","url","https://")+settingField("Política de reembolso (URL)","refundPolicyUrl","url","https://")+'</div>'+settingToggle("Solicitar exportação dos meus dados","dataExportRequested","A exportação real precisa ser processada pelo backend.")+'<p class="settings-note">Exclusão de conta, portabilidade e solicitações LGPD devem ter fluxo autenticado, registro e confirmação.</p>')
 ];
 return '<div class="settings-intro"><div><span class="settings-live-dot"></span><strong>Central de configurações</strong><p>Gerencie cadastro, pagamentos, checkout, segurança e operação.</p></div><span class="settings-demo-badge">AMBIENTE DEMONSTRATIVO</span></div><div class="settings-warning"><strong>Importante:</strong> os campos e preferências são salvos somente neste navegador. O Cashfy ainda não está conectado a um processador de pagamentos, banco, serviço antifraude ou autenticação. Nenhuma cobrança, validação, emissão fiscal ou transferência real é executada.</div><form id="settingsForm"><div class="settings-grid">'+cards.join("")+'</div><div class="settings-actions"><span id="settingsSaved" class="settings-saved">Revise e salve suas preferências.</span><button class="primary-btn" type="submit">Salvar configurações</button></div></form>';
}function escapeHtml(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
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
document.addEventListener("submit",e=>{if(e.target.id==="settingsForm"){e.preventDefault();const next={...cashfySettings};e.target.querySelectorAll("[data-setting]").forEach(el=>{next[el.dataset.setting]=el.type==="checkbox"?el.checked:el.value;});cashfySettings=next;localStorage.setItem("cashfy_settings",JSON.stringify(cashfySettings));const saved=$("#settingsSaved");if(saved)saved.textContent="Configurações salvas neste navegador.";}});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const data=new FormData(e.currentTarget);state.products.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:data.get("name").trim(),price:Number(data.get("price")),description:data.get("description").trim(),date:new Date().toLocaleDateString("pt-BR")});save();closeModal();state.page="products";document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page==="products"));render();});
$("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));$("#sidebarToggle").addEventListener("click",()=>{const sidebar=$("#sidebar");if(window.matchMedia("(max-width: 650px)").matches){sidebar.classList.remove("open");}else{const collapsed=sidebar.classList.toggle("collapsed");const button=$("#sidebarToggle");button.setAttribute("aria-label",collapsed?"Expandir barra lateral":"Recolher barra lateral");button.title=collapsed?"Expandir barra lateral":"Recolher barra lateral";}});
render();
const loadingScreen=$("#loadingScreen");
if(loadingScreen){window.setTimeout(()=>{loadingScreen.classList.add("is-hidden");loadingScreen.setAttribute("aria-hidden","true");introFinished=true;startRevealSequence();},7000);}
