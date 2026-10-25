import {chromium} from '@playwright/test';
import {spawn} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const preview=spawn(process.execPath,['node_modules/vite/bin/vite.js','preview','--host','127.0.0.1','--port','1432','--strictPort'],{stdio:'ignore'});
let browser;
const report={date:new Date().toISOString(),viewport:{width:1280,height:800},host:'browser fallback, localStorage; network blocked',commands:[],checks:[],errors:[]};
try {
 for(let i=0;i<100;i++){try{if((await fetch('http://127.0.0.1:1432')).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{})});const page=await browser.newPage({viewport:report.viewport});
 page.on('pageerror',e=>report.errors.push(e.message));
 await page.route(/https?:\/\/(?!127\.0\.0\.1:1432)/,r=>r.abort());
 await page.goto('http://127.0.0.1:1432');await page.locator('.mohsen-launch').waitFor();await page.keyboard.press('Control+k');
 const dialog=page.getByRole('dialog',{name:'محسن',exact:true});await dialog.waitFor();
 await page.getByText('لا يوجد خادم محلي متصل — الأدوات المحلية جاهزة').waitFor();
 const rows=[
 ['احسب ٢٥ × ٤','100',false],
 ['حل ٢س + ٤ = ١٠','3',false],
 ['حول ١٠ كم إلى ميل','6.213',false],
 ['احسب ٢٠٪ من ٢٠٠','40',false],
 ['أضف ملاحظة شراء خبز','حُفظ محليًا',false],
 ['اعرض ملاحظاتي','شراء خبز',false],
 ['تذكر أن مدينتي الرياض','حُفظ محليًا',true],
 ['وش تذكر عني','مدينتي الرياض',false],
 ['ذكرني بعد ٥ دقائق اشرب ماء','حُفظ محليًا',true],
 ['قيّم محسن','دقة النواة',false],
 ];
 for(const [command,expected,consent] of rows){
   await page.getByLabel('طلبك لمحسن',{exact:true}).fill(command);await page.getByRole('button',{name:'إرسال',exact:true}).click();
   if(consent){await page.getByRole('alertdialog').waitFor();await page.getByRole('button',{name:'تأكيد',exact:true}).click();}
   const article=page.locator('.mohsen-history article').last();await article.getByText(command,{exact:true}).waitFor();await page.getByRole('button',{name:'إرسال',exact:true}).waitFor();
   await page.waitForFunction(()=>!document.querySelector('#mohsen-input')?.disabled);
   const text=await article.innerText();assert.ok(text.includes(expected),`${command}: ${text}`);
   report.commands.push({command,expected,confirmation:consent,passed:true,result:text});
 }
 await page.getByRole('button',{name:'إغلاق محسن'}).focus();await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement?.textContent),'إعدادات الذكاء والخصوصية');report.checks.push({name:'keyboard reaches collapsed settings',passed:true});
 await page.screenshot({path:'docs/audits/desktop-agent.png'});
 // Deny a mutation and prove there is no state change.
 await page.getByLabel('طلبك لمحسن',{exact:true}).fill('تذكر أن كلمة سرية مرفوضة');await page.getByRole('button',{name:'إرسال',exact:true}).click();await page.getByRole('alertdialog').waitFor();await page.keyboard.press('Control+k');assert.ok(await page.getByRole('alertdialog').isVisible());report.checks.push({name:'Ctrl+K preserves pending consent',passed:true});await page.getByRole('button',{name:'إلغاء',exact:true}).click();await page.waitForFunction(()=>!document.querySelector('#mohsen-input')?.disabled);
 const stored=await page.evaluate(()=>localStorage.getItem('desktop-agent'));assert.ok(!stored.includes('كلمة سرية مرفوضة'));report.checks.push({name:'cancel mutation leaves storage untouched',passed:true});
 // Reload proves actual persisted browser state.
 await page.reload();await page.locator('.mohsen-launch').waitFor();await page.keyboard.press('Control+k');await page.getByLabel('طلبك لمحسن',{exact:true}).fill('اعرض ملاحظاتي');await page.getByRole('button',{name:'إرسال',exact:true}).click();await page.locator('.mohsen-history article').last().getByText(/شراء خبز/).waitFor();report.checks.push({name:'notes survive reload',passed:true});
 await page.keyboard.press('Escape');await dialog.waitFor({state:'hidden'});assert.ok(await page.locator('.mohsen-launch').evaluate(el=>document.activeElement===el));report.checks.push({name:'Ctrl+K, Escape, focus restoration',passed:true});
 await page.emulateMedia({colorScheme:'dark'});const bg=await page.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--color-bg'));assert.ok(bg.includes('101c1a'));report.checks.push({name:'system dark appearance',passed:true});
 assert.deepEqual(report.errors,[]);report.passed=true;
} catch(error){report.passed=false;report.failure=String(error);process.exitCode=1;} finally {await mkdir('docs/audits',{recursive:true});await writeFile('docs/audits/desktop-agent.json',JSON.stringify(report,null,2)+'\n');await browser?.close();preview.kill();}
console.log(JSON.stringify(report,null,2));
