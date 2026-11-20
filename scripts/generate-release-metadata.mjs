import {readFileSync,writeFileSync} from 'node:fs';
import {parseReleaseHistory,renderReleaseHistory,releaseStart,releaseEnd} from './release-history.mjs';

const filename=new URL('../index.html',import.meta.url);
const source=readFileSync(filename,'utf8');
const changelog=readFileSync(new URL('../CHANGELOG.md',import.meta.url),'utf8');
const history=parseReleaseHistory(changelog);
const start=source.indexOf(releaseStart),end=source.indexOf(releaseEnd,start);
if(start<0||end<0)throw Error('Missing generated release history markers in index.html.');
const newline=source.includes('\r\n')?'\r\n':'\n';
const updated=(source.slice(0,start)+renderReleaseHistory(history).replace(/\n/g,newline)+source.slice(end+releaseEnd.length))
 .replace(/(<span class="version">)v[^ <]+/, '$1v'+history.releaseNotes[0].version);
if(process.argv.includes('--check')){
 if(updated!==source)throw Error('Run node scripts/generate-release-metadata.mjs to update the app from CHANGELOG.md.');
}else if(updated!==source)writeFileSync(filename,updated);
