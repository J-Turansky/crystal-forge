const esc=value=>value.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const display=value=>esc(value.replace(/\[([^\]]+)\]\([^)]*\)/g,'$1').replace(/\*\*|\x60/g,''));
export const releaseStart='<!-- BEGIN GENERATED RELEASE HISTORY -->';
export const releaseEnd='<!-- END GENERATED RELEASE HISTORY -->';

export function parseReleaseHistory(markdown){
 const text=markdown.replace(/\r\n/g,'\n');
 const headings=[...text.matchAll(/^## v(\d+\.\d+(?:\.\d+)?(?:-[\w.]+)?) — (.+)$/gm)];
 if(!headings.length)throw Error('Add a versioned release heading to CHANGELOG.md.');
 const list=section=>section.split('\n').filter(line=>line.startsWith('- ')).map(line=>line.slice(2));
 const draft=text.slice(0,headings[0].index);
 const releaseNotes=headings.map((heading,i)=>({
  version:heading[1],title:heading[2],
  notes:list(text.slice(heading.index+heading[0].length,headings[i+1]?.index))
 }));
 return {draft:/^## Unreleased\b/m.test(draft)?list(draft):[],releaseNotes};
}

export function renderReleaseHistory({draft,releaseNotes}){
 const [latest,...older]=releaseNotes;
 const notes=(items,escape=display)=>'<ul>'+items.map(note=>'<li>'+escape(note)+'</li>').join('')+'</ul>';
 const versionTitle=release=>'v'+release.version+' — '+esc(release.title);
 const current='<div class="release" id="currentRelease"><strong>'+versionTitle(latest)+'</strong>'+notes(latest.notes,esc)+'</div>';
 const draftSection=draft.length?'<section class="release release-draft" aria-label="Unreleased changes"><strong>Unreleased WT-021 draft</strong>'+
  notes(draft.slice(0,5))+(draft.length>5?'<details><summary>More draft changes</summary>'+notes(draft.slice(5))+'</details>':'')+'</section>':'';
 const archive=older.length?'<details class="release release-archive"><summary>Earlier releases</summary>'+
  older.map(release=>'<details class="release"><summary>'+versionTitle(release)+'</summary>'+notes(release.notes)+'</details>').join('\n')+'</details>':'';
 return [releaseStart,current,draftSection,archive,releaseEnd].filter(Boolean).join('\n');
}
