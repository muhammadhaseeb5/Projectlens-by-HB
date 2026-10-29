import { describe,it,expect } from 'vitest'
import { zipSync,strToU8 } from 'fflate'
import { readArchive,analyzeFiles,validatePath,skipReason } from '../supabase/functions/analyze-source/analyzer'
describe('bounded source processing',()=>{
 it('rejects traversal, Windows paths, control characters, and absolute paths',()=>{
  for(const p of ['../secret','a/../b','/etc/passwd','C:/windows','a\\b','a\0b'])expect(()=>validatePath(p)).toThrow()
 })
 it('excludes dependency, build, and secret files',()=>{
  for(const p of ['node_modules/react/index.js','dist/main.js','.env','.env.local','keys/private.key','.git/config'])expect(skipReason(p)).toBeTruthy()
  expect(skipReason('src/App.tsx')).toBeNull()
 })
 it('indexes only safe supported archive content',()=>{
  const bytes=zipSync({'src/App.tsx':strToU8('export default function App(){ return <img src="test.png"/> }'),'README.md':strToU8('Setup'),'node_modules/test.js':strToU8('secret'),'.env':strToU8('PRIVATE=hidden')})
  const {extracted}=readArchive(bytes);expect([...extracted.keys()].sort()).toEqual(['README.md','src/App.tsx'])
  const result=analyzeFiles(extracted,['Responsive layout']);expect(result.checked).toEqual(['src/App.tsx']);expect(result.findings.some(f=>f.rule==='accessibility/image-alt'&&f.line===1)).toBe(true);expect(result.findings.find(f=>f.rule==='assignment/source-evidence')?.explanation).toContain('does not prove')
 })
 it('rejects too many entries, dangerous programs, and oversized expanded archives',()=>{
  expect(()=>readArchive(zipSync(Object.fromEntries(Array.from({length:401},(_,i)=>['f'+i+'.txt',strToU8('x')]))))).toThrow(/400/)
  expect(()=>readArchive(zipSync({'run.exe':strToU8('x')}))).toThrow(/Executable/)
  expect(()=>readArchive(zipSync({'big.txt':new Uint8Array(26*1024*1024)}))).toThrow(/25 MB/)
 })
 it('rejects encrypted archives and directories with traversal',()=>{
  const encrypted=zipSync({'app.js':strToU8('x')});for(let i=0;i<encrypted.length-8;i++){const dv=new DataView(encrypted.buffer);if(dv.getUint32(i,true)===0x02014b50)dv.setUint16(i+8,1,true)}expect(()=>readArchive(encrypted)).toThrow(/Encrypted/)
  expect(()=>readArchive(zipSync({'../escape.js':strToU8('x')}))).toThrow(/Unsafe/)
 })
 it('reports heuristics as evidence and never awards a grade',()=>{
  const result=analyzeFiles(new Map([['src/main.tsx',strToU8('const authentication = true; console.log(authentication)')]]),['Authentication'])
  expect(result.findings.find(f=>f.rule==='assignment/source-evidence')?.explanation).toContain('Functionality is not verified')
  expect(JSON.stringify(result)).not.toMatch(/plagiarism|grade|approved/)
 })
 it('does not treat code as executable or HTML',()=>{
  const result=analyzeFiles(new Map([['src/main.js',strToU8('throw new Error("Must never execute"); eval("alert(1)")')]]))
  expect(result.findings.some(f=>f.rule==='javascript/dynamic-eval')).toBe(true)
 })
 it('bounds decompression even if both ZIP headers lie about expanded size',()=>{
  const bytes=zipSync({'forged.js':new Uint8Array(8*1024*1024)}),dv=new DataView(bytes.buffer)
  for(let i=0;i<bytes.length-46;i++){const signature=dv.getUint32(i,true);if(signature===0x04034b50)dv.setUint32(i+22,0,true);if(signature===0x02014b50)dv.setUint32(i+24,0,true)}
  expect(()=>readArchive(bytes)).toThrow(/processing limit|size does not match/i)
 })
})
