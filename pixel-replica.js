// Positive, nominal 1:1 hardware model. Coordinates are Y-up millimetres,
// matching prepareRecipe; the shared material exporter transforms to Z-up.
export function makePixelReplicaRecipe(profile){
 const {bodyDiameter:a,bodyHeight:b,flangeDiameter:c,flangeHeight:d,capHeight:e,wireWidth:f,wireDepth:g}=profile;
 if(![a,b,c,d,e,f,g].every(Number.isFinite)||a<2||a>30||b<3||b>50||c<a||c>38||d<0||d>10||e<=0||e>12||d+e>=b)
  throw Error('Enter valid A–E dimensions. Flange and cap heights must leave a straight body within total length B.');
 if(d===0&&c!==a)throw Error('Set C to body diameter A if flange height D is zero.');
 if(f<0||f>12||g<0||g>8||(f===0)!==(g===0)||f>=a||g>=b-e)
  throw Error('Set both F and G to zero for no recess, or keep F narrower than A and G below the dome.');
 const body=a/2,flange=c/2,baseRadius=d>0?flange:body,capStart=b-e;
 const rings=[[0,baseRadius,baseRadius]];
 if(d>0&&c>a)rings.push([d,flange,flange],[d,body,body]);
 for(let i=0;i<20;i++){
  const angle=i*Math.PI/40,y=capStart+e*Math.sin(angle),radius=body*Math.cos(angle);
  rings.push([y,radius,radius]);
 }
 const negative=[];
 if(f>0){
  // F and G specify width and vertical depth only. Each relief extends
  // halfway into its side of the body, preserving the central web.
  const inner=body/2,outer=baseRadius+1,cutLength=outer-inner;
  for(const sign of [-1,1])negative.push({kind:'box',size:[cutLength,g+1,f],
   position:[sign*(inner+outer)/2,(g-1)/2,0]});
 }
 return {bounds:{width:2*baseRadius,depth:2*baseRadius,height:b},
  positive:[{kind:'ring-solid',rings,top:b}],negative,secondary:[]};
}
