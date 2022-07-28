// SPDX-License-Identifier: Unlicense
pragma solidity >=0.8.0;
import "solecs/System.sol";
import { IWorld } from "solecs/interfaces/IWorld.sol";
import { IUint256Component } from "solecs/interfaces/IUint256Component.sol";
import { IComponent } from "solecs/interfaces/IComponent.sol";
import { getAddressById } from "solecs/utils.sol";

import { GameConfigComponent, ID as GameConfigComponentID, GameConfig } from "../components/GameConfigComponent.sol";
import { RecipeComponent, ID as RecipeComponentID } from "../components/RecipeComponent.sol";
import { GodID, BlockType, CraftingRecipeID, PlanksRecipeID } from "../constants.sol";

uint256 constant ID = uint256(keccak256("ember.system.init"));

contract InitSystem is System {
  constructor(IUint256Component _components, IWorld _world) System(_components, _world) {}

  function execute(bytes memory) public returns (bytes memory) {
    GameConfigComponent gameConfigComponent = GameConfigComponent(getAddressById(components, GameConfigComponentID));
    gameConfigComponent.set(GodID, GameConfig({ creativeMode: true }));

    // Add recipes
    RecipeComponent recipeComponent = RecipeComponent(getAddressById(components, RecipeComponentID));

    // Plank to crafting
    uint32[] memory recipe = new uint32[](10);
    recipe[0] = uint32(BlockType.Planks);
    recipe[1] = uint32(BlockType.Planks);
    recipe[3] = uint32(BlockType.Planks);
    recipe[4] = uint32(BlockType.Planks);
    recipe[9] = uint32(BlockType.Crafting);
    recipeComponent.set(CraftingRecipeID, recipe);

    // Log to plank
    recipe = new uint32[](10);
    recipe[0] = uint32(BlockType.Log);
    recipe[9] = uint32(BlockType.Planks);
    recipeComponent.set(PlanksRecipeID, recipe);
  }
}