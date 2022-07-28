import {
  EntityID,
  EntityIndex,
  getComponentValue,
  getComponentValueStrict,
  Has,
  HasValue,
  namespaceWorld,
  removeComponent,
  runQuery,
  setComponent,
} from "@latticexyz/recs";
import { VoxelCoord } from "@latticexyz/utils";
import { NetworkLayer } from "../network";
import { defineSelectedSlotComponent } from "./components";
import { defineCraftingTableComponent } from "./components/CraftingTable";
import { BlockType, Singleton } from "./constants";
import { setupNoaEngine } from "./setup";
import { createBlockSystem, createInputSystem, createPositionSystem } from "./systems";

export function createNoaLayer(network: NetworkLayer) {
  const world = namespaceWorld(network.world, "noa");

  const SingletonEntity = world.registerEntity({ id: Singleton });

  // --- COMPONENTS -----------------------------------------------------------------
  const components = {
    SelectedSlot: defineSelectedSlotComponent(world),
    CraftingTable: defineCraftingTableComponent(world),
  };

  // --- SETUP ----------------------------------------------------------------------
  function getVoxel(coord: VoxelCoord) {
    if (coord.y < 0) {
      return BlockType.Water;
    }

    const { Position, BlockType: BlockTypeComponent } = network.components;
    const block = [...runQuery([HasValue(Position, coord), Has(BlockTypeComponent)])][0];
    if (block != null) return getComponentValueStrict(BlockTypeComponent, block).value;
    return BlockType.Air;
  }

  const { noa, setBlock } = setupNoaEngine(getVoxel);
  console.log("noa", noa);

  // --- API ------------------------------------------------------------------------
  function setCraftingTable(entities: EntityIndex[]) {
    setComponent(components.CraftingTable, SingletonEntity, { value: entities.slice(0, 9) });
  }

  function setCraftingTableIndex(index: number, entity: EntityIndex) {
    const currentCraftingTable = getComponentValue(components.CraftingTable, SingletonEntity)?.value ?? [];
    const newCraftingTable = [...currentCraftingTable];
    newCraftingTable[index] = entity;
    setComponent(components.CraftingTable, SingletonEntity, { value: newCraftingTable });
  }

  function clearCraftingTable() {
    removeComponent(components.CraftingTable, SingletonEntity);
  }

  const context = {
    world,
    components,
    noa,
    api: { setBlock, setCraftingTable, clearCraftingTable, setCraftingTableIndex },
    SingletonEntity,
  };

  // --- SYSTEMS --------------------------------------------------------------------
  createInputSystem(network, context);
  createBlockSystem(network, context);
  createPositionSystem(network, context);

  // --- AUTORUN --------------------------------------------------------------------
  const interval = setInterval(() => {
    // Share own position with other players
    const position = noa.entities.getPosition(noa.playerEntity);
    const roundPos = { x: Math.floor(position[0]), y: Math.floor(position[1]), z: Math.floor(position[2]) };
    const playerEntity = world.entityToIndex.get(network.network.connectedAddress.get() as EntityID);
    const lastPlayerPos = playerEntity != null && getComponentValue(network.components.Position, playerEntity);
    if (
      !lastPlayerPos ||
      roundPos.x !== lastPlayerPos.x ||
      roundPos.y != lastPlayerPos.y ||
      roundPos.z !== lastPlayerPos.z
    ) {
      network.api.move(roundPos);
    }
  }, 5000);
  world.registerDisposer(() => clearInterval(interval));

  return context;
}