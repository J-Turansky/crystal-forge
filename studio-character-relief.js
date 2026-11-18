/* Original relief silhouettes. Coordinates are normalized to the model width
 * and height. One continuous footprint carries all raised details. */
const animal = (sheep, pose, head, legs) => {
 const lift = pose === 'Alert' ? -.08 : pose === 'Resting' ? .08 : 0;
 const jaw = .29 + .10 * head;
 const foot = .17 + .19 * legs * (pose === 'Resting' ? .40 : 1);
 return [
  [-.47,-.03],[-.39,-.20],[-.26,-.23],
  ...(sheep ? [[-.18,-.31],[-.08,-.25],[.05,-.29],[.16,-.21]] : [[.08,-.21]]),
  [.20,-.23+lift],
  ...(sheep ? [[.19,-.35+lift],[.32,-.34+lift]] : [[.20,-.39+lift],[.27,-.45+lift],[.29,-.31+lift],[.34,-.42+lift],[.39,-.38+lift],[.35,-.28+lift]]),
  [jaw,-.20+lift],[jaw+.05,-.10+lift],[jaw-.02,.01+lift],[.24,.025+lift],
  [.18,.14],[.20,foot],[.08,foot],[.055,.16],[-.18,.16],[-.23,foot],[-.36,foot],[-.31,.13],[-.43,.11]
 ];
};

const radial = (count, radius, twist = 0) => Array.from({length:count},(_,i)=>{
 const angle=i/count*Math.PI*2+twist;
 const r=radius(i,angle);
 return [r*Math.cos(angle),r*Math.sin(angle)];
});

const outlineFor = (character, pose, head, legs) => {
 switch(character){
  case 'Goat': return animal(false,pose,head,legs);
  case 'Sheep': return animal(true,pose,head,legs);
  case 'Cloud': return [[-.46,.08],[-.40,-.10],[-.25,-.17],[-.19,-.30],[-.06,-.36],[.08,-.34],[.22,-.19],[.37,-.17],[.47,.00],[.42,.18],[.26,.25],[-.29,.24],[-.43,.19]];
  case 'Sun': return radial(32,i=>i%4===0?.49:i%4===2?.31:.37);
  case 'Boat': return pose==='Alert'
   ? [[-.49,.12],[-.19,.12],[-.19,-.11],[-.07,-.11],[-.07,-.39],[.18,-.39],[.18,-.11],[.31,-.11],[.31,.12],[.48,.12],[.35,.30],[-.28,.30]]
   : [[-.48,.11],[-.20,.11],[-.15,-.05],[-.09,-.36],[.025,-.40],[.25,-.14],[.30,.11],[.49,.11],[.33,.31],[-.31,.31]];
  default: return [[-.48,-.21],[-.36,-.33],[-.14,-.39],[.14,-.39],[.38,-.32],[.48,-.20],[.19,-.25],[.09,-.24],[.11,.41],[-.09,.41],[-.065,-.24],[-.18,-.25]];
 }
};

const roundedOutline = (points, amount) => {
 if(amount===0)return points;
 const blend=([x,z],[a,b])=>[x+(a-x)*amount,z+(b-z)*amount];
 return points.flatMap((point,i)=>[
  blend(point,points[(i+points.length-1)%points.length]),
  blend(point,points[(i+1)%points.length])
 ]);
};

const motifFor = character => {
 switch(character){
  case 'Goat': return [[-.16,-.02,.14,.105],[.095,.055,.085,.07]];
  case 'Sheep': return [[-.22,-.04,.045,.067],[-.10,-.035,.049,.07],[.015,-.045,.048,.06]];
  case 'Cloud': return [[-.20,.045,.08,.08],[-.015,.00,.08,.095],[.17,.045,.08,.08]];
  case 'Sun': return [[0,0,.20,.20]];
  case 'Boat': return [[-.17,.199,.07,.055],[0,.187,.072,.055],[.17,.199,.07,.055]];
  default: return [[0,-.31,.105,.047],[0,.09,.047,.13]];
 }
};

export function layeredCharacter(p){
 const {width, height, depth, character}=p;
 const outline=roundedOutline(outlineFor(character,p.silhouettePose,p.head,p.legs),p.outlineRoundness)
  .map(([x,z])=>[x*width,z*height]);
 const rise=p.reliefFinish==='Plain'?0:p.reliefRise;
 const positive=[{kind:'extrude',outline,height:depth}];
 if(rise){
  for(const [x,z,rx,rz] of motifFor(character)){
   const centre=[x*width,depth-.36,z*height];
   const domeRadius=(rise+.7)/2;
   // Keep the dome's entire lower edge above the flat bed while it overlaps the backing.
   positive.push(p.reliefFinish==='Domed'
    ? {kind:'sphere',radii:[rx*width,domeRadius,rz*height],position:[centre[0],depth+rise-domeRadius,centre[2]]}
    : {kind:'extrude',outline:radial(32,()=>1).map(([cx,cz])=>[cx*rx*width,cz*rz*height]),height:rise+.36,position:centre});
  }
 }
 return {
  positive,secondary:[],negative:[],materialSplitHeight:depth*.7,materialSplitRole:'top',
  bounds:{width,depth:height,height:depth+rise},
  warnings:['Inspect printed horns, feet and raised edges before participant use.']
 };
}



