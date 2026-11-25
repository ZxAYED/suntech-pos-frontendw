/* eslint-disable @typescript-eslint/no-require-imports */
// Runs the actual recovery modules in a real Chromium profile, NOT the full Next app.
// No Playwright dependency is needed for this narrow localStorage persistence check.
const http = require("node:http");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { spawn } = require("node:child_process");
const ts = require("typescript");
const assert = require("node:assert/strict");
const root = path.resolve(__dirname, "..");
const modules = ["lib/idempotency", "lib/financial-operation", "lib/register-guard", "redux/storage", "lib/register-transition"];
const bundle = `const modules={};const exportsCache={};\n` + modules.map(name => {
  const js = ts.transpileModule(fs.readFileSync(path.join(root, "src", `${name}.ts`), "utf8"), {compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  return `modules[${JSON.stringify(name)}]=function(module,exports,require){\n${js}\n};`;
}).join("\n") + `\nfunction load(id){id=id.replace(/^@\\//,"");if(!exportsCache[id]){const m={exports:{}};exportsCache[id]=m;modules[id](m,m.exports,load);}return exportsCache[id].exports;}\n`;
const smoke = `
const scope={userId:"browser-u",businessId:"browser-b",locationId:"browser-l"};
const line={variantId:"v",name:"Shirt",sku:"S",unitPrice:500,quantity:1,stock:9};
const ticket={...scope,id:"held-browser",label:"Held",createdAt:"2026-11-24T00:00:00Z",lines:[line],paymentMethod:"COD",tendered:"1000",customerName:"Test Customer"};
const current={cart:[line],heldTickets:[],paymentMethod:"COD",tendered:"1000",customerName:"Test Customer"};
const {commitRegisterTransition:change}=load("lib/register-transition");
const {registerGuard:guard}=load("lib/register-guard");
const {financialOperations:ops}=load("lib/financial-operation");
const {loadSavedDrafts}=load("redux/storage");
const check=(condition,message)=>{if(!condition)throw new Error(message);};
try {
  if(location.pathname==="/seed") {
    localStorage.clear();sessionStorage.clear();
    check(guard.saveDraft(scope.userId,scope.businessId,scope.locationId,current),"initial save failed");
    const result=change(scope,current,[],{type:"hold",draft:ticket});
    check(result.ok,"hold failed");
    check(loadSavedDrafts().length===1,"held list missing");
    check(guard.getDraft(scope.userId,scope.businessId,scope.locationId).cart.length===0,"cart not cleared after commit");
    const op={...scope,operationType:"catalog_sale"};
    const first=ops.getOrCreateKey(op,{total:500});
    ops.recordOutcome(op,"unknown");
    check(ops.getOrCreateKey(op,{total:500}).key===first.key,"identity changed");
    check(ops.reconcileOperation(op,"test confirmation")===true,"archive failed");
    check(ops.getArchivedOperation(op,first.key).key===first.key,"archive missing");
    check(ops.getArchivedOperation({...op,locationId:"other"},first.key)===null,"foreign scope exposed");
  } else {
    const held=loadSavedDrafts();
    const draft=guard.getDraft(scope.userId,scope.businessId,scope.locationId);
    check(held.length===1 && held[0].id===ticket.id,"held ticket lost after browser close/reopen");
    check(draft && draft.cart.length===0,"active cart resurrected");
    const result=change(scope,draft,held,{type:"resume",draftId:ticket.id});
    check(result.ok,"resume failed");
    check(result.register.cart[0].variantId===line.variantId && result.register.tendered==="1000","resumed facts differ");
    check(loadSavedDrafts().length===0,"held record not removed");
    check(guard.getDraft(scope.userId,scope.businessId,"wrong")===null,"wrong scope has draft");
  }
  document.body.dataset.result="PASS";document.body.textContent="PASS "+location.pathname;
} catch(e){document.body.dataset.result="FAIL";document.body.textContent="FAIL "+String(e);}
`;
const server = http.createServer((req,res)=>{
  res.writeHead(200,{"content-type":"text/html; charset=utf-8","cache-control":"no-store"});
  res.end(`<!doctype html><html><body data-result="NOT_RUN"><script>${bundle}\n${smoke}</script></body></html>`);
});
const profile = fs.mkdtempSync(path.join(os.tmpdir(),"suntech-recovery-browser-"));
function browser(url) {
  return new Promise((resolve,reject)=>{
    const child=spawn(process.env.CHROMIUM_BIN || "chromium",["--headless=new","--no-sandbox","--disable-dev-shm-usage","--disable-background-networking","--no-first-run","--no-default-browser-check",`--user-data-dir=${profile}`,"--dump-dom",url],{stdio:["ignore","pipe","pipe"]});
    let out="",err=""; const timer=setTimeout(()=>{child.kill("SIGKILL");reject(new Error("Chromium timed out"));},20000);
    child.stdout.on("data",d=>out+=d);child.stderr.on("data",d=>err+=d);
    child.on("error",e=>{clearTimeout(timer);reject(e);});child.on("close",code=>{clearTimeout(timer); if(code!==0)reject(new Error(`Chromium exit ${code}: ${err.slice(-1000)}`));else resolve(out);});
  });
}
(async()=>{
  try {
    await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
    const base=`http://127.0.0.1:${server.address().port}`;
    for(const route of ["/seed","/restore"]){const dom=await browser(base+route);assert.match(dom,/<body data-result="PASS">PASS /,dom.slice(-1000));console.log(`PASS ${route}`);}
    console.log("2 browser helper checks passed (real localStorage; same browser profile).");
  } catch(error){console.error(error);process.exitCode=1;} finally {server.close();fs.rmSync(profile,{recursive:true,force:true});}
})();
