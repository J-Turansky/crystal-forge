const descriptions=[
 [/Zero-infill base/i,'Shape the empty space inside the base.'],
 [/Shared hollow/i,'Choose whether the crystals are hollow.'],
 [/Hardware hole/i,'Place holes for lights and fixings.'],
 [/Manufacturing geometry/i,'Inspect the shape that will be printed.'],
 [/Fabrication assurance/i,'Review possible printing problems.'],
 [/Model information/i,'Check the model’s size and complexity.'],
 [/Generate a formation/i,'Choose how your crystals grow.'],
 [/Crystal shap/i,'Change the crystals’ shape and feel.'],
 [/Integrated base/i,'Choose the shape underneath your model.'],
 [/Lighting|pixel|LED/i,'Make room for your lights and cables.'],
 [/Mount/i,'Choose how the model attaches.'],
 [/wire|cable/i,'Plan the path between your lights.'],
 [/Printer/i,'Choose the machine you will print with.'],
 [/Cura/i,'Choose settings for your 3D printer.'],
 [/Fabrication status/i,'Check what still needs testing.'],
 [/Prepare|manufactur/i,'Turn your design into a print file.'],
 [/Split/i,'Divide a large model into smaller pieces.'],
 [/Export|Production/i,'Download your model and build notes.'],
 [/Object tree/i,'See the parts inside this model.'],
 [/Batch/i,'Change several crystals together.'],
 [/Selection|Selected/i,'Adjust the part you have picked.'],
 [/Appearance|Colour/i,'Change how your model looks on screen.'],
 [/Save|Project|template/i,'Keep designs you want to use again.'],
 [/Fit|calibrat/i,'Check how your real parts fit.'],
 [/View|inspect/i,'Look at your model from different angles.']
];
export function sectionDescription(title){return descriptions.find(([pattern])=>pattern.test(title))?.[1]||'Open to see the choices and settings.';}
export function installCollapsibleSections(root=document){
 for(const card of root.querySelectorAll('.left .card,.right .card')){
  if(card.tagName==='DETAILS'||card.id==='contextHelp')continue;
  const header=card.querySelector(':scope > .cardtitle');if(!header)continue;
  const details=document.createElement('details');
  for(const attribute of card.attributes)details.setAttribute(attribute.name,attribute.value);
  details.classList.add('collapsible-section');
  const summary=document.createElement('summary');summary.className='cardtitle';
  const title=document.createElement('span');title.className='section-heading-row';
  while(header.firstChild)title.appendChild(header.firstChild);
  const descriptor=document.createElement('span');descriptor.className='section-descriptor';
  descriptor.textContent=sectionDescription(title.textContent);
  summary.append(title,descriptor);details.appendChild(summary);header.remove();
  while(card.firstChild)details.appendChild(card.firstChild);
  card.replaceWith(details);
 }
}
