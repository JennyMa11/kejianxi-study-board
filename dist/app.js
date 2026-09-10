const STORAGE_KEY = "kejianxi-tasks-v1";
const seedTasks = [
  {id:"seed-1",title:"复习概率论第三章",course:"概率论",duration:45,priority:true,done:false},
  {id:"seed-2",title:"整理编程课实验笔记",course:"程序设计",duration:30,priority:false,done:false},
  {id:"seed-3",title:"阅读英文论文两页",course:"学术英语",duration:25,priority:false,done:false}
];
const el = {
  today:document.querySelector("#today"),list:document.querySelector("#taskList"),
  progressText:document.querySelector("#progressText"),progressBar:document.querySelector("#progressBar"),progressHint:document.querySelector("#progressHint"),
  all:document.querySelector("#allCount"),active:document.querySelector("#activeCount"),done:document.querySelector("#doneCount"),
  dialog:document.querySelector("#taskDialog"),form:document.querySelector("#taskForm"),title:document.querySelector("#taskTitle"),course:document.querySelector("#taskCourse"),
  duration:document.querySelector("#taskDuration"),priority:document.querySelector("#taskPriority"),error:document.querySelector("#formError"),toast:document.querySelector("#toast")
};
let tasks = load();
let filter = "all";
let toastTimer;
function load(){
  try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY));return Array.isArray(saved)?saved:seedTasks;}catch(error){return seedTasks;}
}
function save(){localStorage.setItem(STORAGE_KEY,JSON.stringify(tasks));}
function safe(value){return String(value).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function color(course){const colors=["blue","cyan","violet"];let score=0;for(const c of course)score+=c.charCodeAt(0);return colors[score%3];}
function visible(){if(filter==="done")return tasks.filter(function(t){return t.done;});if(filter==="active")return tasks.filter(function(t){return !t.done;});return tasks;}
function render(){
  const shown=visible();
  const completed=tasks.filter(function(t){return t.done;}).length;
  const percent=tasks.length?Math.round(completed/tasks.length*100):0;
  el.progressText.textContent=completed+" / "+tasks.length;
  el.progressBar.style.width=percent+"%";
  el.progressHint.textContent=!tasks.length?"先记下第一件学习任务。":completed===tasks.length?"今天的任务全部完成，很棒。":completed?"已经完成 "+percent+"%，继续保持。":"从一件小事开始。";
  el.all.textContent=tasks.length;el.active.textContent=tasks.length-completed;el.done.textContent=completed;
  if(!shown.length){
    const text=filter==="done"?["还没有已完成任务","完成一项后，它会出现在这里。"]:filter==="active"?["进行中的任务已清空","可以休息一下，或添加新的任务。"]:["清单还是空的","添加一项任务，为今天定个小目标。"];
    el.list.innerHTML='<div class="empty-state"><div class="empty-icon">✓</div><h3>'+text[0]+"</h3><p>"+text[1]+"</p></div>";
    return;
  }
  el.list.innerHTML=shown.map(function(t){
    return '<article class="task-row'+(t.done?' is-done':'')+'" data-id="'+t.id+'"><button class="check" type="button" data-action="toggle" aria-label="'+(t.done?'恢复':'完成')+'：'+safe(t.title)+'" aria-pressed="'+t.done+'"></button><div class="task-main"><h3>'+safe(t.title)+'</h3><p><span class="course-tag '+color(t.course)+'">'+safe(t.course)+'</span><span>'+t.duration+' 分钟</span></p></div>'+(t.priority?'<span class="priority">重点</span>':'<span class="priority-placeholder"></span>')+'<button class="delete-button" type="button" data-action="delete" aria-label="删除：'+safe(t.title)+'">×</button></article>';
  }).join("");
}
function syncFilters(){document.querySelectorAll(".filter").forEach(function(button){const active=button.dataset.filter===filter;button.classList.toggle("is-active",active);button.setAttribute("aria-pressed",String(active));});}
function toast(message){clearTimeout(toastTimer);el.toast.textContent=message;el.toast.classList.add("is-visible");toastTimer=setTimeout(function(){el.toast.classList.remove("is-visible");},1800);}
function addTask(input){
  const title=String(input.title||"").trim(),course=String(input.course||"").trim(),duration=Number(input.duration);
  if(!title||!course||![15,25,30,45,60,90].includes(duration))throw new Error("请填写任务名称、课程并选择有效用时。");
  const task={id:crypto.randomUUID(),title:title,course:course,duration:duration,priority:Boolean(input.priority),done:false};
  tasks.unshift(task);filter="all";save();syncFilters();render();return task;
}
el.today.textContent=new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(new Date());
document.querySelector("#addTaskButton").addEventListener("click",function(){el.form.reset();el.duration.value="45";el.error.textContent="";el.dialog.showModal();requestAnimationFrame(function(){el.title.focus();});});
document.querySelector("#closeDialog").addEventListener("click",function(){el.dialog.close();});
document.querySelector("#cancelDialog").addEventListener("click",function(){el.dialog.close();});
el.dialog.addEventListener("click",function(event){if(event.target===el.dialog)el.dialog.close();});
el.form.addEventListener("submit",function(event){event.preventDefault();try{addTask({title:el.title.value,course:el.course.value,duration:el.duration.value,priority:el.priority.checked});el.dialog.close();toast("任务已加入今天的清单");}catch(error){el.error.textContent=error.message;}});
document.querySelector(".filters").addEventListener("click",function(event){const button=event.target.closest(".filter");if(!button)return;filter=button.dataset.filter;syncFilters();render();});
el.list.addEventListener("click",function(event){
  const action=event.target.closest("[data-action]"),row=event.target.closest("[data-id]");if(!action||!row)return;
  const task=tasks.find(function(t){return t.id===row.dataset.id;});if(!task)return;
  if(action.dataset.action==="toggle"){task.done=!task.done;save();render();toast(task.done?"完成一项，继续加油":"任务已恢复");}
  if(action.dataset.action==="delete"){tasks=tasks.filter(function(t){return t.id!==task.id;});save();render();toast("任务已删除");}
});
function registerWebMcp(){
  const context=document.modelContext;if(!context||!context.registerTool)return;
  Promise.resolve(context.registerTool({name:"create_study_task",title:"添加学习任务",description:"向今天的清单添加一项学习任务。",inputSchema:{type:"object",properties:{title:{type:"string"},course:{type:"string"},duration:{type:"integer",enum:[15,25,30,45,60,90]},priority:{type:"boolean"}},required:["title","course","duration"],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:function(input){const t=addTask(input||{});return{id:t.id,title:t.title,status:"active"};}})).catch(function(){});
}
syncFilters();render();registerWebMcp();
