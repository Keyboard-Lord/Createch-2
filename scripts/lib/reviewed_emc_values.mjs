import assert from 'node:assert/strict';

// Eligibility can deny an explicit price, never create a price from a name.
export function reviewedEmcSeed(reviewed, eligibility, knownIds) {
  assert.equal(reviewed.schema, 1);
  const excluded = new Set(Object.values(eligibility.itemGroups).flatMap(g => g.items));
  const namespaces = new Set(Object.keys(eligibility.namespaceExclusions));
  const values = {};
  for (const [id, value] of Object.entries(reviewed.values)) {
    assert.match(id, /^[a-z0-9_.-]+:[a-z0-9_./-]+$/);
    assert(Number.isSafeInteger(value) && value > 0, 'Invalid reviewed EMC: ' + id);
    if (knownIds.has(id) && !excluded.has(id) && !namespaces.has(id.split(':')[0])) values[id] = value;
  }
  return values;
}

export function constrainReviewedPriceParity(values, groups, repairs) {
  let changed = 0;
  for (const group of groups) {
    // Only the already reviewed ordinary stock, fractional nugget and
    // nine-ingot storage forms are supported here. Physical sheets/blocks
    // cannot enter a group merely by sharing the material name.
    assert([100,100/9,900].includes(group.metalUnits), 'Unreviewed parity form units');
    const active = group.items.filter(id => Object.hasOwn(values, id));
    let minimum = Math.min(...active.map(id => values[id]));
    if(group.baseItem){
      assert.equal(group.baseMetalUnits,100);
      if(Object.hasOwn(values,group.baseItem))minimum=Math.min(minimum,Math.floor(values[group.baseItem]*group.metalUnits/100));
    }
    for (const id of active) if (values[id] > minimum) {
      repairs.push({item: id, before: values[id], after: minimum, recipe: 'reviewed-equal-unit/' + group.material});
      values[id] = minimum;
      changed++;
    }
  }
  return changed;
}

export function constrainReviewedFormCeilings(values, forms, repairs) {
  let changed = 0;
  for (const form of forms) {
    assert([50,100].includes(form.baseMetalUnits), 'Unreviewed base stock units');
    assert(Number.isSafeInteger(form.metalUnits) && form.metalUnits > 0);
    if (!Object.hasOwn(values, form.item) || !Object.hasOwn(values, form.baseItem)) continue;
    const ceiling = Math.floor(values[form.baseItem] * form.metalUnits / form.baseMetalUnits);
    if (values[form.item] > ceiling) {
      repairs.push({item: form.item, before: values[form.item], after: ceiling, recipe: 'reviewed-form-units/' + form.material});
      if (ceiling) values[form.item] = ceiling;
      else delete values[form.item];
      changed++;
    }
  }
  return changed;
}

// Explicit native TFC alloys only. Existing prices may fall; no item name
// creates a price. Min/max composition ranges define the cheapest valid mix.
export function reviewedAlloyCeiling(values,row) {
  const alloy=row.alloy.payload;assert.equal(alloy.type,'tfc:alloy');assert.equal(alloy.result,row.resultFluid);assert.equal(row.stockUnits,100);
  assert.equal(row.feedstocks.length,alloy.contents.length);assert.equal(new Set(row.feedstocks.map(f=>f.fluid)).size,row.feedstocks.length);
  const shares=alloy.contents.map(c=>{
    assert(Number.isFinite(c.min)&&Number.isFinite(c.max)&&c.min>=0&&c.max<=1&&c.min<=c.max);
    const f=row.feedstocks.find(f=>f.fluid===c.fluid);assert(f,'Unreviewed alloy feed');assert.equal(f.stockUnits,100);
    return {...c,price:values[f.item]};
  });
  assert(shares.reduce((n,c)=>n+c.min,0)<=1+1e-8);assert(shares.reduce((n,c)=>n+c.max,0)>=1-1e-8);
  if(shares.some(c=>!Number.isSafeInteger(c.price)||c.price<=0))return null;
  let remaining=1-shares.reduce((n,c)=>n+c.min,0),cost=shares.reduce((n,c)=>n+c.min*c.price,0);
  for(const c of shares.sort((a,b)=>a.price-b.price)){const extra=Math.min(remaining,c.max-c.min);cost+=extra*c.price;remaining-=extra;}
  assert(remaining<=1e-8,'Infeasible alloy ranges');
  return {inputCostPer100Units:cost,fullStockCeiling:Math.min(Math.floor(cost+1e-8),values[row.stockItem]??Infinity)};
}

export function constrainReviewedAlloyCeilings(values,rows,repairs) {
  let changed=0;
  for(const row of rows??[]){const budget=reviewedAlloyCeiling(values,row);if(!budget)continue;
    for(const form of row.finishedForms){assert([25,100,200,400].includes(form.metalUnits));if(!Object.hasOwn(values,form.item))continue;
      const ceiling=Math.floor(budget.fullStockCeiling*form.metalUnits/100);
      if(values[form.item]>ceiling){repairs.push({item:form.item,before:values[form.item],after:ceiling,recipe:'reviewed-native-alloy/'+row.material});if(ceiling)values[form.item]=ceiling;else delete values[form.item];changed++;}
    }
  }
  return changed;
}
