const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "system-pwa-v1";
const questDefs = [
  {id:"training", title:"Тренування або відновлення", desc:"Виконай заплановане заняття або відпочинь за планом.", xp:30, attrs:["strength","endurance"]},
  {id:"food", title:"Харчування за планом", desc:"Їж достатньо, без голодування та покарань за їжу.", xp:20, attrs:["discipline"]},
  {id:"movement", title:"Рух протягом дня", desc:"Прогулянка або комфортна денна активність.", xp:15, attrs:["endurance","activity"]},
  {id:"sleep", title:"Сон і відновлення", desc:"Підготуйся до сну та дай тілу відновитися.", xp:15, attrs:["discipline","strength"]}
];
const attrNames = {strength:"Сила",endurance:"Витривалість",discipline:"Дисципліна",activity:"Активність"};
const todayKey = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`; };
const dateLabel = (key) => new Date(key+"T12:00:00").toLocaleDateString("uk-UA",{day:"2-digit",month:"short",year:"numeric"});
function loadState(){ try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; } catch { return {}; } }
let state = loadState();
state.quests ||= {}; state.history ||= []; state.totalXp ||= 0; state.startDate ||= todayKey();
state.attributeXp ||= {strength:0,endurance:0,discipline:0,activity:0};
function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); }
function dayNumber(){ const a=new Date(state.startDate+"T12:00:00"), b=new Date(todayKey()+"T12:00:00"); return Math.max(1,Math.min(219,Math.floor((b-a)/86400000)+1)); }
function getToday(){ state.quests[todayKey()] ||= {}; return state.quests[todayKey()]; }
function completedCount(){return questDefs.filter(q=>getToday()[q.id]).length;}
function showToast(message){const t=$("toast");t.textContent=message;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),2200);}
function renderQuests(){
  const host=$("quests");host.innerHTML=""; const today=getToday();
  questDefs.forEach(q=>{
    const label=document.createElement("label"); label.className="quest"+(today[q.id]?" done":"");
    const input=document.createElement("input");input.type="checkbox";input.checked=!!today[q.id];input.setAttribute("aria-label",q.title);
    input.addEventListener("change",()=>{
      today[q.id]=input.checked;
      state.totalXp=Math.max(0,(state.totalXp||0)+(input.checked?q.xp:-q.xp));
      q.attrs.forEach(a=>state.attributeXp[a]=Math.max(0,(state.attributeXp[a]||0)+(input.checked?q.xp: -q.xp)));
      save();render();showToast(input.checked?`Квест завершено: +${q.xp} XP`:"Квест скасовано");
    });
    const text=document.createElement("span");text.className="quest-text";
    const strong=document.createElement("strong");strong.textContent=q.title;
    const small=document.createElement("small");small.textContent=q.desc;
    text.append(strong,small);
    const xp=document.createElement("span");xp.className="xp-pill";xp.textContent=`+${q.xp} XP`;
    label.append(input,text,xp);host.append(label);
  });
  const count=completedCount();$("questCount").textContent=`${count} / ${questDefs.length}`;
  $("questTag").textContent=`${Math.round(count/questDefs.length*100)}% COMPLETE`;
  $("questHint").textContent=count===questDefs.length?"Усі квести виконані. Гарна робота!":"Виконано "+count+" із "+questDefs.length+" квестів.";
}
function renderHistory(){
  const host=$("history");host.innerHTML="";
  if(!state.history.length){host.innerHTML='<p class="muted small">Тут з’являться твої записи.</p>';return;}
  [...state.history].slice(-7).reverse().forEach(row=>{
    const el=document.createElement("div");el.className="history-row";
    const date=document.createElement("span");date.textContent=dateLabel(row.date);
    const vals=document.createElement("strong");vals.textContent=[row.weight!=null?row.weight+" кг":null,row.waist!=null?row.waist+" см":null].filter(Boolean).join(" · ");
    el.append(date,vals);host.append(el);
  });
}
function renderAttributes(){
  Object.keys(attrNames).forEach(key=>{
    const points=state.attributeXp[key]||0, level=Math.floor(points/100)+1, progress=points%100;
    $(key+"Value").textContent=level;
    $(key+"Bar").style.width=progress+"%";
  });
}
function renderAchievements(){
  const host=$("achievements");host.innerHTML="";
  const activeDays=Object.values(state.quests).filter(day=>questDefs.some(q=>day[q.id])).length;
  const allDone=Object.values(state.quests).filter(day=>questDefs.every(q=>day[q.id])).length;
  const achievements=[
    {title:"Перший крок",desc:"Виконай перший квест",done:(state.totalXp||0)>0},
    {title:"Повний протокол",desc:"Виконай усі 4 квести за один день",done:allDone>=1},
    {title:"Тиждень активності",desc:"Будь активним у 7 різних днях",done:activeDays>=7},
    {title:"Рівень 5",desc:"Набери 400 XP",done:(state.totalXp||0)>=400},
    {title:"Половина шляху",desc:"Досягни дня 110 із 219",done:dayNumber()>=110},
    {title:"Фініш 219",desc:"Дійди до 219-го дня",done:dayNumber()>=219}
  ];
  achievements.forEach(a=>{
    const row=document.createElement("div");row.className="achievement"+(a.done?" unlocked":"");
    const mark=document.createElement("span");mark.className="achievement-mark";mark.textContent=a.done?"✓":"◇";
    const copy=document.createElement("div");const title=document.createElement("strong");title.textContent=a.title;
    const desc=document.createElement("small");desc.textContent=a.desc;copy.append(title,desc);row.append(mark,copy);host.append(row);
  });
}
function render(){
  const total=Math.max(0,state.totalXp||0),level=Math.floor(total/100)+1,progress=total%100;
  $("playerLevel").textContent=`LEVEL ${level}`;$("dayLabel").textContent=`DAY ${String(dayNumber()).padStart(3,"0")} / 219`;
  $("xpLabel").textContent=`${progress} / 100 XP`;$("xpBar").style.width=progress+"%";$("totalXp").textContent=total;
  const weights=state.history.filter(x=>x.weight!=null),waists=state.history.filter(x=>x.waist!=null);
  $("weightValue").textContent=weights.length?weights[weights.length-1].weight+" кг":"— кг";
  $("waistValue").textContent=waists.length?waists[waists.length-1].waist+" см":"— см";
  $("weightChange").textContent=weights.length>1?`Перший запис: ${weights[0].weight} кг`:"Додай перший запис";
  const activeDays=Object.values(state.quests).filter(day=>questDefs.some(q=>day[q.id])).length;
  $("streakLabel").textContent=`Активні дні: ${activeDays} · XP за виконані квести`;
  renderQuests();renderHistory();renderAttributes();renderAchievements();
}
$("progressForm").addEventListener("submit",e=>{
  e.preventDefault();
  const w=$("weightInput").value===""?null:Number($("weightInput").value), waist=$("waistInput").value===""?null:Number($("waistInput").value);
  if(w===null&&waist===null){showToast("Введи вагу або талію");return;}
  const entry={date:todayKey(),weight:w,waist}, index=state.history.findIndex(x=>x.date===entry.date);
  if(index>=0){if(w===null)entry.weight=state.history[index].weight;if(waist===null)entry.waist=state.history[index].waist;state.history[index]=entry;} else state.history.push(entry);
  state.history.sort((a,b)=>a.date.localeCompare(b.date));save();render();
  $("saveMessage").textContent="Запис збережено на цьому пристрої.";$("weightInput").value="";$("waistInput").value="";showToast("BODY STATUS оновлено");
});
$("resetQuests").addEventListener("click",()=>{
  const today=getToday();
  questDefs.forEach(q=>{if(today[q.id]){today[q.id]=false;state.totalXp=Math.max(0,state.totalXp-q.xp);q.attrs.forEach(a=>state.attributeXp[a]=Math.max(0,(state.attributeXp[a]||0)-q.xp));}});
  save();render();showToast("Сьогоднішні квести скинуто");
});
$("exportBtn").addEventListener("click",()=>{
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`SYSTEM-backup-${todayKey()}.json`;a.click();URL.revokeObjectURL(url);
  $("backupMessage").textContent="Резервну копію створено. Збережи файл у безпечному місці.";showToast("Резервну копію експортовано");
});
$("importInput").addEventListener("change",async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
    const parsed=JSON.parse(await file.text());
    if(!parsed||typeof parsed!=="object"||!parsed.quests||!Array.isArray(parsed.history))throw new Error("invalid");
    if(!confirm("Імпортувати цю копію? Поточний прогрес буде замінено.")){e.target.value="";return;}
    state={...parsed,attributeXp:parsed.attributeXp||{strength:0,endurance:0,discipline:0,activity:0}};
    save();render();$("backupMessage").textContent="Дані успішно імпортовано.";showToast("Прогрес відновлено");
  }catch{ $("backupMessage").textContent="Не вдалося прочитати файл. Вибери резервну копію SYSTEM у форматі JSON."; }
  e.target.value="";
});
let deferredInstallPrompt=null;
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredInstallPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").addEventListener("click",async()=>{
  if(!deferredInstallPrompt){showToast("Відкрий сайт у Chrome на Android і меню ⋮ → Додати на головний екран");return;}
  deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;$("installBtn").classList.add("hidden");
});
if("serviceWorker" in navigator && location.protocol.startsWith("http")) window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
save();render();
