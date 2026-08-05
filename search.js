window.TaxSearch = (()=>{
  const synonyms={
    出租:['租屋','房東','租給','租賃'],
    自用:['自住','自己住','設籍'],
    身障:['身心障礙','殘障'],
    牌照:['車子','車輛','汽車'],
    繳款書:['稅單','補單'],
    分期:['延期','延繳'],
    房屋:['房子','住宅'],
    地價:['土地'],
    證明:['繳納證明','課稅明細'],
    復查:['行政救濟','不服','申訴'],
    繳稅:['繳款','付款','稅款'],
    遺產:['繼承','被繼承人','金融遺產','往生','過世','死亡'],
    娃娃機:['選物販賣機','夾娃娃機'],
    契稅:['房屋過戶','房屋移轉'],
    免稅:['免徵','不用繳','不需繳'],
    拆除:['拆掉','拆掉了','拆房子','房屋滅失']
  };

  const stopWords=['請問','想問','我要問','可以問','可不可以','是不是','是否','怎麼辦','如何','需要','要不要','還要','有沒有','什麼','哪些','一下','目前','如果','假如','因為','我的','我們','家裡','留下','之後'];
  const norm=s=>(s||'').toLowerCase().replace(/[\s，。？！、；：,.!?()（）\-_/「」『』]/g,'');

  function splitTerms(q){
    const clean=norm(q);
    const terms=[];
    if(clean) terms.push(clean);
    stopWords.forEach(word=>{
      const n=norm(word);
      if(n && clean.includes(n)) terms.push(clean.replaceAll(n,''));
    });
    Object.entries(synonyms).forEach(([key,vals])=>{
      if(clean.includes(norm(key))||vals.some(v=>clean.includes(norm(v)))) terms.push(key,...vals);
    });
    const chunks=(q||'').match(/[\u4e00-\u9fff]{2,}|[a-zA-Z0-9.%+]+/g)||[];
    chunks.forEach(chunk=>{
      const c=norm(chunk);
      if(c.length>=2&&!stopWords.some(w=>norm(w)===c)) terms.push(c);
      if(c.length>=4){
        for(let i=0;i<c.length-1;i++) terms.push(c.slice(i,i+2));
      }
    });
    return [...new Set(terms.map(norm).filter(t=>t.length>=2))];
  }

  function score(item,q){
    const full=norm(q);
    const terms=splitTerms(q);
    const question=norm(item.question);
    const summary=norm(item.summary);
    const answer=norm(item.answer);
    const legal=norm(item.legalBasis);
    const keys=norm((item.keywords||[]).join(''));
    let s=0;
        // 完整關鍵字優先：例如「財產清單」應優先找到含有該關鍵字的題目
    (item.keywords || []).forEach(keyword => {
      const k = norm(keyword);

      if (!k || k.length < 2) return;

      if (full.includes(k)) {
        s += k.length >= 4 ? 150 : 60;
      }

      if (k.includes(full) && full.length >= 2) {
        s += 80;
      }
    });

    terms.forEach(t=>{
      if(question.includes(t)) s+=t.length>=4?28:12;
      if(summary.includes(t)) s+=t.length>=4?16:7;
      if(keys.includes(t)) s+=t.length>=4?15:8;
      if(answer.includes(t)) s+=t.length>=4?8:3;
      if(legal.includes(t)) s+=3;
    });

    if(full&&question.includes(full)) s+=60;
    if(full&&summary.includes(full)) s+=35;
    return s;
  }

  function search(bank,q,category='全部'){
    const filtered=category==='全部'?bank:bank.filter(x=>x.category===category);
    if(!q.trim()) return filtered.map(x=>({...x,_score:0}));
    return filtered.map(x=>({...x,_score:score(x,q)})).filter(x=>x._score>0).sort((a,b)=>b._score-a._score||a.id-b.id);
  }

  return{search,norm,splitTerms};
})();
