export function routingSummary(plan,settings){
 const route=plan?.wirePlan;
 if(!route?.enabled)return {severity:'info',title:'Cable grooves are off.',body:'Turn on cable grooves when you want channels cut for your LED wires.',details:[]};
 if(route.ready&&route.overLengthCount)return {severity:'warning',title:'Some cable runs need longer wires.',body:'You can prepare these channels. Use cables long enough for the marked runs.',details:route.messages||[]};
 if(route.ready)return {severity:'success',title:'All pixel cables have valid routes.',body:'The checked curves fit within your selected lengths. Prepare the print mesh next.',details:route.messages||[]};
 const invalid=(plan.invalidManualPixels?.length||0)+(plan.invalidManualMounts?.length||0);
 if(invalid)return {severity:'error',title:'Some holes need moving.',body:'Move the red holes inside the base and away from other hardware.',details:route.messages||[]};
 const edge=(settings.wireInputEnabled!==false&&!route.entryAdded)||(settings.wireOutputEnabled!==false&&!route.exitAdded);
 if(edge)return {severity:'error',title:'A pixel cannot reach the base edge.',body:'Try automatic routing, or move the first or last pixel nearer a clear part of the edge.',details:route.messages||[]};
 if(route.overLengthCount)return {severity:'error',title:route.overLengthCount===1?'One cable is too short for this layout.':route.overLengthCount+' cables are too short for this layout.',body:'Enter a longer cable length or turn on “Allow over-length cables” in Build to use length as a warning.',details:route.messages||[]};
 return {severity:'error',title:'A cable route is blocked.',body:'A fixing, another pixel or a tight bend is in the way. Try automatic routing first.',details:route.messages||[]};
}
export function renderFeedback(node,{severity='info',title,body='',details=[]},{fix=null,focus=null}={}){
 if(node.tagName==='P'){const replacement=document.createElement('div');for(const attribute of node.attributes)replacement.setAttribute(attribute.name,attribute.value);node.replaceWith(replacement);node=replacement;}
 node.replaceChildren();node.classList.remove('warning');node.classList.add('issue-box');node.dataset.severity=severity;
 node.setAttribute('role',severity==='error'?'alert':'status');
 const heading=document.createElement('strong');heading.className='issue-heading';
 const icon=document.createElement('span');icon.className='issue-icon';icon.textContent=severity==='error'?'!':severity==='success'?'✓':'i';icon.setAttribute('aria-hidden','true');heading.append(icon,document.createTextNode(title));node.append(heading);
 if(body){const p=document.createElement('p');p.textContent=body;node.append(p);}
 if(fix||focus){const actions=document.createElement('div');actions.className='buttonrow';if(fix){const b=document.createElement('button');b.type='button';b.textContent='Try automatic routing';b.onclick=fix;actions.append(b);}if(focus){const b=document.createElement('button');b.type='button';b.textContent='Show the problem controls';b.onclick=focus;actions.append(b);}node.append(actions);}
 if(details.length){const expanded=document.createElement('details');expanded.className='issue-details';const summary=document.createElement('summary');summary.textContent='Details and measurements';const text=document.createElement('div');for(const line of details){const p=document.createElement('p');p.textContent=line;text.append(p);}expanded.append(summary,text);node.append(expanded);}
}
export function installConciseHelp(root=document){
 for(const note of root.querySelectorAll('.left p.note')){
  if(note.id||note.classList.contains('warning')||note.closest('.control-help')||note.textContent.trim().length<150)continue;
  const details=document.createElement('details');details.className='control-help';const summary=document.createElement('summary');
  summary.textContent=/centre-to-centre|curved|snap/i.test(note.textContent)?'How cable lengths and movement work':/IN.*OUT|pixel.*string/i.test(note.textContent)?'How the pixel string connects':/token|private.*repo/i.test(note.textContent)?'How private backup works':'More about this setting';
  note.before(details);details.append(summary,note);
 }
}
