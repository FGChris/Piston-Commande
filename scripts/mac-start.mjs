import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {setTimeout as delay} from 'node:timers/promises';

if(process.platform!=='darwin')throw new Error('Ce lanceur est réservé à macOS. Utiliser le guide normal sur Linux.');
if(Number(process.versions.node.split('.')[0])<22)throw new Error('Installez Node.js 24 LTS (22 minimum).');
const children=new Set();let stopping=false;
function start(command,args,options={}){
 const child=spawn(command,args,{stdio:'inherit',...options});
 children.add(child);child.once('exit',()=>children.delete(child));
 const done=new Promise((resolve,reject)=>{child.once('error',reject);child.once('exit',(code,signal)=>code===0||stopping?resolve():reject(new Error(`${command} arrêté (${code??signal}).`)));});
 // Éviter une rejection non traitée pendant l’attente des services.
 done.catch(()=>{});return {child,done};
}
async function run(command,args){await start(command,args).done;}
async function cleanup(){
 if(stopping)return;stopping=true;
 const active=[...children];for(const child of active)child.kill('SIGTERM');
 await Promise.all(active.map(child=>child.exitCode!==null||child.signalCode!==null?Promise.resolve():new Promise(resolve=>child.once('exit',resolve))));
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>{void cleanup().then(()=>process.exit(0));});
async function free(port){
 await new Promise((resolve,reject)=>{const server=createServer();server.once('error',()=>reject(new Error(`Le port ${port} est déjà utilisé. Fermez l’autre lancement de DEPANOS, ou le service qui l’utilise, puis réessayez.`)));server.listen(port,'127.0.0.1',()=>server.close(resolve));});
}
async function ready(service,check,timeout){
 const deadline=Date.now()+timeout;
 while(Date.now()<deadline){
  if(service.child.exitCode!==null||service.child.signalCode!==null){await service.done;throw new Error('Le service s’est arrêté avant d’être prêt.');}
  try{if(await check())return;}catch{}
  await delay(500);
 }
 throw new Error('Le service met trop longtemps à démarrer. Consultez les messages de ce terminal.');
}
try{
 await free(3000);await free(55432);
 await mkdir('.local',{recursive:true,mode:0o700});
 const fingerprint=createHash('sha256').update(await readFile('package-lock.json')).update(process.arch).update(process.versions.node).digest('hex');
 let installed=false;
 try{installed=(await readFile('.local/mac-install.sha256','utf8'))===fingerprint;await access('node_modules/next/package.json');}catch{installed=false;}
 if(!installed){console.log('Installation des dépendances adaptées à votre Mac (Internet nécessaire au premier lancement)…');await run('npm',['ci']);await writeFile('.local/mac-install.sha256',fingerprint,{mode:0o600});}
 const database=start(process.execPath,['scripts/database.mjs']);
 const {default:pg}=await import('pg');
 await ready(database,async()=>{
  const config=JSON.parse(await readFile('.local/postgres.json','utf8'));
  const client=new pg.Client({...config,host:'127.0.0.1',database:'depanos',connectionTimeoutMillis:1000});
  try{await client.connect();await client.query('SELECT 1');return true;}finally{await client.end();}
 },90000);
 await run(process.execPath,['scripts/setup.mjs']);
 const {accounts}=JSON.parse(await readFile('.local/accounts.json','utf8'));
 const account=accounts[0];
 await writeFile('.local/connexion-mac.txt',`DEPANOS — connexion locale sur ce Mac\n\nAdresse : http://127.0.0.1:3000/connexion\nE-mail : ${account.email}\nMot de passe initial : ${account.password}\n\nFichier privé : ne pas transmettre ni déposer dans Git.\nSi vous changez votre mot de passe dans les réglages, utilisez le nouveau : ce fichier ne se met pas à jour.\nLes véhicules DEMO sont fictifs. Les fournisseurs ne sont pas connectés.\n`,{mode:0o600});
 console.log('Préparation de l’application…');await run('npm',['run','build']);
 const application=start(process.execPath,['node_modules/next/dist/bin/next','start','--hostname','127.0.0.1','--port','3000']);
 await ready(application,async()=>{const response=await fetch('http://127.0.0.1:3000/connexion',{signal:AbortSignal.timeout(2000)});return response.ok&&(await response.text()).includes('Bienvenue à l’atelier.');},60000);
 console.log('DEPANOS est prêt. Gardez ce terminal ouvert. Pour arrêter : Ctrl+C.');
 console.log('Pour vos identifiants locaux : double-cliquez sur Voir-mes-acces.command.');
 await run('open',['http://127.0.0.1:3000/connexion']);
 await Promise.race([application.done,database.done]);
}finally{await cleanup();}
