import test from 'node:test';import assert from 'node:assert/strict';
import {matchesVehicle,periodForYear} from '../src/vehicles';
const part={generation:'S197' as const,yearFrom:2005,yearTo:2014};
test('visual model periods preserve overlapping fitment',()=>{const before=JSON.stringify(part);assert.ok(matchesVehicle(part,'2005-2009',''));assert.ok(matchesVehicle(part,'2010-2014',''));assert.equal(matchesVehicle(part,'2015-2017',''),false);assert.equal(JSON.stringify(part),before);});
test('narrower facelift fitment does not leak into early models',()=>{assert.equal(matchesVehicle({...part,yearFrom:2010},'2005-2009',''),false);assert.equal(matchesVehicle(part,'2005-2009','2011'),false);});
test('year and generation must match the same fitment entry',()=>{const p={...part,fitments:[{sourceModel:'early',generation:'S197' as const,yearFrom:2005,yearTo:2009},{sourceModel:'later',generation:'S550' as const,yearFrom:2018,yearTo:2023}]};assert.equal(matchesVehicle(p,'S197','2020'),false);assert.ok(matchesVehicle(p,'2018-2023','2020'));});
test('period boundaries',()=>{assert.equal(periodForYear(2009)?.id,'2005-2009');assert.equal(periodForYear(2010)?.id,'2010-2014');assert.equal(periodForYear(2014)?.id,'2010-2014');assert.equal(periodForYear(2015)?.id,'2015-2017');assert.equal(periodForYear(2024)?.id,'2024-plus');});
