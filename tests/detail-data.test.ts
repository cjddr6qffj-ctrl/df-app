import test from 'node:test';
import assert from 'node:assert/strict';
import {parsePrice,cleanOem,detailIsValid} from '../scripts/detail-data.mjs';
test('selected EUR price excludes VAT and old price',()=>{
 assert.equal(parsePrice('711.40€\n Kainos nurodytos su 21% PVM\n Įprasta kaina: 900.00€'),711.4);
 assert.equal(parsePrice('1 234,56€'),1234.56);
 assert.equal(parsePrice('1,160.10€'),1160.10);
 assert.equal(parsePrice('1.160,10€'),1160.10);
 assert.equal(parsePrice('12,345.67€'),12345.67);
 assert.equal(parsePrice('1,23,4.56€'),null);
 assert.equal(parsePrice(null),null);
 assert.equal(parsePrice('Signedos Sandėliai - 460.10€'),null);
 assert.equal(parsePrice('Nėra'),null);
});
test('OEM punctuation duplicates merge without losing distinct part numbers',()=>{
 assert.deepEqual(cleanOem(['5R3Z-17E857AA','5R3Z17E857AA','5R3Z17E856AA']),['5R3Z-17E857AA','5R3Z17E856AA']);
});
test('details must match exact SKU and source URL',()=>{
 const d={sku:'ABC',url:'https://www.signeda.lt/a-p1',title:'Part ABC',checkedAt:'2026-11-16T12:00:00.000Z'};
 assert.equal(detailIsValid(d,'ABC',d.url),true);
 assert.equal(detailIsValid(d,'ABCD',d.url),false);
 assert.equal(detailIsValid(d,'ABC','https://www.signeda.lt/b-p2'),false);
});
