import { describe, it, expect } from 'vitest';
import { RECIPES, resolveStepText } from '../pages/kitchen/recipesData';

describe('Kitchen Recipes Scaling and Placeholder Resolution', () => {
  it('has 6 valid recipes with ingredients and steps', () => {
    expect(RECIPES).toHaveLength(6);
    for (const recipe of RECIPES) {
      expect(recipe.id).toBeTruthy();
      expect(recipe.name).toBeTruthy();
      expect(recipe.servingsBase).toBeGreaterThan(0);
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      for (const ing of recipe.ingredients) {
        expect(ing.id).toBeTruthy();
        expect(ing.name).toBeTruthy();
        expect(ing.amount).toBeGreaterThan(0);
        expect(ing.unit).toBeTruthy();
      }
    }
  });

  it('resolves step text placeholders matching scaled ingredient quantities at 1x, 2x, and 4x', () => {
    const multipliers = [1, 2, 4];

    for (const recipe of RECIPES) {
      for (const mult of multipliers) {
        for (const step of recipe.steps) {
          const resolved = resolveStepText(step.desc, recipe.ingredients, mult);

          // Find all placeholders in original desc
          const matches = [...step.desc.matchAll(/\{(\w+)\}/g)];
          for (const match of matches) {
            const ingId = match[1];
            const ing = recipe.ingredients.find((i) => i.id === ingId);
            expect(ing, `Ingredient ${ingId} must exist in recipe ${recipe.id}`).toBeDefined();

            if (ing) {
              const expectedAmount = Math.round(ing.amount * mult * 10) / 10;
              const expectedString = `${expectedAmount} ${ing.unit}`;
              expect(resolved).toContain(expectedString);
            }
          }

          // Ensure no unresolved curly brace placeholder remains
          expect(resolved).not.toMatch(/\{[a-z_]+\}/);
        }
      }
    }
  });

  it('correctly matches Masala Chai water, milk, and tea at 1x and 2x', () => {
    const chai = RECIPES.find((r) => r.id === 'chai')!;
    expect(chai).toBeDefined();

    // Step 2 is Aromatics Boil with water
    const step2_1x = resolveStepText(chai.steps[1].desc, chai.ingredients, 1);
    expect(step2_1x).toContain('300 ml');

    const step2_2x = resolveStepText(chai.steps[1].desc, chai.ingredients, 2);
    expect(step2_2x).toContain('600 ml');

    // Step 4 is Milk Simmer with milk
    const step4_1x = resolveStepText(chai.steps[3].desc, chai.ingredients, 1);
    expect(step4_1x).toContain('200 ml');

    const step4_2x = resolveStepText(chai.steps[3].desc, chai.ingredients, 2);
    expect(step4_2x).toContain('400 ml');
  });

  it('correctly matches Poha ingredients at 1x, 2x, and 4x', () => {
    const poha = RECIPES.find((r) => r.id === 'poha')!;
    expect(poha).toBeDefined();

    const step1_1x = resolveStepText(poha.steps[0].desc, poha.ingredients, 1);
    expect(step1_1x).toContain('200 g');

    const step1_2x = resolveStepText(poha.steps[0].desc, poha.ingredients, 2);
    expect(step1_2x).toContain('400 g');

    const step1_4x = resolveStepText(poha.steps[0].desc, poha.ingredients, 4);
    expect(step1_4x).toContain('800 g');
  });
});
