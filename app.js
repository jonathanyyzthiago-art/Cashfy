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
 ranking:["Ranking de vendas","Veja quais produtos lideram seus resultados e compare o desempenho."],
 activities:["Atividades recentes","Acompanhe tudo o que acontece na sua operação em uma linha do tempo."],
 conversion:["Taxa de conversão","Entenda o desempenho do seu funil e acompanhe os dados de conversão."],
 profile:["Meu perfil","Seus dados de acesso e sua coleção de cards Cashfy."],
 goals:["Metas","Acompanhe suas conquistas e a evolução do faturamento automaticamente."],
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
 paymentLinks:["Links de pagamento","Crie links de cobrança para vender por qualquer canal."],
 coproductions:["Coproduções","Gerencie parceiros, divisão de receita e comissões."],
 members:["Área de membros","Organize cursos, conteúdos, alunos e acessos."],
 disputes:["Disputas e chargebacks","Acompanhe contestações e prazos de resposta."],
 settings:["Configurações","Gerencie as informações básicas do seu espaço."],
 terms:["Termos e condições","Leia as regras de uso e as condições da plataforma Cashfy."]
};
function moduleStore(key, fallback=[]){
 try{return JSON.parse(localStorage.getItem("cashfy_"+key)||"null")??fallback;}catch{return fallback;}
}
const moduleData={
 refunds:moduleStore("refunds"),subscriptions:moduleStore("subscriptions"),affiliates:moduleStore("affiliates"),
 coupons:moduleStore("coupons"),withdrawals:moduleStore("withdrawals"),integrations:moduleStore("integrations",{}),
 paymentLinks:moduleStore("paymentLinks"),coproductions:moduleStore("coproductions"),members:moduleStore("members"),disputes:moduleStore("disputes"), refunds:moduleStore("refunds"),subscriptions:moduleStore("subscriptions"),affiliates:moduleStore("affiliates"),
 coupons:moduleStore("coupons"),withdrawals:moduleStore("withdrawals"),integrations:moduleStore("integrations",{}),
 checkout:moduleStore("checkout",{title:"Finalize sua compra",button:"Pagar agora",color:"#8b5cf6",pix:true,card:true,boleto:false}),
};
function persistModule(key){localStorage.setItem("cashfy_"+key,JSON.stringify(moduleData[key]));}
function moduleField(label,name,type="text",placeholder=""){
 return '<label class="module-field"><span>'+label+'</span><input name="'+name+'" type="'+type+'" '+(type==="color"?'value="'+escapeHtml(placeholder||"#8b5cf6")+'"':'placeholder="'+escapeHtml(placeholder)+'"')+' '+(name==="amount"||name==="price"?"min=\"0.01\" step=\"0.01\"":"")+' required></label>';
}
function moduleSelect(label,name,options){
 return '<label class="module-field"><span>'+label+'</span><select name="'+name+'">'+options.map(o=>'<option value="'+o[0]+'">'+o[1]+'</option>').join("")+'</select></label>';
}
function moduleButton(label,action,kind="secondary-btn"){return '<button type="button" class="'+kind+'" data-module-action="'+action+'">'+label+'</button>';}
function moduleTable(headers,rows,empty){
 return '<div class="module-table-wrap"><table class="module-table"><thead><tr>'+headers.map(h=>'<th>'+h+'</th>').join("")+'</tr></thead><tbody>'+(rows.length?rows.join(""):'<tr><td colspan="'+headers.length+'" class="module-empty">'+empty+'</td></tr>')+'</tbody></table></div>';
}
function modulePage(page){
 const data=moduleData;
 const dateNow=()=>new Date().toLocaleString("pt-BR");
 const card=(title,desc,body)=>body?'<section class="panel module-panel"><div class="module-panel-head"><div><h3>'+title+'</h3><p>'+desc+'</p></div></div>'+body+'</section>':"";
 const form=(id,fields,button)=>"";
 if(page==="goals"){
  const total=state.sales.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
  const tiers=[
   {id:"silver",name:"Prata",start:0,end:10000,range:"0–10k",color:"#c8d0dc",desc:"Sua primeira conquista no Cashfy.",rewards:[{at:10000,text:"Cupom de 20% de desconto na assinatura"}]},
   {id:"gold",name:"Ouro",start:10000,end:100000,range:"10k–100k",color:"#f2bd54",desc:"Seu primeiro período de acesso VIP.",rewards:[{at:100000,text:"VIP por 2 meses extras"}]},
   {id:"diamond",name:"Diamante",start:100000,end:1000000,range:"100k–1mi",color:"#66c9ff",desc:"Uma conquista de alto nível com benefícios VIP ampliados.",rewards:[{at:1000000,text:"VIP por 5 meses extras"}]},
   {id:"red",name:"Elite",start:1000000,end:5000000,range:"1mi–5mi",color:"#ff5369",desc:"Três anos inteiros de acesso VIP.",rewards:[{at:5000000,text:"VIP por 3 anos inteiros"}]},
   {id:"pink",name:"Honra",start:5000000,end:15000000,range:"5mi–15mi",color:"#ff65d4",desc:"O nível máximo de reconhecimento no Cashfy.",rewards:[{at:15000000,text:"VIP permanente + 5 microSaaS gratuitos à sua escolha"}]}
  ];
  const currentTier=tiers.find(t=>total<t.end)||tiers[tiers.length-1];
  const currentPct=Math.max(0,Math.min(100,Math.round((total-currentTier.start)/(currentTier.end-currentTier.start)*100)));
  const tierCards=tiers.map(t=>{
   const reached=total>=t.end,active=total>=t.start&&total<t.end;
   const pct=Math.max(0,Math.min(100,Math.round((total-t.start)/(t.end-t.start)*100)));
   const status=reached?"Conquistada":active?"Em progresso":"Próxima conquista";
   const message=reached?"Faixa concluída!":active?"Você está nessa faixa. Faltam "+money(t.end-total)+" para concluir.": "Esta faixa começa ao alcançar "+money(t.start)+".";
   const rewardHtml=t.rewards.map(r=>'<div class="milestone-reward-row"><span>'+money(r.at)+'</span><span>'+r.text+'</span><b class="milestone-reward-status">'+(total>=r.at?"Liberado":"Bloqueado")+'</b></div>').join("");
   return '<article class="milestone-card tier-'+t.id+' '+(reached?"is-reached":active?"is-active":"is-locked")+'"><div class="milestone-shine"></div><span class="milestone-card-tag">CARD</span><div class="milestone-plaque"><span class="plaque-gem">'+(t.id==="diamond"?"◆":t.id==="silver"?"✦":t.id==="gold"?"✧":t.id==="red"?"⬟":"✿")+'</span><strong>'+t.name+'</strong><small>'+t.range+'</small><span class="plaque-laurel">✦　✧　✦</span></div><div class="milestone-details"><div class="milestone-top"><span class="milestone-status">'+status+'</span><span class="milestone-index">CASHFY • CARD '+String(tiers.indexOf(t)+1).padStart(2,"0")+'</span></div><p class="milestone-description">'+t.desc+'</p><div class="milestone-rewards"><strong>Recompensas desta faixa</strong>'+rewardHtml+'</div><div class="milestone-amount"><strong>'+money(Math.min(total,t.end))+'</strong><span> / '+money(t.end)+'</span></div><div class="milestone-progress"><span style="width:'+pct+'%"></span></div><div class="milestone-foot"><strong>'+pct+'%</strong><span>'+message+'</span></div></div></article>';
  }).join("");
  const overall=Math.min(100,Math.round(total/15000000*100));
  return '<div class="milestones-heading"><div><span class="milestone-eyebrow">COLEÇÃO DE CONQUISTAS</span><h3>Cards da sua jornada</h3></div><span>5 cards exclusivos • R$ 15 milhões</span></div><div class="milestone-profile-info"><span class="milestone-profile-icon">✦</span><p><strong>Suas conquistas e seu acesso VIP.</strong> Ao conquistar o VIP, sua conta terá acesso às premiações que o Cashfy disponibilizar, incluindo microSaaS lançados pelo proprietário e outros benefícios especiais. Cada card conquistado será adicionado ao seu perfil, e cada recompensa será liberada ao alcançar o faturamento indicado.</p></div><section class="milestones-grid">'+tierCards+'</section><div class="milestone-footer-note"><span>✦</span><div><strong>Cada conquista conta.</strong><small>Seu progresso é calculado automaticamente com base no faturamento registrado no Cashfy.</small></div></div>';
 }

 if(page==="ranking"){
  const all=Object.values(state.sales.reduce((acc,s)=>{const name=String(s.productName||s.product_name||s.product||"Produto");if(!acc[name])acc[name]={name,amount:0,count:0};acc[name].amount+=Number(s.amount||s.total||s.price||0);acc[name].count++;return acc;},{})).sort((a,b)=>b.amount-a.amount);
  const total=all.reduce((n,p)=>n+p.amount,0),orders=all.reduce((n,p)=>n+p.count,0);
  const rows=all.map((p,i)=>'<tr><td><span class="rank-table-position">'+String(i+1).padStart(2,"0")+'</span></td><td><strong>'+escapeHtml(p.name)+'</strong></td><td>'+p.count+'</td><td>'+money(p.amount)+'</td><td>'+(total?Math.round(p.amount/total*100):0)+'%</td></tr>');
  return '<section class="module-hero ranking-hero"><div><span class="module-kicker">PERFORMANCE DE PRODUTOS</span><h2>Ranking de vendas</h2><p>Uma visão clara dos produtos que mais contribuem para o faturamento.</p></div><span class="module-hero-icon">♛</span></section><div class="module-kpis"><div class="panel"><small>Produtos com vendas</small><strong>'+all.length+'</strong><span>Produtos no ranking</span></div><div class="panel"><small>Vendas registradas</small><strong>'+orders+'</strong><span>Pedidos contabilizados</span></div><div class="panel"><small>Faturamento total</small><strong>'+money(total)+'</strong><span>Somatório dos registros</span></div></div>'+card("Classificação completa","Ordenada automaticamente pelo faturamento acumulado.",moduleTable(["Posição","Produto","Vendas","Faturamento","Participação"],rows,"Ainda não há vendas suficientes para montar o ranking."))+'<p class="module-hint">O ranking considera os registros de vendas disponíveis neste navegador.</p>';
 }
 if(page==="activities"){
  const items=[...state.sales].sort((a,b)=>(parseSaleDate(b)?.getTime()||0)-(parseSaleDate(a)?.getTime()||0));
  const total=items.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
  const timeline=items.map(s=>{const d=parseSaleDate(s);return '<article class="activity-timeline-item"><span class="activity-timeline-marker">↗</span><div class="activity-timeline-main"><div><strong>'+escapeHtml(s.productName||s.product_name||s.product||"Venda registrada")+'</strong><small>'+(d?d.toLocaleString("pt-BR"):"Data não informada")+'</small></div><span class="activity-status">'+escapeHtml(s.status||"Registrada")+'</span></div><div class="activity-timeline-bottom"><span>Movimentação de venda</span><strong>'+money(s.amount||s.total||s.price||0)+'</strong></div></article>';}).join("");
  return '<section class="module-hero activity-hero"><div><span class="module-kicker">CENTRAL DE MOVIMENTAÇÕES</span><h2>Atividades recentes</h2><p>Histórico organizado para você acompanhar cada movimentação da operação.</p></div><span class="module-hero-icon">◷</span></section><div class="module-kpis"><div class="panel"><small>Movimentações</small><strong>'+items.length+'</strong><span>Registros encontrados</span></div><div class="panel"><small>Volume movimentado</small><strong>'+money(total)+'</strong><span>Valor acumulado</span></div><div class="panel"><small>Última atividade</small><strong>'+(items[0]&&parseSaleDate(items[0])?parseSaleDate(items[0]).toLocaleDateString("pt-BR"):"—")+'</strong><span>Registro mais recente</span></div></div><section class="panel activity-timeline-panel"><div class="module-panel-head"><div><h3>Linha do tempo</h3><p>As atividades mais recentes aparecem primeiro.</p></div><span class="activity-count">'+items.length+' registros</span></div><div class="activity-timeline">'+(timeline||'<div class="module-empty-state"><span>◷</span><strong>Nenhuma atividade por enquanto</strong><p>Quando houver movimentações, elas aparecerão organizadas aqui.</p></div>')+'</div></section>';
 }
 if(page==="conversion"){
  const visits=Number(localStorage.getItem("cashfy_visits_total")||0),orders=state.sales.length,rate=visits>0?orders/visits*100:null;
  return '<section class="module-hero conversion-hero"><div><span class="module-kicker">ANÁLISE DE DESEMPENHO</span><h2>Taxa de conversão</h2><p>Entenda quantas visitas se transformam em vendas e identifique oportunidades no funil.</p></div><span class="module-hero-icon">⌁</span></section><div class="module-kpis"><div class="panel"><small>Taxa de conversão</small><strong>'+(rate===null?"—":rate.toFixed(2).replace(".",",")+"%")+'</strong><span>'+(rate===null?"Sem dados de visitas":"Vendas ÷ visitas")+'</span></div><div class="panel"><small>Vendas registradas</small><strong>'+orders+'</strong><span>Conversões contabilizadas</span></div><div class="panel"><small>Visitas registradas</small><strong>'+visits.toLocaleString("pt-BR")+'</strong><span>Acessos informados</span></div></div><section class="panel conversion-funnel-panel"><div class="module-panel-head"><div><h3>Funil de conversão</h3><p>Visualize a relação entre visitas e vendas.</p></div></div><div class="conversion-funnel"><div class="conversion-funnel-step"><span>Visitas</span><strong>'+visits.toLocaleString("pt-BR")+'</strong><i style="width:100%"></i></div><div class="conversion-funnel-step"><span>Vendas</span><strong>'+orders.toLocaleString("pt-BR")+'</strong><i style="width:'+(visits?Math.min(100,orders/visits*100):0)+'%"></i></div></div><form id="conversionVisitsForm" class="conversion-visits-form"><label class="module-field"><span>Atualizar total de visitas</span><input name="visits" type="number" min="0" step="1" value="'+visits+'" required></label><button class="primary-btn" type="submit">Salvar visitas</button></form><p class="module-hint">A taxa só é calculada quando você informa o total de visitas. As vendas vêm dos registros atuais do Cashfy.</p></section>';
 }

 if(page==="refunds"){
  const rows=data.refunds.map((r,i)=>'<tr><td>#'+escapeHtml(r.id)+'</td><td>'+escapeHtml(r.customer)+'</td><td>'+escapeHtml(r.reason)+'</td><td>'+money(r.amount)+'</td><td><span class="module-pill">'+r.status+'</span></td><td><div class="module-row-actions">'+(r.status==="Solicitado"?'<button data-refund="approve" data-id="'+i+'">Aprovar reembolso</button><button data-refund="cancel" data-id="'+i+'">Comprador desistiu</button>':'—')+'</div></td></tr>');
  return '<div class="module-kpis"><div class="panel"><small>Solicitações</small><strong>'+data.refunds.length+'</strong></div><div class="panel"><small>Aguardando análise</small><strong>'+data.refunds.filter(x=>x.status==="Solicitado").length+'</strong></div><div class="panel"><small>Valor solicitado</small><strong>'+money(data.refunds.filter(x=>x.status==="Solicitado").reduce((s,x)=>s+x.amount,0))+'</strong></div></div>'+card("Nova solicitação de reembolso","Registre a solicitação recebida e acompanhe a janela de análise de 24 horas.",form("refundForm",[moduleField("ID da venda","sale"),moduleField("Cliente","customer"),moduleField("Contato do comprador","contact"),moduleField("Valor (R$)","amount","number"),moduleSelect("Motivo","reason",[["Arrependimento","Arrependimento"],["Produto não recebido","Produto não recebido"],["Cobrança duplicada","Cobrança duplicada"],["Outro","Outro"]])],"Registrar solicitação"))+card("Solicitações de reembolso","Analise, aprove ou recuse os pedidos.",moduleTable(["Pedido","Cliente","Motivo","Valor","Status","Ações"],rows,"Nenhuma solicitação registrada.")+'<p class="module-hint">Na referência Cakto, o pedido dentro da garantia fica em janela de 24 horas; o produtor pode processar antes, e o comprador pode desistir. O estorno real exige integração com o processador.</p>');
 }
 if(page==="subscriptions"){
  const rows=data.subscriptions.map((s,i)=>'<tr><td>'+escapeHtml(s.name)+'</td><td>'+escapeHtml(s.customer)+'</td><td>'+money(s.amount)+'</td><td>'+s.cycle+'</td><td>'+s.status+'</td><td><button data-subscription="'+i+'">'+(s.status==="Ativa"?"Cancelar":"Reativar")+'</button></td></tr>');
  const plans='<section class="subscription-offers"><div class="subscription-offers-heading"><div><span class="subscription-eyebrow">PLANOS CASHFY</span><h3>Escolha sua assinatura</h3><p>Selecione o formato de acesso que combina com sua operação.</p></div></div><div class="subscription-plan-grid"><article class="subscription-plan subscription-plan-monthly"><div class="subscription-plan-top"><span class="subscription-plan-symbol">◷</span><span class="subscription-plan-tag">FLEXÍVEL</span></div><h4>Mensal</h4><p class="subscription-plan-desc">Acesso ao Cashfy com cobrança mensal.</p><div class="subscription-price"><strong>R$ 90</strong><span>/ mês</span></div><div class="subscription-plan-divider"></div><ul><li>Pagamento recorrente mensal</li><li>Sem compromisso de pagamento anual</li><li>Renovação mês a mês</li></ul><div class="subscription-plan-foot">R$ 90,00 a cada mês</div><button class="subscription-subscribe-btn" type="button">Assinar</button></article><article class="subscription-plan subscription-plan-lifetime"><div class="subscription-plan-glow"></div><div class="subscription-plan-top"><span class="subscription-plan-symbol">✦</span><span class="subscription-plan-tag subscription-plan-tag-popular">★ MAIS COMPRADO</span></div><h4>Vitalício</h4><p class="subscription-plan-desc">Um único pagamento para manter seu acesso permanentemente.</p><div class="subscription-price subscription-price-featured"><strong>12x R$ 24,17*</strong><span>por mês no cartão</span></div><div class="subscription-installments subscription-cash-price"><strong>ou R$ 290,00 à vista</strong><span>pagamento único</span></div><div class="subscription-plan-divider"></div><ul><li>Acesso permanente ao Cashfy</li><li>Sem mensalidade ou renovação</li><li>Pagamento único ou parcelado</li></ul><div class="subscription-plan-foot">R$ 290,00 no total</div><small class="subscription-installment-note">*Para fechar o total de R$ 290,00, a última parcela pode ter ajuste de centavos conforme o meio de pagamento.</small><button class="subscription-subscribe-btn" type="button">Assinar</button></article></div></section>';
  return plans+card("Criar plano/assinatura","Cadastre uma recorrência para controle da operação.",form("subscriptionForm",[moduleField("Nome do plano","name"),moduleField("Cliente","customer"),moduleField("Valor recorrente (R$)","amount","number"),moduleSelect("Periodicidade","cycle",[["Mensal","Mensal"],["Anual","Anual"],["Semanal","Semanal"]])],"Criar assinatura"));
 }
 if(page==="affiliates"){
  const rows=data.affiliates.map((a,i)=>'<tr><td>'+escapeHtml(a.name)+'</td><td>'+escapeHtml(a.email)+'</td><td>'+a.commission+'%</td><td>'+a.code+'</td><td>'+a.status+'</td><td><button data-affiliate="'+i+'">Alternar status</button></td></tr>');
  return card("Adicionar afiliado","Cadastre parceiros e defina a comissão.",form("affiliateForm",[moduleField("Nome","name"),moduleField("E-mail","email","email"),moduleField("Comissão (%)","commission","number"),moduleField("Código/link de divulgação","code")],"Adicionar afiliado"))+card("Seus afiliados","Gerencie os parceiros cadastrados.",moduleTable(["Nome","E-mail","Comissão","Código","Status","Ação"],rows,"Nenhum afiliado cadastrado."));
 }
 if(page==="coupons"){
  const rows=data.coupons.map((c,i)=>'<tr><td><b>'+escapeHtml(c.code)+'</b></td><td>'+c.discount+(c.kind==="percent"?"%":" R$")+'</td><td>'+c.uses+'</td><td>'+c.expires+'</td><td>'+c.status+'</td><td><button data-coupon="'+i+'">Ativar/desativar</button> <button data-coupon-delete="'+i+'">Excluir</button></td></tr>');
  return card("Criar cupom","Defina desconto, limite de uso e validade.",form("couponForm",[moduleField("Código do cupom","code"),moduleSelect("Tipo de desconto","kind",[["percent","Porcentagem (%)"],["fixed","Valor fixo (R$)"]]),moduleField("Desconto","discount","number"),moduleField("Limite de utilizações","uses","number"),moduleField("Validade","expires","date")],"Criar cupom"))+card("Cupons cadastrados","Ative, pause ou remova campanhas.",moduleTable(["Código","Desconto","Limite","Validade","Status","Ações"],rows,"Nenhum cupom criado."));
 }
 if(page==="checkout"){
  const s=data.checkout;
  return card("Personalização do checkout","Configure a aparência e os métodos exibidos na página.",'<form id="checkoutForm" class="module-form">'+moduleField("Título do checkout","title","text",s.title)+moduleField("Texto do botão","button","text",s.button)+moduleField("Cor principal","color","color",s.color)+'<label class="module-check"><input type="checkbox" name="pix" '+(s.pix?"checked":"")+'> Aceitar Pix</label><label class="module-check"><input type="checkbox" name="card" '+(s.card?"checked":"")+'> Aceitar cartão</label><label class="module-check"><input type="checkbox" name="boleto" '+(s.boleto?"checked":"")+'> Aceitar boleto</label><button class="primary-btn">Salvar checkout</button></form>')+card("Prévia da página","Visualização local das opções configuradas.",'<div class="checkout-preview" style="--checkout-color:'+escapeHtml(s.color)+'"><h3>'+escapeHtml(s.title)+'</h3><p>Produto selecionado</p><strong>R$ 97,00</strong><div class="checkout-methods">'+(s.pix?"Pix ":"")+(s.card?"Cartão ":"")+(s.boleto?"Boleto":"")+'</div><button type="button">'+escapeHtml(s.button)+'</button></div><p class="module-hint">Prévia visual. A captura e o processamento de pagamentos ainda não estão conectados.</p>');
 }
 if(page==="balance"){
  const total=state.sales.reduce((n,x)=>n+Number(x.amount||x.total||x.price||0),0);
  const requested=data.withdrawals.reduce((n,x)=>n+x.amount,0);
  const rows=data.withdrawals.map(w=>'<tr><td>'+w.date+'</td><td>'+money(w.amount)+'</td><td>'+w.destination+'</td><td>'+w.status+'</td></tr>');
  return '<div class="module-kpis"><div class="panel"><small>Saldo bruto demonstrativo</small><strong>'+money(total)+'</strong></div><div class="panel"><small>Saques solicitados</small><strong>'+money(requested)+'</strong></div><div class="panel"><small>Saldo estimado</small><strong>'+money(Math.max(0,total-requested))+'</strong></div></div>'+card("Solicitar saque","Registre uma solicitação demonstrativa de retirada.",form("withdrawForm",[moduleField("Valor do saque (R$)","amount","number"),moduleField("Chave Pix / destino","destination")],"Solicitar saque"))+card("Histórico de saques","Acompanhe as solicitações registradas.",moduleTable(["Data","Valor","Destino","Status"],rows,"Nenhum saque solicitado.")+'<p class="module-hint">Valores são simulados a partir dos registros locais. Nenhuma transferência bancária é realizada.</p>');
 }
 if(page==="transactions"){
  const rows=state.sales.map(s=>'<tr><td>'+escapeHtml(s.id||"Venda")+'</td><td>'+escapeHtml(s.productName||s.product_name||"Venda")+'</td><td>'+money(s.amount||s.total||s.price)+'</td><td>'+escapeHtml(s.status||"Registrada")+'</td><td>'+escapeHtml(s.dateISO?new Date(s.dateISO).toLocaleDateString("pt-BR"):(s.date||"—"))+'</td></tr>');
  return card("Extrato de transações","Movimentações registradas neste navegador.",'<div class="module-toolbar"><input id="transactionSearch" placeholder="Buscar por produto, ID ou status"><button class="secondary-btn" id="exportTransactions" type="button">Exportar CSV</button></div>'+moduleTable(["ID","Descrição","Valor","Status","Data"],rows,"Nenhuma transação registrada.")+'<p class="module-hint">Este extrato reúne registros locais de vendas. Para conciliação real, conecte o provedor de pagamentos.</p>');
 }
 if(page==="reports"){
  const total=state.sales.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
  const count=state.sales.length;const average=count?total/count:0;
  const rows=state.products.map(p=>'<tr><td>'+escapeHtml(p.name)+'</td><td>'+money(p.price)+'</td><td>'+state.sales.filter(s=>String(s.productId||s.productName)===String(p.id)||s.productName===p.name).length+'</td></tr>');
  return '<div class="module-kpis"><div class="panel"><small>Faturamento registrado</small><strong>'+money(total)+'</strong></div><div class="panel"><small>Vendas registradas</small><strong>'+count+'</strong></div><div class="panel"><small>Ticket médio</small><strong>'+money(average)+'</strong></div></div>'+card("Desempenho por produto","Resumo dos produtos cadastrados.",moduleTable(["Produto","Preço cadastrado","Vendas relacionadas"],rows,"Cadastre produtos para visualizar o relatório.")+'<div class="module-toolbar"><button class="secondary-btn" id="exportReport" type="button">Baixar relatório CSV</button></div><p class="module-hint">Indicadores calculados sobre os dados disponíveis neste navegador, não sobre transações do gateway.</p>');
 }
 if(page==="paymentLinks"){
  const rows=data.paymentLinks.map((p,i)=>'<tr><td><b>'+escapeHtml(p.name)+'</b></td><td>'+money(p.amount)+'</td><td>'+p.method+'</td><td>'+p.created+'</td><td><span class="module-pill">'+p.status+'</span></td><td><button data-link-copy="'+i+'">Copiar link</button> <button data-link-toggle="'+i+'">'+(p.status==="Ativo"?"Pausar":"Ativar")+'</button></td></tr>');
  return card("Criar link de pagamento","Gere uma cobrança compartilhável para WhatsApp, redes sociais ou atendimento.",form("paymentLinkForm",[moduleField("Nome da cobrança","name"),moduleField("Valor (R$)","amount","number"),moduleSelect("Forma de pagamento","method",[["Todos","Pix, cartão e boleto"],["Pix","Somente Pix"],["Cartão","Cartão de crédito"],["Pix e cartão","Pix e cartão"]]),moduleSelect("Tipo de cobrança","type",[["unica","Pagamento único"],["recorrente","Assinatura recorrente"]])],"Gerar link"))+card("Links criados","Gerencie links e copie para compartilhar.",moduleTable(["Oferta","Valor","Métodos","Criado em","Status","Ações"],rows,"Nenhum link criado.")+'<p class="module-hint">O link é demonstrativo nesta versão. Para receber pagamentos, é necessário publicar o checkout e integrar um provedor.</p>');
 }
 if(page==="coproductions"){
  const rows=data.coproductions.map((p,i)=>'<tr><td>'+escapeHtml(p.name)+'</td><td>'+escapeHtml(p.email)+'</td><td>'+p.share+'%</td><td>'+p.role+'</td><td>'+p.status+'</td><td><button data-coproduction="'+i+'">Alterar status</button></td></tr>');
  return card("Adicionar coprodutor","Cadastre parceiros e defina a participação na receita líquida.",form("coproductionForm",[moduleField("Nome do parceiro","name"),moduleField("E-mail","email","email"),moduleField("Participação (%)","share","number"),moduleSelect("Permissão","role",[["Gestor","Gestor"],["Editor","Editor"],["Financeiro","Financeiro"]])],"Adicionar coprodutor"))+card("Equipe do produto","A soma das participações não deve ultrapassar 100%.",moduleTable(["Parceiro","E-mail","Participação","Permissão","Status","Ação"],rows,"Nenhum coprodutor cadastrado."));
 }
 if(page==="members"){
  const rows=data.members.map((m,i)=>'<tr><td>'+escapeHtml(m.name)+'</td><td>'+escapeHtml(m.email)+'</td><td>'+escapeHtml(m.product)+'</td><td>'+m.access+'</td><td>'+m.status+'</td><td><button data-member="'+i+'">'+(m.status==="Ativo"?"Suspender":"Liberar acesso")+'</button></td></tr>');
  return card("Adicionar aluno","Registre um aluno e vincule o acesso a um produto ou curso.",form("memberForm",[moduleField("Nome do aluno","name"),moduleField("E-mail do aluno","email","email"),moduleField("Produto / curso","product"),moduleSelect("Duração do acesso","access",[["Vitalício","Vitalício"],["30 dias","30 dias"],["90 dias","90 dias"],["1 ano","1 ano"]])],"Adicionar aluno"))+card("Alunos e acessos","Controle a lista de alunos e o estado do acesso.",moduleTable(["Aluno","E-mail","Produto","Duração","Status","Ação"],rows,"Nenhum aluno cadastrado.")+'<p class="module-hint">O controle de login e entrega de aulas exige uma área de membros com autenticação e armazenamento no servidor.</p>');
 }
 if(page==="disputes"){
  const rows=data.disputes.map((d,i)=>'<tr><td>'+escapeHtml(d.sale)+'</td><td>'+escapeHtml(d.customer)+'</td><td>'+money(d.amount)+'</td><td>'+escapeHtml(d.reason)+'</td><td>'+escapeHtml(d.deadline)+'</td><td><span class="module-pill">'+d.status+'</span></td><td><button data-dispute="'+i+'">Marcar como respondida</button></td></tr>');
  return card("Registrar contestação","Organize prazos, evidências e o acompanhamento de chargebacks.",form("disputeForm",[moduleField("ID da venda","sale"),moduleField("Cliente","customer"),moduleField("Valor contestado (R$)","amount","number"),moduleSelect("Motivo","reason",[["Não reconhece a compra","Não reconhece a compra"],["Produto não recebido","Produto não recebido"],["Produto diferente","Produto diferente"],["Outro","Outro"]]),moduleField("Prazo de resposta","deadline","date")],"Registrar contestação"))+card("Contestações abertas","Acompanhe o status e registre quando a documentação for enviada.",moduleTable(["Venda","Cliente","Valor","Motivo","Prazo","Status","Ação"],rows,"Nenhuma contestação registrada.")+'<p class="module-hint">A resposta ao banco/adquirente e a reversão do chargeback dependem do processador de pagamentos.</p>');
 }
 if(page==="integrations"){
  const items=[["Google Analytics","analytics"],["Meta Pixel","pixel"],["Webhook de eventos","webhook"],["API externa","api"]];
  return card("Conexões e integrações","Ative os conectores que deseja preparar e informe seus identificadores.",'<form id="integrationsForm">'+items.map(([label,key])=>'<div class="integration-row"><label><input type="checkbox" name="'+key+'" '+(data.integrations[key]&&data.integrations[key].enabled?"checked":"")+'> <b>'+label+'</b></label><input name="'+key+'_value" placeholder="'+(key==="webhook"?"https://seu-dominio.com/webhook":"ID ou URL de integração")+'" value="'+escapeHtml(data.integrations[key]?.value||"")+'"></div>').join("")+'<button class="primary-btn" type="submit">Salvar integrações</button></form><p class="module-hint">Apenas as preferências ficam salvas localmente. Para conectar de verdade, configure credenciais e endpoints seguros no backend. Nunca cole chaves secretas aqui.</p>');
 }
 return '<section class="panel module-card"><h3>'+escapeHtml(titles[page][0])+'</h3><p class="muted">Módulo em construção.</p></section>';
}

function updateSidebarRevenueGoal(){
 const total=state.sales.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
 const pct=Math.min(100,Math.round(total/10000*100));
 const amount=$("#sidebarGoalAmount"),bar=$("#sidebarGoalProgress"),label=$("#sidebarGoalPercent");
 const tiers=[{name:"Prata",start:0,end:10000},{name:"Ouro",start:10000,end:100000},{name:"Diamante",start:100000,end:1000000},{name:"Vermelho",start:1000000,end:5000000},{name:"Rosa",start:5000000,end:15000000}];
 const tier=tiers.find(t=>total<t.end)||tiers[tiers.length-1];
 const stagePct=Math.max(0,Math.min(100,Math.round((total-tier.start)/(tier.end-tier.start)*100)));
 const compactGoalValue=value=>value>=1000000?(value/1000000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" Mi":value>=1000?(value/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+" Mil":money(value);
 const compactGoalTarget=value=>value>=1000000?(value/1000000).toLocaleString("pt-BR",{maximumFractionDigits:1})+"M":(value/1000).toLocaleString("pt-BR",{maximumFractionDigits:1})+"K";
 if(amount)amount.textContent=compactGoalValue(total)+" / "+compactGoalTarget(tier.end);
 if(bar)bar.style.width=stagePct+"%";
 if(label)label.textContent=stagePct+"%";
}
function termsPage(){
 return '<article class="cashfy-terms-page"><div class="cashfy-terms-kicker">CASHFY • DOCUMENTO LEGAL</div><h2>Termos e condições de uso</h2><p class="cashfy-terms-updated">Última atualização: 21 de novembro de 2026</p><p>Estes Termos e Condições estabelecem as regras de acesso e utilização do Cashfy. Ao criar uma conta ou utilizar a plataforma, você declara que leu e aceita estas condições. Caso não concorde, não utilize o serviço.</p><section><h3>1. Sobre a plataforma</h3><p>O Cashfy oferece ferramentas digitais para organização e acompanhamento de operações, vendas, produtos, clientes, metas, indicadores e demais recursos disponibilizados na plataforma. Cada funcionalidade deve ser utilizada conforme sua finalidade e as instruções apresentadas no próprio sistema.</p></section><section><h3>2. Conta e segurança</h3><p>O usuário é responsável pela veracidade das informações fornecidas, pela proteção de suas credenciais e pelas atividades realizadas em sua conta. Mantenha seus dados atualizados e comunique qualquer acesso suspeito ou não autorizado.</p></section><section><h3>3. Dados e informações</h3><p>O usuário deve inserir informações corretas e manter registros e comprovantes necessários à sua operação. Indicadores, relatórios e resultados são calculados a partir dos dados disponíveis e das integrações utilizadas. Confira as informações relevantes antes de tomar decisões comerciais, financeiras ou fiscais.</p></section><section><h3>4. Vendas e pagamentos</h3><p>As funções de vendas e pagamentos operam conforme os recursos e integrações efetivamente disponibilizados na conta. Quando houver participação de bancos, gateways ou outros fornecedores, a autorização, o processamento, a liquidação e eventuais estornos também estarão sujeitos às regras desses prestadores. O Cashfy não substitui os comprovantes emitidos por eles.</p></section><section><h3>5. Metas, cards e recompensas</h3><p>As metas e os cards acompanham os critérios de desempenho apresentados no Cashfy. As recompensas anunciadas — incluindo cupons, períodos VIP, acesso permanente e benefícios relacionados a outros produtos — serão concedidas quando os critérios aplicáveis forem atingidos e validados. A apuração considera os registros elegíveis e poderá exigir conferência para prevenir erros, duplicidades ou fraude. Condições específicas de cada campanha, prazo de resgate e disponibilidade serão informados junto à respectiva recompensa.</p></section><section><h3>6. Uso permitido</h3><p>É proibido utilizar o Cashfy para atividades ilegais, fraudar informações, manipular resultados, violar direitos de terceiros, tentar acessar áreas sem autorização, comprometer a segurança ou prejudicar o funcionamento da plataforma. O descumprimento poderá resultar em bloqueio ou encerramento do acesso, respeitada a legislação aplicável.</p></section><section><h3>7. Disponibilidade e atualizações</h3><p>O Cashfy poderá receber melhorias, correções e alterações. Poderão ocorrer interrupções temporárias para manutenção ou por fatores técnicos e externos. Quando uma mudança afetar de forma relevante o uso do serviço, as informações pertinentes serão comunicadas pelos canais disponíveis, sempre respeitando os direitos legais dos usuários.</p></section><section><h3>8. Propriedade intelectual</h3><p>O nome Cashfy, sua identidade visual, layout, textos, códigos e demais elementos próprios pertencem aos respectivos titulares e são protegidos pela legislação. A utilização da plataforma não transfere ao usuário direitos de propriedade intelectual. É proibida a reprodução ou exploração não autorizada, salvo nas hipóteses permitidas por lei.</p></section><section><h3>9. Privacidade e dados pessoais</h3><p>Os dados pessoais serão tratados para disponibilizar e manter os serviços, proteger contas, atender solicitações e cumprir obrigações legais. O tratamento deverá observar a legislação brasileira de proteção de dados, incluindo a LGPD. O usuário poderá exercer os direitos previstos em lei pelos canais de atendimento disponibilizados pelo Cashfy.</p></section><section><h3>10. Responsabilidades</h3><p>O usuário é responsável pelas informações que insere e pelas decisões tomadas com base nos dados da sua operação. O Cashfy buscará manter seus recursos funcionando corretamente e proteger a plataforma, mas não responde por falhas de serviços externos, uso indevido da conta ou danos decorrentes de informações incorretas fornecidas pelo usuário, nos limites permitidos pela lei. Nenhuma disposição destes termos elimina direitos garantidos ao consumidor.</p></section><section><h3>11. Alterações dos termos</h3><p>Estes termos poderão ser atualizados para refletir mudanças no serviço ou na legislação. A versão vigente ficará disponível nesta página, acompanhada da data de atualização. O uso continuado após a entrada em vigor das alterações representa ciência das novas condições, sem prejuízo dos direitos previstos em lei.</p></section><section><h3>12. Legislação e contato</h3><p>Estes termos são regidos pelas leis da República Federativa do Brasil. Dúvidas, solicitações ou reclamações poderão ser encaminhadas pelos canais oficiais de atendimento do Cashfy.</p></section><p class="cashfy-terms-end">Ao utilizar o Cashfy, você confirma que leu e compreendeu estes Termos e Condições.</p><button type="button" class="secondary-btn cashfy-terms-back" data-page="overview">Voltar ao início</button></article>';
}

function profilePage(){
 const rawName=String(cashfySettings.accountName||"Conta de teste");
 const name=escapeHtml(rawName);
 const email=escapeHtml(cashfySettings.accountEmail||"E-mail não informado");
 const initials=escapeHtml(rawName.trim().split(/\\s+/).slice(0,2).map(part=>part.charAt(0)).join("").toUpperCase()||"CT");
 const tiers=[
  {id:"silver",name:"Prata",symbol:"✦",range:"0–10k"},
  {id:"gold",name:"Ouro",symbol:"✧",range:"10k–100k"},
  {id:"diamond",name:"Diamante",symbol:"◆",range:"100k–1mi"},
  {id:"red",name:"Elite",symbol:"⬟",range:"1mi–5mi"},
  {id:"pink",name:"Honra",symbol:"✿",range:"5mi–15mi"}
 ];
 const total=state.sales.reduce((n,s)=>n+Number(s.amount||s.total||s.price||0),0);
 const cards=tiers.map((t,i)=>'<article class="profile-mini-card tier-'+t.id+' '+(total>=([0,10000,100000,1000000,5000000][i])?"is-unlocked":"is-locked")+'"><div class="milestone-plaque profile-mini-plaque"><span class="plaque-gem">'+t.symbol+'</span><strong>'+t.name+'</strong><small>'+t.range+'</small><span class="plaque-laurel">✦　✧　✦</span></div></article>').join("");
 return '<section class="profile-dashboard-panel"><section class="profile-clean"><div class="profile-clean-heading"><div class="profile-clean-avatar">'+initials+'</div><div class="profile-clean-title"><span class="profile-kicker">MINHA CONTA</span><h2>Meu perfil</h2><p>Suas informações pessoais</p></div><button type="button" class="profile-edit-btn" data-page="settings">Editar dados <span aria-hidden="true">↗</span></button></div><div class="profile-clean-info"><div class="profile-clean-field"><span>Nome</span><strong>'+name+'</strong></div><div class="profile-clean-field"><span>E-mail</span><strong>'+email+'</strong></div><div class="profile-clean-field"><span>Senha</span><strong class="profile-clean-password">••••••••••••</strong><small>Protegida</small></div></div></section></section><section class="profile-cards-panel"><h3>Cards conquistados</h3><section class="profile-minis-panel" aria-label="Coleção de cards"><div class="profile-minis profile-achievement-row">'+cards+'</div></section></section>';
}

function render(){
 const current=titles[state.page]?state.page:"overview";
 document.body.classList.toggle("profile-view",current==="profile");
 document.querySelectorAll(".content > .dashboard-filters").forEach(filters=>filters.remove());
 document.body.classList.toggle("dashboard-view",current==="overview");
 if(current!==state.page)state.page="overview";
 const [title,subtitle]=titles[current]; $("#crumb").textContent=title; $("#pageTitle").textContent=title; $("#pageSubtitle").textContent=subtitle;
 $("#pageContent").innerHTML=current==="terms"?termsPage():current==="profile"?profilePage():current==="overview"?overview():current==="products"?productsPage():current==="sales"?salesPage():current==="customers"?customersPage():current==="settings"?settingsPage():modulePage(current);
 if(current==="overview"){
  const filters=$("#pageContent .dashboard-filters");
  const banner=$(".content > .cashfy-hero");
  const heading=$(".content > .page-heading");
  if(heading){
   heading.hidden=true;
   heading.setAttribute("aria-hidden","true");
   heading.style.setProperty("display","none","important");
   heading.style.setProperty("height","0","important");
   heading.style.setProperty("min-height","0","important");
   heading.style.setProperty("margin","0","important");
   heading.style.setProperty("padding","0","important");
   heading.style.setProperty("border","0","important");
  }
  if(filters&&banner){
   banner.insertAdjacentElement("afterend",filters);
   filters.style.setProperty("display","grid","important");
   filters.style.setProperty("width","100%","important");
   filters.style.setProperty("box-sizing","border-box","important");
   filters.style.setProperty("margin","0 0 16px","important");
   filters.style.setProperty("padding","0","important");
   filters.style.setProperty("row-gap","0","important");
   filters.style.setProperty("column-gap","5px","important");
   filters.style.setProperty("margin-bottom","5px","important");
   filters.querySelectorAll(".filter-field").forEach(field=>{
    field.style.setProperty("margin","0","important");
    field.style.setProperty("gap","0","important");
   });
   const update=filters.querySelector(".dashboard-update");
   if(update)update.style.setProperty("margin-top","1px","important");
   const summary=$("#pageContent .dashboard-summary");
   if(summary){
    summary.style.setProperty("margin-top","0","important");
    summary.style.setProperty("margin-bottom","8px","important");
   }
  }
  bindRevenueChart();
 }
 updateSidebarRevenueGoal();
 if(introFinished)startRevealSequence();
}

function startRevealSequence(){
 const groups=[
  ...Array.from(document.querySelectorAll(".sidebar > *")),
  ...Array.from(document.querySelectorAll(".topbar > *")),
  ...Array.from(document.querySelectorAll(".content > .cashfy-hero, .content > .dashboard-filters, .content > .page-heading, #pageContent > *, .content > footer"))
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

 const rankedProducts=Object.values(sales.reduce((acc,s)=>{
  const name=String(s.productName||s.product_name||s.product||"Produto");
  if(!acc[name])acc[name]={name,amount:0,count:0};
  acc[name].amount+=Number(s.amount||s.total||s.price||0);acc[name].count++;
  return acc;
 },{})).sort((a,b)=>b.amount-a.amount).slice(0,5);
 const recentActivity=[...sales].sort((a,b)=>(parseSaleDate(b)?.getTime()||0)-(parseSaleDate(a)?.getTime()||0)).slice(0,5);
 const dashboardAdditions='<div class="dashboard-additions">'+
  '<section class="panel dashboard-extra-panel dashboard-module-link" data-page="ranking" role="button" tabindex="0"><div class="panel-head"><div><p class="eyebrow">DESTAQUES</p><h3>Ranking de vendas</h3></div><span class="muted">Por faturamento</span></div>'+
  (rankedProducts.length?'<div class="dashboard-ranking">'+rankedProducts.map((p,i)=>'<div class="dashboard-ranking-row"><span class="dashboard-rank-position">'+(i+1)+'</span><span class="dashboard-rank-name">'+escapeHtml(p.name)+'</span><span class="dashboard-rank-count">'+p.count+' venda(s)</span><strong>'+money(p.amount)+'</strong></div>').join('')+'</div>':'<div class="dashboard-extra-empty">O ranking aparecerá quando houver vendas registradas.</div>')+'</section>'+
  '<section class="panel dashboard-extra-panel dashboard-module-link" data-page="activities" role="button" tabindex="0"><div class="panel-head"><div><p class="eyebrow">ACOMPANHAMENTO</p><h3>Atividades recentes</h3></div><span class="muted">Últimas movimentações</span></div>'+
  (recentActivity.length?'<div class="dashboard-activity-list">'+recentActivity.map(s=>{const d=parseSaleDate(s);return '<div class="dashboard-activity-row"><span class="dashboard-activity-icon">↗</span><span class="dashboard-activity-copy"><strong>'+escapeHtml(s.productName||s.product_name||s.product||"Venda")+'</strong><small>'+ (d?d.toLocaleString("pt-BR"):"Data não informada")+'</small></span><strong>'+money(s.amount||s.total||s.price||0)+'</strong></div>';}).join('')+'</div>':'<div class="dashboard-extra-empty">As movimentações aparecerão aqui quando houver vendas registradas.</div>')+'</section>'+
  '<section class="panel dashboard-extra-panel dashboard-conversion-panel dashboard-module-link" data-page="conversion" role="button" tabindex="0"><div class="panel-head"><div><p class="eyebrow">PERFORMANCE</p><h3>Taxa de conversão</h3></div><span class="muted">Visitas × vendas</span></div><div class="dashboard-conversion-value">—</div><p class="dashboard-conversion-note">Conecte uma fonte de visitas para calcular a conversão real da sua página de vendas.</p><span class="dashboard-conversion-status">Aguardando dados de visitas</span><button class="dashboard-open-module" type="button" data-page="conversion">Abrir análise de conversão <span>↗</span></button></section>'+
 '</div>';
 return '<section class="dashboard-filters">'+dropdown("Tipo","type",typeOptions)+dropdown("Produtos","product",productOptions)+dropdown("Período","period",periodOptions)+'<button class="dashboard-update" id="updateDashboard" type="button"><span>Atualizar</span><i>↻</i></button></section><div class="stats dashboard-summary"><article class="stat-card stat-card-primary"><div class="stat-top">Vendas realizadas <button class="visibility-btn '+(state.revenueHidden?"is-hidden":"")+'" id="toggleRevenueVisibility" type="button" aria-label="'+(state.revenueHidden?"Mostrar vendas realizadas":"Ocultar vendas realizadas")+'" aria-pressed="'+(state.revenueHidden?"true":"false")+'" title="'+(state.revenueHidden?"Mostrar valor":"Ocultar valor")+'"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"/><circle cx="12" cy="12" r="2.8"/><path class="eye-slash" d="M3 3 21 21"/></svg></button></div><div class="stat-value revenue-private '+(state.revenueHidden?"blurred":"")+'">'+money(total)+'</div><div class="stat-note">Total no período selecionado</div></article><article class="stat-card quantity-card"><div class="stat-top">Quantidade de vendas <span class="stat-icon">▤</span></div><div class="stat-value">'+sales.length+'</div><div class="stat-note">Vendas no filtro selecionado</div></article></div><section class="panel revenue-panel"><div class="panel-head revenue-head"><div><p class="eyebrow">DESEMPENHO</p><h3>Faturamento</h3><div class="revenue-total" id="chartRevenue">'+money(values.reduce((a,b)=>a+b,0))+'</div><span class="muted" id="chartDate">'+rangeLabel+'</span></div><div class="range-tabs" role="group" aria-label="Período do gráfico">'+[["7d","7 dias"],["30d","30 dias"],["90d","12 semanas"],["12m","12 meses"]].map(([v,t])=>'<button class="range-btn '+(range===v?"active":"")+'" data-range="'+v+'">'+t+'</button>').join("")+'</div></div><div class="revenue-chart-wrap" id="revenueChartWrap"><svg class="revenue-chart" id="revenueChart" viewBox="0 0 720 220" preserveAspectRatio="none" role="img" aria-label="Gráfico de faturamento por período"><defs><linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#a879ff" stop-opacity=".42"/><stop offset="100%" stop-color="#8d5aff" stop-opacity=".015"/></linearGradient><linearGradient id="revenueStroke" x1="0" x2="1"><stop stop-color="#8e5cff"/><stop offset="100%" stop-color="#c2a3ff"/></linearGradient></defs>'+ticks+'<path class="revenue-area" d="'+(hasSales?geo.area:"")+'" fill="url(#revenueFill)"/><path class="revenue-line" d="'+geo.line+'" fill="none" stroke="url(#revenueStroke)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><line id="chartCrosshair" x1="'+px+'" x2="'+px+'" y1="15" y2="200" stroke="#c6a8ff" stroke-width="1" stroke-dasharray="4 5" opacity="0"/><circle id="chartDot" cx="'+px+'" cy="'+py+'" r="5" fill="#c19aff" stroke="#171024" stroke-width="3" opacity="0"/></svg><div class="chart-tooltip" id="chartTooltip" hidden></div></div><div class="chart-xlabels">'+labels+'</div><div class="chart-foot"><span><i class="legend-dot"></i> Faturamento por período</span><span>'+(hasSales?"Arraste no gráfico para consultar":"Suas vendas registradas aparecerão aqui")+'</span></div></section>'+dashboardAdditions+'<div class="dashboard-grid"><section class="panel"><div class="panel-head"><h3>Comece por aqui</h3><span class="muted">Primeiros passos</span></div><div class="empty-state"><div class="empty-icon">✦</div><strong>Monte sua operação</strong><p>Cadastre seu primeiro produto para começar a organizar seu catálogo.</p><button class="primary-btn" data-action="new-product">Cadastrar produto</button></div></section></div><section class="panel table-panel"><div class="panel-head"><h3>Produtos recentes</h3><button class="text-btn" data-page="products">Ver todos</button></div>'+productTable(5)+'</section>';
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
 pixEnabled:true,cardEnabled:true,boletoEnabled:false,installmentsEnabled:true,applePayEnabled:false,googlePayEnabled:false,picPayEnabled:false,pixAutomaticEnabled:false,pixInstallmentEnabled:false,threeDsEnabled:true,maxInstallments:"12",minPayment:"5",maxPayment:"50000",acceptInternational:false,saveCard:false,
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
 settingsCard("＄","Meios de pagamento","Métodos que poderão ser oferecidos ao comprador.",settingToggle("Pix","pixEnabled","Confirmação automática depende da API Pix do provedor.")+settingToggle("Cartão de crédito","cardEnabled","Depende de adquirente, tokenização e antifraude.")+settingToggle("Boleto bancário","boletoEnabled","Depende de emissão e conciliação bancária.")+settingToggle("Permitir parcelamento","installmentsEnabled")+settingToggle("Pix Automático para assinaturas","pixAutomaticEnabled","Requer integração bancária.")+settingToggle("Pix parcelado","pixInstallmentEnabled","Requer parceiro financeiro.")+settingToggle("Apple Pay","applePayEnabled","Depende do adquirente.")+settingToggle("Google Pay","googlePayEnabled","Depende do adquirente.")+settingToggle("PicPay","picPayEnabled","Depende do provedor.")+settingToggle("Autenticação 3DS","threeDsEnabled","Depende do adquirente.")+settingToggle("Aceitar cartões internacionais","acceptInternational","Sujeito ao contrato e às regras do adquirente.")+settingToggle("Permitir salvar cartão","saveCard","Exige tokenização PCI; nunca armazene número ou CVV no Cashfy.")+'<div class="settings-fields">'+settingField("Máximo de parcelas","maxInstallments","select")+settingField("Valor mínimo por cobrança (R$)","minPayment","number")+settingField("Valor máximo por cobrança (R$)","maxPayment","number")+'</div>'),
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
const topSearchToggle=$("#topSearchToggle"),topSearchPanel=$("#topSearchPanel"),topSearchInput=$("#topSearchInput"),topSearchResults=$("#topSearchResults");
function closeTopSearch(){if(!topSearchPanel)return;topSearchPanel.hidden=true;topSearchToggle.setAttribute("aria-expanded","false");topSearchToggle.classList.remove("is-active");}
function renderTopSearch(query=""){
 if(!topSearchResults)return;
 const q=query.trim().toLocaleLowerCase("pt-BR");
 const items=Array.from(document.querySelectorAll(".sidebar [data-page]")).map(el=>({page:el.dataset.page,label:el.textContent.replace(/\\s+/g," ").trim()}));
 const unique=items.filter((item,index)=>items.findIndex(other=>other.page===item.page)===index);
 const matches=unique.filter(item=>!q||(item.label+" "+(titles[item.page]||[]).join(" ")).toLocaleLowerCase("pt-BR").includes(q));
 topSearchResults.innerHTML=matches.length?matches.map(item=>'<button type="button" class="top-search-result" data-page="'+item.page+'"><span class="top-search-result-icon">⌕</span><span><strong>'+escapeHtml(item.label)+'</strong><small>'+escapeHtml((titles[item.page]||[])[1]||"Abrir área")+'</small></span><span class="top-search-arrow">↗</span></button>').join(""):'<p class="top-search-empty">Nenhuma área encontrada.</p>';
}
topSearchToggle?.addEventListener("click",()=>{const open=topSearchPanel.hidden;topSearchPanel.hidden=!open;topSearchToggle.setAttribute("aria-expanded",String(open));topSearchToggle.classList.toggle("is-active",open);if(open){renderTopSearch("");topSearchInput.focus();}});
topSearchInput?.addEventListener("input",()=>renderTopSearch(topSearchInput.value));
$("#topSearchClose")?.addEventListener("click",closeTopSearch);
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&topSearchPanel&&!topSearchPanel.hidden){closeTopSearch();topSearchToggle.focus();}});
document.addEventListener("click",e=>{if(topSearchPanel&&!topSearchPanel.hidden&&!e.target.closest("#topSearchPanel")&&!e.target.closest("#topSearchToggle"))closeTopSearch();});
document.addEventListener("click",e=>{
 const range=e.target.closest("[data-range]");if(range){state.chartRange=range.dataset.range;render();return;}
 if(!e.target.closest(".custom-select")){document.querySelectorAll(".custom-select-menu").forEach(m=>m.hidden=true);document.querySelectorAll(".custom-select-trigger").forEach(b=>b.setAttribute("aria-expanded","false"));}
 const trigger=e.target.closest(".custom-select-trigger");if(trigger){const wrap=trigger.closest(".custom-select");const wasOpen=!wrap.querySelector(".custom-select-menu").hidden;document.querySelectorAll(".custom-select-menu").forEach(m=>m.hidden=true);document.querySelectorAll(".custom-select-trigger").forEach(b=>b.setAttribute("aria-expanded","false"));if(!wasOpen){const menu=wrap.querySelector(".custom-select-menu");menu.style.removeProperty("position");menu.style.removeProperty("top");menu.style.removeProperty("left");menu.style.removeProperty("right");menu.style.removeProperty("bottom");menu.style.removeProperty("width");menu.style.removeProperty("z-index");menu.style.removeProperty("max-height");menu.hidden=false;trigger.setAttribute("aria-expanded","true");}return;}
 const option=e.target.closest(".custom-select-option");if(option){const wrap=option.closest(".custom-select");const key=option.dataset.filterKey;state.dashboardFilters[key]=option.dataset.filterValue;wrap.querySelector(".custom-select-trigger span").textContent=option.textContent.replace("✓","").trim();wrap.querySelectorAll(".custom-select-option").forEach(b=>{b.classList.toggle("selected",b===option);const mark=b.querySelector("span");if(mark)mark.remove();if(b===option)b.insertAdjacentHTML("beforeend","<span>✓</span>");});wrap.querySelector(".custom-select-menu").hidden=true;wrap.querySelector(".custom-select-trigger").setAttribute("aria-expanded","false");return;}
 const update=e.target.closest("#updateDashboard");if(update){render();return;}
 const nav=e.target.closest("[data-page]");if(nav){closeTopSearch();state.page=nav.dataset.page;document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page===state.page));render();$("#sidebar").classList.remove("open");}
 const visibility=e.target.closest("#toggleRevenueVisibility");if(visibility){state.revenueHidden=!state.revenueHidden;const value=$(".revenue-private");value.classList.toggle("blurred",state.revenueHidden);visibility.classList.toggle("is-hidden",state.revenueHidden);visibility.setAttribute("aria-pressed",String(state.revenueHidden));visibility.setAttribute("aria-label",state.revenueHidden?"Mostrar faturamento":"Ocultar faturamento");visibility.title=state.revenueHidden?"Mostrar faturamento":"Ocultar faturamento";return;}
 if(e.target.closest('[data-action="new-product"]'))openModal();
 const del=e.target.closest("[data-delete]");if(del&&confirm("Excluir este produto?")){state.products=state.products.filter(p=>p.id!==del.dataset.delete);save();render();}
});
document.addEventListener("submit",e=>{if(e.target.id==="settingsForm"){e.preventDefault();const next={...cashfySettings};e.target.querySelectorAll("[data-setting]").forEach(el=>{next[el.dataset.setting]=el.type==="checkbox"?el.checked:el.value;});cashfySettings=next;localStorage.setItem("cashfy_settings",JSON.stringify(cashfySettings));const saved=$("#settingsSaved");if(saved)saved.textContent="Configurações salvas neste navegador.";}});
$("#productForm").addEventListener("submit",e=>{e.preventDefault();const data=new FormData(e.currentTarget);state.products.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name:data.get("name").trim(),price:Number(data.get("price")),description:data.get("description").trim(),date:new Date().toLocaleDateString("pt-BR")});save();closeModal();state.page="products";document.querySelectorAll(".nav-link").forEach(n=>n.classList.toggle("active",n.dataset.page==="products"));render();});
$("#closeModal").addEventListener("click",closeModal);$("#cancelModal").addEventListener("click",closeModal);$("#modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal();});$("#mobileMenu").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));$("#sidebarToggle").addEventListener("click",()=>{const sidebar=$("#sidebar");if(window.matchMedia("(max-width: 650px)").matches){sidebar.classList.remove("open");}else{const collapsed=sidebar.classList.toggle("collapsed");const button=$("#sidebarToggle");button.setAttribute("aria-label",collapsed?"Expandir barra lateral":"Recolher barra lateral");button.title=collapsed?"Expandir barra lateral":"Recolher barra lateral";}});
document.addEventListener("submit",e=>{if(e.target.id==="conversionVisitsForm"){e.preventDefault();const v=Math.max(0,Number(new FormData(e.target).get("visits")||0));localStorage.setItem("cashfy_visits_total",String(v));render();}});
render();
const loadingScreen=$("#loadingScreen");
$("#appShell").hidden=true;
if(loadingScreen){window.setTimeout(()=>{loadingScreen.classList.add("is-hidden");loadingScreen.setAttribute("aria-hidden","true");window.setTimeout(()=>{introFinished=true;$("#appShell").hidden=false;startRevealSequence();},650);} ,4400);}else{$("#appShell").hidden=false;startRevealSequence();}


document.addEventListener("submit",e=>{
 const f=e.target;
 const read=name=>f.elements[name]?.value?.trim()||"";
 if(f.id==="paymentLinkForm"){e.preventDefault();moduleData.paymentLinks.unshift({name:read("name"),amount:Number(read("amount")),method:read("method"),type:read("type"),created:new Date().toLocaleDateString("pt-BR"),status:"Ativo",url:location.origin+location.pathname+"#checkout-"+Date.now()});persistModule("paymentLinks");render();}
 if(f.id==="coproductionForm"){e.preventDefault();const share=Number(read("share"));const total=moduleData.coproductions.reduce((n,x)=>n+(x.status==="Ativo"?Number(x.share):0),0);if(share<=0||share+total>100){alert("A participação total dos coprodutores não pode ultrapassar 100%.");return;}moduleData.coproductions.unshift({name:read("name"),email:read("email"),share,role:read("role"),status:"Ativo"});persistModule("coproductions");render();}
 if(f.id==="memberForm"){e.preventDefault();moduleData.members.unshift({name:read("name"),email:read("email"),product:read("product"),access:read("access"),status:"Ativo"});persistModule("members");render();}
 if(f.id==="disputeForm"){e.preventDefault();moduleData.disputes.unshift({sale:read("sale"),customer:read("customer"),amount:Number(read("amount")),reason:read("reason"),deadline:read("deadline"),status:"Aberta"});persistModule("disputes");render();}
 if(f.id==="refundForm"){e.preventDefault();moduleData.refunds.unshift({id:Date.now().toString().slice(-7),sale:read("sale"),customer:read("customer"),contact:read("contact"),amount:Number(read("amount")),reason:read("reason"),status:"Solicitado",requestedAt:Date.now(),deadlineAt:Date.now()+24*60*60*1000});persistModule("refunds");render();}
 if(f.id==="subscriptionForm"){e.preventDefault();moduleData.subscriptions.unshift({name:read("name"),customer:read("customer"),amount:Number(read("amount")),cycle:read("cycle"),status:"Ativa"});persistModule("subscriptions");render();}
 if(f.id==="affiliateForm"){e.preventDefault();moduleData.affiliates.unshift({name:read("name"),email:read("email"),commission:Number(read("commission")),code:read("code"),status:"Ativo"});persistModule("affiliates");render();}
 if(f.id==="couponForm"){e.preventDefault();moduleData.coupons.unshift({code:read("code").toUpperCase(),kind:read("kind"),discount:Number(read("discount")),uses:Number(read("uses")),expires:read("expires"),status:"Ativo"});persistModule("coupons");render();}
 if(f.id==="checkoutForm"){e.preventDefault();moduleData.checkout={title:read("title"),button:read("button"),color:read("color"),pix:f.elements.pix.checked,card:f.elements.card.checked,boleto:f.elements.boleto.checked};persistModule("checkout");render();}
 if(f.id==="withdrawForm"){e.preventDefault();const amount=Number(read("amount"));if(!(amount>0)){alert("Informe um valor válido.");return;}moduleData.withdrawals.unshift({amount,destination:read("destination"),date:new Date().toLocaleString("pt-BR"),status:"Solicitado"});persistModule("withdrawals");render();}
 if(f.id==="integrationsForm"){e.preventDefault();moduleData.integrations={};["analytics","pixel","webhook","api"].forEach(k=>moduleData.integrations[k]={enabled:f.elements[k].checked,value:f.elements[k+"_value"].value.trim()});persistModule("integrations");render();}
});
document.addEventListener("click",e=>{
 const linkCopy=e.target.closest("[data-link-copy]");if(linkCopy){const item=moduleData.paymentLinks[Number(linkCopy.dataset.linkCopy)];if(item){navigator.clipboard?.writeText(item.url).then(()=>alert("Link copiado."),()=>alert(item.url));}return;}
 const linkToggle=e.target.closest("[data-link-toggle]");if(linkToggle){const item=moduleData.paymentLinks[Number(linkToggle.dataset.linkToggle)];if(item){item.status=item.status==="Ativo"?"Pausado":"Ativo";persistModule("paymentLinks");render();}return;}
 const copro=e.target.closest("[data-coproduction]");if(copro){const item=moduleData.coproductions[Number(copro.dataset.coproduction)];if(item){item.status=item.status==="Ativo"?"Pausado":"Ativo";persistModule("coproductions");render();}return;}
 const member=e.target.closest("[data-member]");if(member){const item=moduleData.members[Number(member.dataset.member)];if(item){item.status=item.status==="Ativo"?"Suspenso":"Ativo";persistModule("members");render();}return;}
 const dispute=e.target.closest("[data-dispute]");if(dispute){const item=moduleData.disputes[Number(dispute.dataset.dispute)];if(item){item.status="Documentação registrada";persistModule("disputes");render();}return;}
 const refund=e.target.closest("[data-refund]");if(refund){const r=moduleData.refunds[Number(refund.dataset.id)];if(r){r.status=refund.dataset.refund==="approve"?"Reembolso processado (simulação)":"Pedido cancelado pelo comprador";persistModule("refunds");render();}return;}
 const sub=e.target.closest("[data-subscription]");if(sub){const s=moduleData.subscriptions[Number(sub.dataset.subscription)];if(s){s.status=s.status==="Ativa"?"Cancelada":"Ativa";persistModule("subscriptions");render();}return;}
 const aff=e.target.closest("[data-affiliate]");if(aff){const a=moduleData.affiliates[Number(aff.dataset.affiliate)];if(a){a.status=a.status==="Ativo"?"Pausado":"Ativo";persistModule("affiliates");render();}return;}
 const coupon=e.target.closest("[data-coupon]");if(coupon){const a=moduleData.coupons[Number(coupon.dataset.coupon)];if(a){a.status=a.status==="Ativo"?"Pausado":"Ativo";persistModule("coupons");render();}return;}
 const couponDelete=e.target.closest("[data-coupon-delete]");if(couponDelete&&confirm("Excluir este cupom?")){moduleData.coupons.splice(Number(couponDelete.dataset.couponDelete),1);persistModule("coupons");render();return;}
 if(e.target.closest("#exportTransactions")||e.target.closest("#exportReport")){const rows=[["ID","Descrição","Valor","Status","Data"],...state.sales.map(s=>[s.id||"",s.productName||s.product_name||"Venda",s.amount||s.total||s.price||0,s.status||"Registrada",s.dateISO||s.date||""])];const csv=rows.map(r=>r.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(";")).join("\n");const url=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8"}));const a=document.createElement("a");a.href=url;a.download="cashfy-relatorio.csv";a.click();URL.revokeObjectURL(url);}
});

document.addEventListener("input",e=>{if(e.target.id==="transactionSearch"){const q=e.target.value.toLowerCase();document.querySelectorAll(".module-table tbody tr").forEach(row=>{row.hidden=!row.textContent.toLowerCase().includes(q);});}});
