const todayISO=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`};
const esc=value=>String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const dateLabel=value=>value?new Date(`${value}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"}):"No deadline";
const uid=prefix=>`${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
const priorityRank={high:0,medium:1,low:2};
const CURRENT_SCHEMA_VERSION=3;
const DEFAULT_HABITS=[{id:"plan",name:"Plan the day",target:"5 minutes"},{id:"review",name:"Review what I learned",target:"10 minutes"},{id:"breaks",name:"Take proper breaks",target:"During study"}];
const SEED={version:3,profile:{name:"",onboardingComplete:true},subjects:[],deletedSubjectIds:[],tasks:[],habits:DEFAULT_HABITS,daily:{},timeLogs:[],settings:{cloudSync:true,weeklyTarget:12,remindersEnabled:false,reminderTime:"18:00",habitsConfigured:false,smartReminders:true,skipReminderAfterCheckIn:true,reminderDays:[1,2,3,4,5],pushEnabled:false,calendarConnected:false,theme:"light"}};

function loadLocal(){try{const raw=localStorage.getItem("dailyPlannerState");return raw?JSON.parse(raw):structuredClone(SEED)}catch(error){console.error("Could not load local planner state",error);return structuredClone(SEED)}}
let state=window.state=loadLocal();
function migrateState(){
  const storedVersion=Number(state.migrationVersion||0);
  const needsLegacyMigration=storedVersion<2;
  state.profile??={};state.profile.onboardingComplete=true;state.profile.name??="";
  state.settings={...SEED.settings,...(state.settings||{}),cloudSync:true};
  state.deletedSubjectIds=Array.isArray(state.deletedSubjectIds)?state.deletedSubjectIds:[];
  state.daily??={};state.timeLogs=Array.isArray(state.timeLogs)?state.timeLogs:[];
  const oldSubjects=Array.isArray(state.subjects)?state.subjects:[];
  const academics=state.academics||{};
  const placements=state.placements||{};
  const sourceSubjects=oldSubjects.length?oldSubjects:(academics.subjects||[]);
  if(needsLegacyMigration)(academics.assignments||[]).forEach(assignment=>{if(assignment.subject&&!sourceSubjects.some(subject=>(typeof subject==="string"?subject:subject.name)?.toLowerCase()===String(assignment.subject).toLowerCase()))sourceSubjects.push(assignment.subject)});
  if(needsLegacyMigration&&((placements.topics||[]).length||(placements.applications||[]).length))sourceSubjects.push("Career & placements");
  state.subjects=sourceSubjects.map((subject,index)=>typeof subject==="string"?{id:uid("subject"),name:subject,color:["sage","blue","clay"][index%3]}:{id:subject.id||uid("subject"),name:subject.name||"Subject",color:subject.color||"sage"}).filter(subject=>!state.deletedSubjectIds.includes(subject.id));
  const subjectIdByName=name=>{const match=state.subjects.find(s=>s.name.toLowerCase()===String(name||"").toLowerCase());return match?.id||""};
  const oldTasks=Array.isArray(state.tasks)?state.tasks:[];const assignments=Array.isArray(academics.assignments)?academics.assignments:[];
  const placementTasks=needsLegacyMigration?[...(placements.topics||[]).map(topic=>({id:uid("task"),title:topic.name||"Career topic",subjectId:subjectIdByName("Career & placements"),due:topic.targetDate||"",priority:"medium",status:topic.status==="Done"?"done":"open",minutes:45,notes:topic.notes||""})),...(placements.applications||[]).map(application=>({id:uid("task"),title:application.company||application.name||"Placement application",subjectId:subjectIdByName("Career & placements"),due:application.deadline||"",priority:"high",status:"open",minutes:30,notes:application.notes||""}))]:[];
  state.tasks=[...oldTasks.map(t=>({...t,id:t.id||uid("task"),title:t.title||t.name||"Untitled task",subjectId:t.subjectId||subjectIdByName(t.subject),due:t.due||t.date||"",priority:["high","medium","low"].includes(String(t.priority||"").toLowerCase())?String(t.priority).toLowerCase():(t.priority===""?"":"medium"),status:t.status==="done"||t.done?"done":"open",minutes:t.minutes===null||t.minutes===""?null:Number(t.minutes||30),todayPriority:Boolean(t.todayPriority),notes:t.notes||t.note||"",recurrence:t.recurrence||"none",subtasks:Array.isArray(t.subtasks)?t.subtasks.map(item=>typeof item==="string"?{id:uid("subtask"),title:item,done:false}:item):[]})),...(needsLegacyMigration?assignments.map(a=>({id:uid("task"),title:a.title||"Assignment",subjectId:subjectIdByName(a.subject),due:a.due||"",priority:String(a.priority||"medium").toLowerCase(),status:a.status==="Done"?"done":"open",minutes:45,notes:"",recurrence:"none",subtasks:[]})):[]),...placementTasks];
  const oldHabits=Array.isArray(state.habits)?state.habits:(state.settings.habitsConfigured?[]:DEFAULT_HABITS);state.habits=oldHabits.filter(h=>h.source!=="ssc"&&!/ssc|cgl/i.test(String(h.name||""))).map(h=>({id:h.id||uid("habit"),name:h.name||"Habit",target:h.target||"Daily",done:h.done||{}}));
  delete state.ssc;delete state.placements;delete state.academics;delete state.customGroups;delete state.customSections;delete state.builtinSubsections;delete state.secMeta;delete state.pageMeta;delete state.deletedSecs;delete state.hiddenPages;delete state.completed;state.migrationVersion=CURRENT_SCHEMA_VERSION;
}
window.renderTasks=renderTasks;
migrateState();
function saveLocal(){try{localStorage.setItem("dailyPlannerState",JSON.stringify(state))}catch(error){console.error("Could not save local planner state",error)}}
window.saveLocal=saveLocal;
window.saveLocalOnly=saveLocal;
function save(){window.saveLocal()}
function toast(message){const el=document.getElementById("toast");if(!el)return;el.textContent=message;el.classList.add("show");clearTimeout(window._toastTimer);window._toastTimer=setTimeout(()=>el.classList.remove("show"),2600)}
window.toast=toast;
function openModal(id){const el=document.getElementById(id);if(el)el.classList.add("show")}
function closeModal(id){const el=document.getElementById(id);if(el)el.classList.remove("show")}
window.openModal=openModal;window.closeModal=closeModal;
document.addEventListener("click",event=>{if(event.target.classList.contains("modal"))closeModal(event.target.id)});
document.addEventListener("keydown",event=>{if(event.key==="Escape")document.querySelectorAll(".modal.show").forEach(el=>closeModal(el.id))});
function subjectName(id){return state.subjects.find(s=>s.id===id)?.name||"General"}
function subjectColor(id){return state.subjects.find(s=>s.id===id)?.color||"sage"}
function dueSoon(task){if(!task.due)return false;const diff=(new Date(`${task.due}T12:00:00`)-new Date(`${todayISO()}T12:00:00`))/86400000;return diff>=0&&diff<=7}
function openTasks(){return state.tasks.filter(t=>t.status!=="done")}
function completedTasks(){return state.tasks.filter(t=>t.status==="done")}
function setPageTitle(page){const names={today:["Workspace","Today"],tasks:["Plan","Tasks & deadlines"],subjects:["Study","Subjects"],progress:["Review","Progress"],journal:["Reflect","Journal"],settings:["Workspace","Settings"]};const n=names[page]||names.today;document.getElementById("pageKicker").textContent=n[0];document.getElementById("topTitle").textContent=n[1];document.querySelectorAll(".nav-item[data-page]").forEach(b=>{const active=b.dataset.page===page;b.classList.toggle("active",active);if(active)b.setAttribute("aria-current","page");else b.removeAttribute("aria-current")})}
window.go=page=>{document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===`page-${page}`));setPageTitle(page);window._page=page;document.getElementById("sidebar")?.classList.remove("open");renderAll()};
window.toggleMenu=()=>document.getElementById("sidebar")?.classList.toggle("open");
window.toggleProfileMenu=()=>{const el=document.getElementById("profileDropdown"),trigger=document.querySelector(".profile-trigger");if(!el)return;el.hidden=!el.hidden;trigger?.setAttribute("aria-expanded",String(!el.hidden))};
window.closeProfileMenu=()=>{const el=document.getElementById("profileDropdown");if(el)el.hidden=true};
document.addEventListener("click",event=>{if(!event.target.closest("#profileMenu"))window.closeProfileMenu()});
function renderTasks(){
  const root=document.getElementById("taskList"),calendar=document.getElementById("taskCalendar"),filter=window._taskFilter||"all",subject=document.getElementById("taskSubjectFilter")?.value||"";
  const items=state.tasks.filter(task=>matchesTaskFilter(task,filter)&&(!subject||task.subjectId===subject)).sort((a,b)=>(priorityRank[a.priority]??3)-(priorityRank[b.priority]??3)||String(a.due||"9999-12-31").localeCompare(String(b.due||"9999-12-31")));
  if(window._taskView==="calendar"){root.hidden=true;calendar.hidden=false;renderTaskCalendar();return}root.hidden=false;calendar.hidden=true;
  if(root)root.innerHTML=items.length?items.map(task=>taskListRow(task)).join(""):`<div class="empty">No tasks match this view. Add one small next step to get started.</div>`;
}
function matchesTaskFilter(task,filter){if(filter==="done")return task.status==="done";if(task.status==="done")return false;if(filter==="today")return task.due===todayISO();if(filter==="upcoming")return dueSoon(task);if(filter==="overdue")return Boolean(task.due&&task.due<todayISO());return true}
function taskListRow(task){const overdue=task.status!=="done"&&task.due&&task.due<todayISO();const checklist=task.subtasks?.length?`<div class="subtask-preview">${task.subtasks.map(item=>`<button class="subtask-line ${item.done?"done":""}" onclick="toggleSubtask('${task.id}','${item.id}')"><span class="check ${item.done?"done":""}">${item.done?"✓":""}</span>${esc(item.title)}</button>`).join("")}</div>`:"";const meta=[subjectName(task.subjectId),dateLabel(task.due),Number(task.minutes)>0?`${task.minutes} min`:"",task.recurrence&&task.recurrence!=="none"?`repeats ${task.recurrence}`:""].filter(Boolean).join(" · ");return `<div class="task-row ${task.status==="done"?"completed":""} ${overdue?"overdue":""}"><button class="check ${task.status==="done"?"done":""}" onclick="toggleTask('${task.id}')" aria-label="Toggle ${esc(task.title)}">${task.status==="done"?"✓":""}</button><div class="item-main"><strong>${esc(task.title)}</strong><small>${meta}</small>${checklist}</div>${overdue?'<span class="tag overdue-tag">Overdue</span>':""}${task.priority?`<span class="tag ${task.priority}">${task.priority}</span>`:""}<div class="task-actions">${overdue?`<button class="text-button" onclick="carryOverTask('${task.id}')">Today</button><button class="text-button" onclick="editTask('${task.id}')">Reschedule</button>`:""}<button class="icon-button" onclick="editTask('${task.id}')" aria-label="Edit task">✎</button><button class="icon-button" onclick="deleteTask('${task.id}')" aria-label="Delete task">×</button></div></div>`}
window.setTaskView=view=>{window._taskView=view;document.getElementById("listViewButton")?.classList.toggle("active",view==="list");document.getElementById("calendarViewButton")?.classList.toggle("active",view==="calendar");renderTasks()};
function renderTaskCalendar(){const root=document.getElementById("taskCalendar");if(!root)return;const base=new Date(window._calendarMonth||new Date());base.setDate(1);const year=base.getFullYear(),month=base.getMonth(),days=new Date(year,month+1,0).getDate(),start=new Date(year,month,1).getDay(),filter=window._taskFilter||"all",subject=document.getElementById("taskSubjectFilter")?.value||"";let html=`<div class="calendar-heading"><button class="icon-button" onclick="shiftTaskMonth(-1)">‹</button><strong>${base.toLocaleDateString(undefined,{month:"long",year:"numeric"})}</strong><button class="icon-button" onclick="shiftTaskMonth(1)">›</button></div><div class="calendar-grid">${["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d=>`<b>${d}</b>`).join("")}`;for(let i=0;i<start;i++)html+="<span></span>";for(let day=1;day<=days;day++){const date=`${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`,tasks=state.tasks.filter(t=>t.due===date&&matchesTaskFilter(t,filter)&&(!subject||t.subjectId===subject));html+=`<div class="calendar-day ${date===todayISO()?"today":""}"><b>${day}</b>${tasks.slice(0,3).map(t=>`<button class="calendar-task ${t.status==="done"?"done":""}" onclick="editTask('${t.id}')">${esc(t.title)}</button>`).join("")}</div>`}root.innerHTML=html+"</div>"}
window.shiftTaskMonth=offset=>{const date=new Date(window._calendarMonth||new Date());date.setMonth(date.getMonth()+offset);window._calendarMonth=date;renderTaskCalendar()};
window.setTaskFilter=(filter,button)=>{window._taskFilter=filter;document.querySelectorAll("#taskFilters button").forEach(b=>b.classList.remove("active"));button?.classList.add("active");renderTasks()};
function populateSubjectSelects(){const options=state.subjects.map(s=>`<option value="${s.id}">${esc(s.name)}</option>`).join("");["taskSubject","taskSubjectFilter"].forEach(id=>{const el=document.getElementById(id);if(!el)return;const current=el.value;el.innerHTML=(id==="taskSubjectFilter"?'<option value="">All subjects</option>':"<option value=''>General / no subject</option>")+options;el.value=current})}
function renderToday(){
  const open=openTasks(),done=completedTasks(),due=open.filter(dueSoon),pct=state.tasks.length?Math.round(done.length/state.tasks.length*100):0;
  document.getElementById("todayPercent").textContent=`${pct}%`;document.getElementById("todayProgress").style.width=`${pct}%`;document.getElementById("openTaskCount").textContent=open.length;document.getElementById("dueSoonCount").textContent=due.length;
  const name=state.profile.name||window.currentUser?.displayName?.split(" ")[0]||"there";document.getElementById("greetingName").textContent=esc(name);document.getElementById("todaySummary").textContent=open.length?`${open.length} open task${open.length===1?"":"s"} waiting for your attention.`:"Your plan is clear. Add a task whenever something new comes up.";
  const priorities=open.filter(task=>task.todayPriority).sort((a,b)=>(priorityRank[a.priority]??3)-(priorityRank[b.priority]??3)||String(a.due||"9999-12-31").localeCompare(String(b.due||"9999-12-31"))).slice(0,4),priorityRoot=document.getElementById("todayPriorities");priorityRoot.innerHTML=priorities.length?priorities.map(taskRow).join(""):'<div class="empty">Choose tasks for your top priorities when adding or editing them.</div>';
  const deadlineRoot=document.getElementById("todayDeadlines"),deadlines=open.filter(t=>t.due).sort((a,b)=>a.due.localeCompare(b.due)).slice(0,4);deadlineRoot.innerHTML=deadlines.length?deadlines.map(t=>`<div class="deadline-item"><div class="item-main"><strong>${esc(t.title)}</strong><small>${esc(subjectName(t.subjectId))}</small></div><span class="tag ${t.due<todayISO()?"high":"subject"}">${t.due<todayISO()?"Overdue":dateLabel(t.due)}</span></div>`).join(""):'<div class="empty">No deadlines yet.</div>';
  const habits=document.getElementById("todayHabits");habits.innerHTML=state.habits.slice(0,4).map(h=>{const checked=Boolean(h.done?.[todayISO()]);return `<div class="habit-item"><button class="check ${checked?"done":""}" onclick="toggleHabit('${h.id}')">${checked?"✓":""}</button><div class="item-main"><strong>${esc(h.name)}</strong><small>${esc(h.target)}</small></div></div>`}).join("")||'<div class="empty">Add a routine in Settings.</div>';
  renderWeekBars();
}
function taskRow(task){return `<div class="priority-item"><button class="check" onclick="toggleTask('${task.id}')" aria-label="Complete ${esc(task.title)}"></button><div class="item-main"><strong>${esc(task.title)}</strong><small>${esc(subjectName(task.subjectId))}${Number(task.minutes)>0?` · ${task.minutes} min`:""}</small></div>${task.priority?`<span class="tag ${task.priority}">${task.priority}</span>`:""}<button class="icon-button" onclick="editTask('${task.id}')" aria-label="Edit task">✎</button><button class="icon-button" onclick="deleteTask('${task.id}')" aria-label="Delete task">×</button></div>`}
function renderWeekBars(){const root=document.getElementById("weekBars");const days=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;days.push({key,label:d.toLocaleDateString(undefined,{weekday:"short"}).slice(0,2),minutes:state.timeLogs.filter(x=>x.date===key).reduce((a,x)=>a+Number(x.minutes||0),0)})}const max=Math.max(60,...days.map(d=>d.minutes));root.innerHTML=days.map(d=>`<div class="week-bar"><i style="height:${Math.max(4,d.minutes/max*100)}%" title="${d.minutes} minutes"></i><span>${d.label}</span></div>`).join("")}
function renderSubjects(){
  const root=document.getElementById("subjectGrid");
  const detail=document.getElementById("subjectDetailView");
  const selected=state.subjects.find(subject=>subject.id===state.selectedSubject);
  const search=document.getElementById("subjectSearch");
  const query=search?.value.trim().toLowerCase()||"";
  const completed=state.tasks.filter(task=>task.status==="done").length;
  document.getElementById("subjectCount").textContent=String(state.subjects.length);
  document.getElementById("subjectOpenTaskCount").textContent=String(state.tasks.length-completed);
  document.getElementById("subjectCompletedTaskCount").textContent=String(completed);
  root.hidden=Boolean(window._subjectDetailOpen&&selected);
  if(detail)detail.hidden=!(window._subjectDetailOpen&&selected);
  const visibleSubjects=state.subjects.filter(subject=>subject.name.toLowerCase().includes(query));
  document.getElementById("subjectResultCount").textContent=query?`${visibleSubjects.length} of ${state.subjects.length} subjects`:`${state.subjects.length} ${state.subjects.length===1?"subject":"subjects"}`;
  root.innerHTML=visibleSubjects.length?visibleSubjects.map(subject=>{
    const tasks=state.tasks.filter(task=>task.subjectId===subject.id),complete=tasks.filter(task=>task.status==="done").length,active=tasks.filter(task=>task.status!=="done").length,p=tasks.length?Math.round(complete/tasks.length*100):0;
    return `<article class="subject-card ${subject.color||"sage"}"><button type="button" class="subject-card-open" aria-label="Open tasks for ${esc(subject.name)}" onclick="selectSubject('${subject.id}')"><div class="subject-card-heading"><span class="subject-card-label">SUBJECT</span><h3>${esc(subject.name)}</h3><p>${active} to do · ${complete} completed</p></div><div class="subject-meta"><span>Overall progress</span><b>${p}%</b></div><div class="subject-progress" role="progressbar" aria-label="${esc(subject.name)} task completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${p}"><i style="width:${p}%"></i></div><span class="subject-open-hint">Open tasks <span aria-hidden="true">→</span></span></button><div class="subject-actions"><button type="button" class="text-button" onclick="editSubject('${subject.id}')">Edit subject</button></div></article>`;
  }).join(""):state.subjects.length?`<div class="subject-empty-state"><span class="subject-empty-icon" aria-hidden="true">⌕</span><h3>No subjects found</h3><p>Try another name or clear your search.</p><button class="button secondary" onclick="document.getElementById('subjectSearch').value='';renderSubjects()">Clear search</button></div>`:'<div class="subject-empty-state"><span class="subject-empty-icon" aria-hidden="true">＋</span><h3>Your learning starts here</h3><p>Add a subject to keep its tasks and progress organized in one place.</p><button class="button primary" onclick="openSubjectModal()">＋ Add your first subject</button></div>';
  if(detail&&selected){
    const tasks=state.tasks.filter(task=>task.subjectId===selected.id).sort((a,b)=>String(a.due||"9999-12-31").localeCompare(String(b.due||"9999-12-31")));
    const activeTasks=tasks.filter(task=>task.status!=="done"),doneTasks=tasks.filter(task=>task.status==="done");
    const taskSection=(title,items)=>items.length?`<section class="subject-task-group"><h4>${title} <span>${items.length}</span></h4>${items.map(taskListRow).join("")}</section>`:"";
    const emptyTasks=`<div class="subject-empty-state subject-task-empty"><span class="subject-empty-icon" aria-hidden="true">✓</span><h3>No tasks here yet</h3><p>Add the first task for this subject. You can set a due date, priority, or checklist if you need one.</p><button class="button primary" onclick="openTaskModal(null,'${selected.id}')">＋ Add a task</button></div>`;
    detail.innerHTML=`<div class="subject-detail-toolbar"><button class="button secondary" onclick="closeSubjectTasks()">← All subjects</button><button class="button primary" onclick="openTaskModal(null,'${selected.id}')">＋ Add task</button></div><div class="surface subject-detail-card"><div class="subject-detail-heading"><div><span class="eyebrow">Subject workspace</span><h3>${esc(selected.name)}</h3><p>${activeTasks.length} to do · ${doneTasks.length} completed</p></div><div class="subject-detail-actions"><button type="button" class="button secondary" onclick="editSubject('${selected.id}')">Edit subject</button><button type="button" class="text-button danger-text" onclick="deleteSubject('${selected.id}')">Delete subject</button></div></div><div class="subject-detail-list">${tasks.length?`${taskSection("To do",activeTasks)}${taskSection("Completed",doneTasks)}`:emptyTasks}</div></div>`;
  }
}
window.renderSubjects=renderSubjects;
window.selectSubject=id=>{if(!state.subjects.some(subject=>subject.id===id))return;state.selectedSubject=id;window._subjectDetailOpen=true;renderSubjects();window.scrollTo({top:0,behavior:"smooth"})};
window.closeSubjectTasks=()=>{window._subjectDetailOpen=false;renderSubjects()};
function renderProgress(){const total=state.tasks.length,done=completedTasks().length,minutes=state.timeLogs.reduce((a,x)=>a+Number(x.minutes||0),0),streak=state.habits.reduce((a,h)=>a+Object.keys(h.done||{}).length,0);document.getElementById("progressStats").innerHTML=[["Tasks completed",done],["Completion rate",`${total?Math.round(done/total*100):0}%`],["Study minutes",minutes],["Routine check-ins",streak]].map(x=>`<div class="progress-stat"><span>${x[0]}</span><strong>${x[1]}</strong></div>`).join("");document.getElementById("subjectProgress").innerHTML=state.subjects.map(s=>{const ts=state.tasks.filter(t=>t.subjectId===s.id),p=ts.length?Math.round(ts.filter(t=>t.status==="done").length/ts.length*100):0;return `<div class="progress-line"><div class="progress-line-head"><b>${esc(s.name)}</b><span>${p}% · ${ts.length} tasks</span></div><div class="line"><i style="width:${p}%"></i></div></div>`}).join("")||'<div class="empty">Add subjects to see progress by area.</div>';const activity=document.getElementById("activityGrid");activity.innerHTML=Array.from({length:14},(_,i)=>{const d=new Date();d.setDate(d.getDate()-(13-i));const k=d.toISOString().slice(0,10),n=state.tasks.filter(t=>t.status==="done"&&t.completedAt?.slice(0,10)===k).length;return `<i class="activity-cell ${n>1?"strong":n?"active":""}" title="${k}"></i>`}).join("")}
function loadJournal(){const date=document.getElementById("journalDate")?.value||todayISO(),entry=state.daily[date]?.journal||{};document.getElementById("journalWins").value=entry.wins||"";document.getElementById("journalLearn").value=entry.learn||"";document.getElementById("journalNext").value=entry.next||""}
window.loadJournal=loadJournal;
function renderJournalHistory(){const root=document.getElementById("journalHistory"),entries=Object.entries(state.daily).filter(([,d])=>d.journal&&(d.journal.wins||d.journal.learn||d.journal.next)).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,8);root.innerHTML=entries.length?entries.map(([date,d])=>`<article class="journal-entry"><time>${dateLabel(date)}</time><p>${esc(d.journal.wins||d.journal.learn||d.journal.next)}</p></article>`).join(""):'<div class="empty">Your saved reflections will appear here.</div>'}
window.saveJournal=()=>{const date=document.getElementById("journalDate").value||todayISO();state.daily[date]??={};state.daily[date].journal={wins:document.getElementById("journalWins").value,learn:document.getElementById("journalLearn").value,next:document.getElementById("journalNext").value};save();renderJournalHistory();toast("Journal entry saved")};
function nextDue(date,recurrence){const d=new Date(`${date||todayISO()}T12:00:00`);if(recurrence==="daily")d.setDate(d.getDate()+1);else if(recurrence==="weekly")d.setDate(d.getDate()+7);else if(recurrence==="monthly")d.setMonth(d.getMonth()+1);return d.toISOString().slice(0,10)}
window.toggleTask=id=>{const task=state.tasks.find(t=>t.id===id);if(!task)return;if(task.status==="done"){task.status="open";task.completedAt=""}else{task.status="done";task.completedAt=new Date().toISOString();if(task.recurrence&&task.recurrence!=="none"&&!state.tasks.some(t=>t.parentId===task.id&&t.due===nextDue(task.due,task.recurrence))){state.tasks.push({...task,id:uid("task"),parentId:task.id,due:nextDue(task.due,task.recurrence),status:"open",completedAt:"",subtasks:(task.subtasks||[]).map(item=>({...item,id:uid("subtask"),done:false}))})}}save();renderAll()};
window.toggleSubtask=(taskId,subtaskId)=>{const task=state.tasks.find(t=>t.id===taskId),item=task?.subtasks?.find(x=>x.id===subtaskId);if(!item)return;item.done=!item.done;save();renderAll()};
window.carryOverTask=id=>{const task=state.tasks.find(t=>t.id===id);if(!task)return;task.due=todayISO();save();renderAll();toast("Task carried over to today")};
window.deleteTask=id=>{if(!confirm("Delete this task?"))return;state.tasks=state.tasks.filter(t=>t.id!==id);save();renderAll();toast("Task deleted")};
window.editTask=id=>{const task=state.tasks.find(t=>t.id===id);if(!task)return;openTaskModal(task)};
window.openTaskModal=(task,subjectId="")=>{populateSubjectSelects();document.getElementById("taskForm").reset();document.getElementById("taskId").value=task?.id||"";document.getElementById("taskModalTitle").textContent=task?"Edit task":"Add a task";document.getElementById("taskTitle").value=task?.title||"";document.getElementById("taskSubject").value=task?.subjectId||subjectId;document.getElementById("taskDue").value=task?task.due||"":todayISO();document.getElementById("taskPriority").value=task?.priority||"";document.getElementById("taskMinutes").value=task?.minutes??"";document.getElementById("taskRecurrence").value=task?.recurrence&&task.recurrence!=="none"?task.recurrence:"";document.getElementById("taskTodayPriority").checked=Boolean(task?.todayPriority);document.getElementById("taskSubtasks").value=(task?.subtasks||[]).map(item=>item.title).join("\n");document.getElementById("taskNotes").value=task?.notes||"";openModal("taskModal")};
window.saveTask=event=>{event.preventDefault();const id=document.getElementById("taskId").value,old=id&&state.tasks.find(t=>t.id===id),subtasks=document.getElementById("taskSubtasks").value.split("\n").map(title=>title.trim()).filter(Boolean).map((title,index)=>({id:old?.subtasks?.[index]?.id||uid("subtask"),title,done:old?.subtasks?.[index]?.title===title?old.subtasks[index].done:false}));const minuteValue=document.getElementById("taskMinutes").value;const data={title:document.getElementById("taskTitle").value.trim(),subjectId:document.getElementById("taskSubject").value,due:document.getElementById("taskDue").value,priority:document.getElementById("taskPriority").value,minutes:minuteValue?Number(minuteValue):null,recurrence:document.getElementById("taskRecurrence").value||"none",todayPriority:document.getElementById("taskTodayPriority").checked,subtasks,notes:document.getElementById("taskNotes").value,status:old?.status||"open",completedAt:old?.completedAt||""};if(id){Object.assign(old,data)}else state.tasks.push({id:uid("task"),...data});save();closeModal("taskModal");renderAll();toast(id?"Task updated":"Task added")};
window.openSubjectModal=subject=>{document.getElementById("subjectId").value=subject?.id||"";document.getElementById("subjectName").value=subject?.name||"";document.getElementById("subjectColor").value=["sage","blue","clay"].includes(subject?.color)?subject.color:"sage";document.getElementById("subjectModalTitle").textContent=subject?"Edit subject":"Add a subject";document.getElementById("subjectSubmitButton").textContent=subject?"Save changes":"Add subject";openModal("subjectModal")};
window.editSelectedSubject=()=>{const subject=state.subjects.find(x=>x.id===state.selectedSubject);if(subject)openSubjectModal(subject)};
window.editSubject=id=>{const subject=state.subjects.find(x=>x.id===id);if(subject)openSubjectModal(subject)};
window.saveSubject=event=>{event.preventDefault();const id=document.getElementById("subjectId").value,name=document.getElementById("subjectName").value.trim();if(!name)return;if(state.subjects.some(subject=>subject.id!==id&&subject.name.trim().toLowerCase()===name.toLowerCase())){toast("A subject with that name already exists");return}const data={name,color:document.getElementById("subjectColor").value};if(id){const subject=state.subjects.find(x=>x.id===id);if(subject)Object.assign(subject,data)}else{const subject={id:uid("subject"),...data};state.subjects.push(subject);state.selectedSubject=subject.id}save();closeModal("subjectModal");renderAll();toast(id?"Subject updated":"Subject added")};
window.deleteSubject=id=>{const subject=state.subjects.find(x=>x.id===id);if(!subject)return;const count=state.tasks.filter(t=>t.subjectId===id).length;if(!confirm(`Delete "${subject.name}"? ${count?`${count} task${count===1?"":"s"} will be kept without a subject.`:"This subject has no tasks."}`))return;state.deletedSubjectIds??=[];if(!state.deletedSubjectIds.includes(id))state.deletedSubjectIds.push(id);state.tasks.forEach(task=>{if(task.subjectId===id)task.subjectId=""});state.subjects=state.subjects.filter(x=>x.id!==id);if(state.selectedSubject===id){state.selectedSubject=state.subjects[0]?.id||"";window._subjectDetailOpen=false}save();renderAll();toast("Subject deleted permanently")};
window.toggleHabit=id=>{const habit=state.habits.find(h=>h.id===id);if(!habit)return;habit.done??={};habit.done[todayISO()]=!habit.done[todayISO()];save();renderAll()};
window.addHabit=()=>{const name=prompt("Habit name:");if(!name?.trim())return;state.settings.habitsConfigured=true;state.habits.push({id:uid("habit"),name:name.trim(),target:"Daily",done:{}});save();renderAll();toast("Habit added")};
function renderSettings(){document.getElementById("weeklyTarget").value=state.settings.weeklyTarget||12;document.getElementById("profileNameInput").value=state.profile.name||"";const root=document.getElementById("habitSettings");root.innerHTML=state.habits.map(h=>`<div class="habit-setting"><label class="sr-only" for="habit-${esc(h.id)}">Habit name</label><input class="field" id="habit-${esc(h.id)}" name="habit-${esc(h.id)}" value="${esc(h.name)}" onchange="renameHabit('${h.id}',this.value)"><button class="icon-button" type="button" onclick="removeHabit('${h.id}')">×</button></div>`).join("")}
window.renameHabit=(id,name)=>{const h=state.habits.find(x=>x.id===id);if(h){state.settings.habitsConfigured=true;h.name=name.trim()||h.name;save();renderToday()}};window.removeHabit=id=>{state.settings.habitsConfigured=true;state.habits=state.habits.filter(h=>h.id!==id);save();renderAll();toast("Habit removed")};window.saveSettings=()=>{state.settings.weeklyTarget=Number(document.getElementById("weeklyTarget").value)||0;save();toast("Settings saved")};window.saveProfile=()=>{state.profile.name=document.getElementById("profileNameInput").value.trim();save();renderAll();toast("Profile updated")};
window.exportJSON=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="myprogresstrack-backup.json";a.click();URL.revokeObjectURL(a.href)};
function isValidBackup(value){if(!value||typeof value!=="object"||Array.isArray(value)||!Array.isArray(value.tasks)||!Array.isArray(value.subjects)||!Array.isArray(value.habits)||typeof value.daily!=="object"||Array.isArray(value.daily)||typeof value.settings!=="object"||Array.isArray(value.settings))return false;return value.tasks.every(task=>task&&typeof task==="object"&&typeof task.title==="string"&&(!task.status||["open","done"].includes(task.status))&&(!task.priority||priorityRank[task.priority]!==undefined)&&(!task.subtasks||Array.isArray(task.subtasks)))&&value.subjects.every(subject=>subject&&typeof subject==="object"&&typeof subject.name==="string")};
window.importJSON=input=>{const file=input.files?.[0];if(!file)return;const reader=new FileReader();reader.onload=event=>{try{const imported=JSON.parse(event.target.result);if(!isValidBackup(imported))throw new Error("Invalid planner backup");if(!confirm("Restore this backup? Your current local workspace will be replaced."))return;state=window.state=imported;migrateState();save();renderAll();toast("Backup restored")}catch(error){console.error("Could not restore backup",error);toast("That backup file is not valid")}};reader.readAsText(file);input.value=""};
function renderAll(){if(!document.getElementById("page-today"))return;migrateState();const page=window._page||"today";populateSubjectSelects();renderToday();renderTasks();renderSubjects();renderProgress();renderJournalHistory();renderSettings();window.renderAdvancedFeatures?.();setPageTitle(page);if(!document.getElementById("journalDate").value){document.getElementById("journalDate").value=todayISO();loadJournal()}const now=new Date();document.getElementById("liveDate").textContent=now.toLocaleDateString(undefined,{weekday:"short",month:"short",day:"numeric"});window.saveLocalOnly()}
window.renderAll=renderAll;window.openOnboarding=()=>{state.profile.onboardingComplete=true;save()};
window.addEventListener("load",()=>{renderAll();document.getElementById("appLoading").hidden=true});

// Focus timer and reminder opt-in are additive so older backups keep working.
const focusTimer={mode:"focus",seconds:25*60,running:false};
let focusTimerInterval;
function timerLabel(){return `${String(Math.floor(focusTimer.seconds/60)).padStart(2,"0")}:${String(focusTimer.seconds%60).padStart(2,"0")}`}
function renderTimer(){
  const display=document.getElementById("timerDisplay");if(!display)return;
  display.textContent=timerLabel();
  const mode=document.getElementById("timerModeLabel"),toggle=document.getElementById("timerToggle");
  if(mode)mode.textContent=focusTimer.mode==="focus"?"Pomodoro timer":"Break time";
  if(toggle)toggle.textContent=focusTimer.running?"Pause":(focusTimer.mode==="focus"?"Start":"Resume");
  const select=document.getElementById("timerTask");
  if(select){const current=select.value;select.innerHTML='<option value="">Focus without a task</option>'+openTasks().map(t=>`<option value="${t.id}">${esc(t.title)}</option>`).join("");select.value=current}
}
function finishFocusSprint(){
  if(focusTimer.mode==="focus"){
    const select=document.getElementById("timerTask"),minutes=25;
    state.timeLogs.push({id:uid("log"),date:todayISO(),minutes,source:"pomodoro",taskId:select?.value||""});
    save();toast("Focus sprint complete. Take a short break.");
    focusTimer.mode="break";focusTimer.seconds=5*60;
  }else{focusTimer.mode="focus";focusTimer.seconds=25*60;toast("Break complete. Ready for another sprint?")}
}
function tickTimer(){
  if(!focusTimer.running)return;
  focusTimer.seconds-=1;
  if(focusTimer.seconds<=0){focusTimer.running=false;finishFocusSprint()}
  renderTimer();renderProgress();renderToday();
}
window.toggleTimer=()=>{focusTimer.running=!focusTimer.running;if(focusTimer.running&&!focusTimerInterval)focusTimerInterval=setInterval(tickTimer,1000);renderTimer()};
window.resetTimer=()=>{focusTimer.running=false;focusTimer.mode="focus";focusTimer.seconds=25*60;renderTimer()};
function renderWeeklyInsight(){
  const root=document.getElementById("weeklyInsight");if(!root)return;
  const weekStart=new Date();weekStart.setHours(0,0,0,0);weekStart.setDate(weekStart.getDate()-6);
  const minutes=state.timeLogs.filter(x=>new Date(`${x.date}T12:00:00`)>=weekStart).reduce((a,x)=>a+Number(x.minutes||0),0);
  const target=Math.round(Number(state.settings.weeklyTarget||0)*60),overdue=openTasks().filter(t=>t.due&&t.due<todayISO()),next=openTasks().sort((a,b)=>priorityRank[a.priority]-priorityRank[b.priority]||String(a.due).localeCompare(String(b.due)))[0];
  root.textContent=overdue.length?`Clear "${overdue[0].title}" first — it is overdue.`:next?`${minutes}${target?` of ${target}`:""} minutes logged this week. Next: ${next.title}.`:minutes?`Nice momentum: ${minutes} focused minutes this week. Add a task for your next session.`:"Start with one 25-minute sprint today; consistency beats catching up.";
}
function renderReminderSettings(){
  const enabled=document.getElementById("remindersEnabled"),time=document.getElementById("reminderTime"),status=document.getElementById("reminderStatus");
  if(enabled)enabled.checked=Boolean(state.settings.remindersEnabled);
  if(time)time.value=state.settings.reminderTime||"18:00";
  if(status)status.textContent=state.settings.remindersEnabled?`Reminder set for ${state.settings.reminderTime||"18:00"}.`:"Off until you opt in.";
}
window.toggleReminders=async enabled=>{
  if(enabled&&!("Notification" in window)){toast("Browser notifications are not supported here.");renderReminderSettings();return}
  if(enabled&&Notification.permission!=="granted"){const permission=await Notification.requestPermission();if(permission!=="granted"){toast("Notifications remain off until permission is granted.");renderReminderSettings();return}}
  state.settings.remindersEnabled=enabled;save();renderReminderSettings();toast(enabled?"Browser reminders enabled":"Browser reminders disabled");
};
window.saveReminderTime=value=>{state.settings.reminderTime=value||"18:00";save();renderReminderSettings()};
function checkReminder(){
  if(!state.settings.remindersEnabled||state.settings.smartReminders||!("Notification" in window)||Notification.permission!=="granted")return;
  const now=new Date(),time=state.settings.reminderTime||"18:00",at=`${String(now.getHours()).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}`;
  if(at!==time||localStorage.getItem("studyReminderDate")===todayISO())return;
  const checkedIn=state.timeLogs.some(x=>x.date===todayISO())||state.habits.some(h=>h.done?.[todayISO()]);
  if(!checkedIn){new Notification("A small study check-in?",{body:"Take one focused step in MyProgressTrack."});localStorage.setItem("studyReminderDate",todayISO())}
}
const originalRenderAll=renderAll;
renderAll=function(){originalRenderAll();renderTimer();renderWeeklyInsight();renderReminderSettings()};
window.renderAll=renderAll;
setInterval(checkReminder,60000);
renderAll();
