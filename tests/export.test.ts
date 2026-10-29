import {describe,it,expect} from 'vitest'
import {csvCell,csvText} from '../src/lib/utils'
describe('review sheet CSV safety',()=>{
 it('neutralizes formulas, including whitespace-prefixed spreadsheet formulas',()=>{for(const s of ['=SUM(1,2)','+cmd','-42','@SUM(A1)','  =HYPERLINK("x")','\tINJECT','\rINJECT'])expect(csvCell(s).startsWith('"\'')).toBe(true)})
 it('quotes delimiters, embedded quotes, and line breaks without damaging normal text',()=>{expect(csvCell('He said "Hi", yes')).toBe('"He said ""Hi"", yes"');expect(csvCell('First\nSecond')).toBe('"First\nSecond"');expect(csvCell('ROLL-01')).toBe('"ROLL-01"')})
 it('writes an Excel-readable UTF-8 BOM and consistent row boundaries',()=>{expect(csvText([['Student','Marks'],['One',90]])).toBe('\ufeff"Student","Marks"\r\n"One","90"')})
})
