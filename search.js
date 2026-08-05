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
    拆除:['拆掉','拆掉了','拆房子','房屋滅失'],
    申請:['申辦','辦理','怎麼辦','如何辦'],
    文件:['證件','資料','要帶什麼','準備什麼','檢附'],
    期限:['什麼時候','幾號以前','多久','日期','截止'],
    罰鍰:['罰款','會被罰','處罰','罰多少'],
    退稅:['退錢','退還稅款','多繳','溢繳'],
    戶籍:['設籍','遷入','遷出','戶口'],
    繼承:['過世','死亡','往生','遺產','爸爸過世','家人過世'],
    欠稅:['沒繳稅','忘記繳','逾期','稅沒繳'],
    優惠:['減稅','稅率比較低','比較便宜','優惠稅率'],
    查詢:['查調','查資料','查得到','怎麼查']
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
    const intentRules = [
  {
    queries: ['怎麼申請', '如何申請', '怎麼辦理', '申辦方式'],
    targets: ['申請', '申辦', '辦理', '管道']
  },
  {
    queries: ['要帶什麼', '需要什麼文件', '準備什麼', '要什麼證件'],
    targets: ['檢附', '文件', '證件', '身分證']
  },
  {
    queries: ['什麼時候', '期限', '幾號以前', '多久'],
    targets: ['期限', '日內', '以前', '截止']
  },
  {
    queries: ['要繳嗎', '需要繳嗎', '不用繳嗎', '可以免稅嗎'],
    targets: ['課徵', '免徵', '無須', '不需要繳']
  },
  {
    queries: ['會被罰嗎', '罰多少', '有處罰嗎', '逾期怎麼辦'],
    targets: ['罰鍰', '滯納金', '怠報金', '處罰']
  },
  {
    queries: ['可以退嗎', '怎麼退稅', '多繳怎麼辦'],
    targets: ['退稅', '退還', '溢繳']
  }
];

const targetText = question + summary + answer + keys;

intentRules.forEach(rule => {
  const hasIntent = rule.queries.some(word =>
    full.includes(norm(word))
  );

  const hasMatchingContent = rule.targets.some(word =>
    targetText.includes(norm(word))
  );

  if (hasIntent && hasMatchingContent) {
    s += 18;
  }
});
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

  function search(bank, q, category = '全部') {
  const filtered =
    category === '全部'
      ? bank
      : bank.filter(x => x.category === category);

  if (!q.trim()) {
    return filtered.map(x => ({
      ...x,
      _score: 0
    }));
  }

  const full = norm(q);

  const scored = filtered
    .map(x => ({
      ...x,
      _score: score(x, q)
    }))
    .filter(x => x._score > 0)
    .sort((a, b) => b._score - a._score || a.id - b.id);

  // 搜尋完整詞時，優先只顯示真正包含完整詞的題目
  if (full.length >= 4) {
    const exactMatches = scored.filter(item => {
      const exactText = norm(
        [
          item.question,
          item.summary,
          item.popularTitle,
          ...(item.keywords || [])
        ].join(' ')
      );

      return exactText.includes(full);
    });

    if (exactMatches.length > 0) {
      return exactMatches;
    }
  }

  return scored;
}

  return{search,norm,splitTerms};
})();
