// Test-only BFF fixture and static host. Production has no /__test endpoints.
// Serves the real minified offline build: every screen and storage writer is production code.
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { generateKeyPairSync, sign, randomUUID } from 'node:crypto';
const publicDir=resolve('public');
const {privateKey,publicKey}=generateKeyPairSync('ec',{namedCurve:'prime256v1'});
const jwk=publicKey.export({format:'jwk'});
const user={id:'a118dcb0-11d2-4444-8888-000000000001',fullName:'Offline Test Cashier',role:'CASHIER',status:'ACTIVE',businessId:'a118dcb0-11d2-4444-8888-000000000002',locationId:'a118dcb0-11d2-4444-8888-000000000003',locationName:'Test Branch',publicId:'TEST-CASHIER'};
const business={id:user.businessId,name:'Offline Test Shop',code:'TEST',status:'ACTIVE'};
const location={id:user.locationId,name:'Test Branch',businessId:business.id,status:'ACTIVE'};
const variant={id:'a118dcb0-11d2-4444-8888-000000000004',productId:'a118dcb0-11d2-4444-8888-000000000005',sku:'SHIRT-RED',barcode:'1000001',name:'Red',sellingPrice:250,stock:1,isActive:true,images:[]};
const product={id:variant.productId,name:'Test Shirt',categoryId:'a118dcb0-11d2-4444-8888-000000000006',isActive:true,variants:[variant]};
const category={id:product.categoryId,name:'Clothing',products:[product],isActive:true};
let state={apiDown:false,frontendDown:false,syncMode:'accept',sessionStatus:200,role:'CASHIER'};
const ledger=new Map();const calls=[];
function send(res,status,data){res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));}
function sessionUser(){return{...user,role:state.role};}
function bootstrap(deviceId){
 const categories=structuredClone([category]);
 categories[0].products[0].variants[0].stock=1-[...ledger.values()].reduce((sum,order)=>sum+order.lines.filter(l=>l.variantId===variant.id).reduce((n,l)=>n+l.quantity,0),0);
 const now=new Date().toISOString();
 return{serverTime:now,snapshotGeneratedAt:now,businessTimezone:'Asia/Dhaka',maxFutureSkewSeconds:300,user:sessionUser(),business,location,categories,products:categories.flatMap(c=>c.products),paymentMethods:['COD','BKASH','NAGAD','BANK'],manifest:{version:2,snapshotId:randomUUID(),complete:true,counts:{categories:1,products:1,variants:1},scope:{userId:user.id,businessId:business.id,locationId:location.id},history:{complete:false,limit:100},acceptedIdsComplete:true},history:[...ledger.values()],acceptedClientOrderIds:[...ledger.values()].filter(order=>order.deviceId===deviceId).map(order=>order.clientOrderId),acceptedIdsComplete:true};
}
function provision(body){
 const claims={version:1,iss:'suntech-pos',aud:'suntech-offline',jti:randomUUID(),sub:user.id,userId:user.id,businessId:business.id,locationId:location.id,deviceId:body.deviceId,role:state.role,iat:Math.floor(Date.now()/1000)-1,exp:Math.floor(Date.now()/1000)+3600,permissions:['CATALOG_SALE','CUSTOM_SALE'],offlineIntakeAllowed:true,capturedPriceAllowed:true};
 const input=`${Buffer.from(JSON.stringify({alg:'ES256',kid:'browser-test'})).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`;
 const signature=sign('sha256',Buffer.from(input),{key:privateKey,dsaEncoding:'ieee-p1363'}).toString('base64url');
 return{claims,grantToken:`${input}.${signature}`,verificationKey:{kid:'browser-test',jwk},bootstrap:bootstrap(body.deviceId)};
}
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://127.0.0.1');let body={};
  if(req.method==='POST'){const chunks=[];for await(const chunk of req)chunks.push(chunk);const value=Buffer.concat(chunks).toString();if(value)body=JSON.parse(value);}
  if(url.pathname==='/__test/control'){Object.assign(state,body);if(body.reset){ledger.clear();calls.length=0;state={apiDown:false,frontendDown:false,syncMode:'accept',sessionStatus:200,role:'CASHIER'};}send(res,200,{state});return;}
  if(url.pathname==='/__test/state'){send(res,200,{state,calls,orders:[...ledger.values()]});return;}
  if(url.pathname.startsWith('/api/')){
   calls.push({path:url.pathname,method:req.method,body,timestamp:Date.now()});
   if(state.apiDown){send(res,503,{message:'Test backend unavailable'});return;}
   if(url.pathname==='/api/session'){send(res,state.sessionStatus,state.sessionStatus===200?{user:sessionUser()}:{message:'Session unavailable'});return;}
   if(url.pathname==='/api/v1/auth/logout'){state.sessionStatus=401;send(res,200,{success:true});return;}
   if(url.pathname==='/api/v1/offline/provision'){send(res,200,provision(body));return;}
   if(url.pathname==='/api/v1/orders/sync-v2/validate'){send(res,200,{valid:true});return;}
   if(url.pathname==='/api/v1/orders/sync-v2'){
    if(state.syncMode==='unavailable'){send(res,503,{message:'Sync temporarily unavailable'});return;}
    const results=[];
    for(const event of body.orders){
     const existing=ledger.get(event.clientOrderId);
     const total=event.lines.reduce((sum,line)=>sum+line.quantity*line.unitPrice,0);
     const order=existing??{id:randomUUID(),clientOrderId:event.clientOrderId,invoiceNumber:`INV-${ledger.size+1}`,type:event.orderType,orderType:event.orderType,status:'PAID',paymentMethod:event.paymentMethod,businessId:body.businessId,locationId:body.locationId,deviceId:body.deviceId,cashierId:event.userId,cashier:sessionUser(),businessName:business.name,locationName:location.name,shiftId:event.shiftId,subtotal:total,totalAmount:total,tenderedAmount:event.tenderedAmount,changeDue:event.paymentMethod==='COD'?event.tenderedAmount-total:0,occurredAt:event.occurredAt,createdAt:new Date().toISOString(),customerName:event.customerName,customerPhone:event.customerPhone,lines:event.lines.map(line=>({...line,id:randomUUID(),productName:line.productName||'Test Shirt',variantName:line.variantName||'Red',subtotal:line.quantity*line.unitPrice}))};
     ledger.set(event.clientOrderId,order);results.push({clientOrderId:event.clientOrderId,status:existing?'DUPLICATE':'ACCEPTED',retryable:false,order,warnings:[]});
    }
    if(state.syncMode==='drop-once'){state.syncMode='accept';res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.write('{"results":');setTimeout(()=>req.socket.destroy(),30);return;}
    send(res,200,{results});return;
   }
   if(url.pathname==='/api/v1/shifts/active'){send(res,404,{message:'No active shift'});return;}
   if(url.pathname.includes('/businesses')){send(res,200,[{...business,locations:[location]}]);return;}
   if(url.pathname.includes('/categories')){send(res,200,[category]);return;}
   if(url.pathname.includes('/variants')){send(res,200,{data:[{...variant,product}],meta:{page:1,total:1,limit:30,totalPages:1}});return;}
   if(url.pathname==='/api/v1/orders'){send(res,200,{items:[...ledger.values()],total:ledger.size,page:1,limit:20});return;}
   send(res,404,{message:'Fixture has no such API'});return;
  }
  if(state.frontendDown){res.writeHead(503,{'Content-Type':'text/plain'});res.end('Test frontend unavailable');return;}
  let file=resolve(publicDir,`.${decodeURIComponent(url.pathname)}`);
  if(!file.startsWith(publicDir+sep)&&file!==publicDir){res.writeHead(403);res.end();return;}
  if(!extname(url.pathname)){const build=JSON.parse(await readFile(resolve(publicDir,'offline-build.json'),'utf8'));file=resolve(publicDir,`.${build.shell}`);}
  const data=await readFile(file);
  const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.woff2':'font/woff2'}[extname(file)]??'application/octet-stream';
  res.writeHead(200,{'Content-Type':mime,'Cache-Control':'no-store','Service-Worker-Allowed':'/'});res.end(data);
 }catch(error){res.writeHead(500,{'Content-Type':'text/plain'});res.end(String(error));}
});
server.listen(Number(process.env.PWA_TEST_PORT||4178),'127.0.0.1',()=>console.log('PWA browser fixture listening on 4178'));
