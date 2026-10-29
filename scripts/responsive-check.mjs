const base=process.env.BASE_URL||'http://localhost:3000'
import { chromium,expect } from '@playwright/test'
import fs from 'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true})
await fs.mkdir('test-results',{recursive:true})
const routes=['/','/login','/register','/teacher-setup','/reset-password','/demo','/demo/projects','/demo/assignments','/demo/assignments/assignment-0','/demo/assignments/new','/demo/projects/project-0','/demo/classes','/demo/students','/demo/notifications','/demo/reports','/demo/settings','/demo/guide']
const issues=[];let checked=0
for(const width of [360,768,1024,1440]){
 const page=await browser.newPage({viewport:{width,height:1000}})
 page.on('pageerror',e=>issues.push({width,error:e.message}))
 for(const route of routes){
  await page.goto(base+route);await page.waitForLoadState('networkidle')
  const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1)
  if(overflow)issues.push({width,route,error:'Horizontal page overflow'})
  if(!(await page.locator('h1').count()))issues.push({width,route,error:'Missing page heading'})
  if(['/','/demo','/demo/projects','/login'].includes(route))await page.screenshot({path:`test-results/${route==='/'?'landing':route.replaceAll('/','-').slice(1)}-${width}.png`,fullPage:true})
  checked++
 }
 if(width===1440){await page.goto(base+'/demo/projects');await page.getByRole('button',{name:'Table view',exact:true}).click();if(await page.locator('tbody tr').count()!==3)issues.push({error:'Table view missing examples'});await page.getByRole('button',{name:'Section A',exact:true}).click();if(await page.locator('tbody tr').count()!==1)issues.push({error:'Section filter incorrect'});await page.getByRole('button',{name:'All sections',exact:true}).click();await page.getByRole('textbox',{name:'Search project library'}).fill('Cellwise');await expect(page.locator('tbody tr')).toHaveCount(1);if(await page.locator('tbody tr').count()!==1)issues.push({error:'Library search incorrect'});await page.getByRole('button',{name:/^Filters/}).click();await page.screenshot({path:'test-results/library-filters.png',fullPage:true});}
 await page.close()
}
await browser.close();await fs.writeFile('test-results/responsive.json',JSON.stringify({checked,issues},null,2));console.log(JSON.stringify({checked,issues}));if(issues.length)process.exitCode=1
