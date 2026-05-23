// Node-runnable tests for NavStack's pure selection transform (selectInLevels
// in components/nav-stack.js). The selection rules are pure data — no DOM — so
// they test cleanly in node:test; the DOM toggle that mirrors them lives in
// setSelected and is exercised in the browser. The wrapper pytest at
// tests/test_nav_stack_js.py invokes this file via `node --test`.
//
// Run directly:  node --test tests/static_js/nav_stack.test.mjs

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { selectInLevels } from '../../components/nav-stack.js';

/** Two levels: a system root whose `home` item is selected, and a component
 *  level whose `b1` item is selected. Mirrors storybook's [root, storybook]. */
function fixture() {
  return [
    {
      id: 'root',
      items: [
        { kind: 'item', id: 'home', selected: true },
        { kind: 'branch', id: 'components' },
      ],
    },
    {
      id: 'components',
      items: [
        { kind: 'section-item', id: 'b1', selected: true },
        { kind: 'section-item', id: 'b2' },
        { kind: 'section-item', id: 'b3' },
      ],
    },
  ];
}

/** Ids of the selected items, level by level. */
function selectedByLevel(levels) {
  return levels.map((l) => (l.items ?? []).filter((it) => it.selected).map((it) => it.id));
}

test('selectInLevels lights the target and clears the previously selected sibling', () => {
  const out = selectInLevels(fixture(), 'b3');
  assert.deepEqual(selectedByLevel(out), [['home'], ['b3']]);
});

test('selectInLevels leaves a sibling level\'s selection untouched', () => {
  const input = fixture();
  const out = selectInLevels(input, 'b2');
  // The root level still marks `home`, and is returned by reference (untouched).
  assert.deepEqual(selectedByLevel(out), [['home'], ['b2']]);
  assert.equal(out[0], input[0]);
});

test('selectInLevels selects exactly one item in the owning level', () => {
  const out = selectInLevels(fixture(), 'b2');
  const selected = (out[1].items ?? []).filter((it) => it.selected);
  assert.equal(selected.length, 1);
  assert.equal(selected[0].id, 'b2');
});

test('selectInLevels returns the input unchanged when no level contains the id', () => {
  const input = fixture();
  const out = selectInLevels(input, 'does-not-exist');
  assert.equal(out, input);
  assert.deepEqual(selectedByLevel(out), [['home'], ['b1']]);
});

test('selectInLevels does not mutate the input levels', () => {
  const input = fixture();
  selectInLevels(input, 'b3');
  // Original flags survive: the transform is pure (FUNCTIONAL_TESTING).
  assert.deepEqual(selectedByLevel(input), [['home'], ['b1']]);
});

test('selectInLevels tolerates a level with no items array', () => {
  const levels = [{ id: 'empty' }, { id: 'components', items: [{ id: 'b1' }] }];
  const out = selectInLevels(levels, 'b1');
  assert.deepEqual(selectedByLevel(out), [[], ['b1']]);
});
