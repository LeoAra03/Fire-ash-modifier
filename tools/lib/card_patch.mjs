// ============================================================================
// card_patch.mjs — parche quirúrgico de la Tarjeta de Entrenador original.
// Parte del código original de HEAD (tools/lib/orig_trainer_card.mjs) y le
// añade el visor de medallas región por región sin tocar pbEndScene ni el
// controlador PokemonTrainerCardScreen.
// ============================================================================

import { ORIGINAL_CARD } from "./orig_trainer_card.mjs";

const A_OLD = [
  "    pbDrawTextPositions(overlay,textPositions)",
  "    x = 29",
  "    region = pbGetCurrentRegion(0) # Get the current region",
  "    imagePositions = []",
  "    for i in 0...8",
  "      if $Trainer.badges[i+region*8]",
  "        imagePositions.push([\"Graphics/Pictures/Trainer Card/icon_badges\",x,302,i*48,region*48,48,48])",
  "      end",
  "      x += 58",
  "    end",
  "    pbDrawImagePositions(overlay,imagePositions)",
].join("\n");

const A_NEW = [
  "    pbDrawTextPositions(overlay,textPositions)",
  "    region = @shownRegion || 0",
  "    pbDrawTextPositions(overlay,[",
  "       [_INTL(\"Badges\") + \": \" + PokeModBadgeRegions.region_name(region),34,298,0,baseColor,shadowColor],",
  "       [_INTL(\"< >\"),468,298,1,baseColor,shadowColor],",
  "    ])",
  "    x = 29",
  "    imagePositions = []",
  "    for i in 0...8",
  "      if PokeModBadgeRegions.owned?(region,i)",
  "        imagePositions.push([\"Graphics/Pictures/Trainer Card/icon_badges\",x,316,i*48,region*48,48,48])",
  "      end",
  "      x += 58",
  "    end",
  "    pbDrawImagePositions(overlay,imagePositions)",
].join("\n");

const B_OLD = [
  "    @sprites[\"trainer\"].z = 2",
  "    pbDrawTrainerCardFront",
].join("\n");

const B_NEW = [
  "    @sprites[\"trainer\"].z = 2",
  "    @shownRegion = pbGetCurrentRegion(0)",
  "    @shownRegion = 0 if @shownRegion.nil? || @shownRegion < 0 || @shownRegion >= PokeModBadgeRegions::ROWS",
  "    pbDrawTrainerCardFront",
].join("\n");

const C_OLD = [
  "      if Input.trigger?(Input::BACK)",
  "        pbPlayCloseMenuSE",
  "        break",
  "      end",
  "    end",
].join("\n");

const C_NEW = [
  "      if Input.trigger?(Input::BACK)",
  "        pbPlayCloseMenuSE",
  "        break",
  "      end",
  "      if Input.trigger?(Input::RIGHT)",
  "        pbPlayDecisionSE",
  "        @shownRegion = (@shownRegion + 1) % PokeModBadgeRegions::ROWS",
  "        pbDrawTrainerCardFront",
  "      end",
  "      if Input.trigger?(Input::LEFT)",
  "        pbPlayDecisionSE",
  "        @shownRegion = (@shownRegion + PokeModBadgeRegions::ROWS - 1) % PokeModBadgeRegions::ROWS",
  "        pbDrawTrainerCardFront",
  "      end",
  "    end",
].join("\n");

/** Devuelve la sección UI_TrainerCard original con el visor insertado. */
export function patchedCard() {
  let code = ORIGINAL_CARD;
  for (const [oldStr, newStr, tag] of [[A_OLD, A_NEW, "bloque de medallas"], [B_OLD, B_NEW, "inicio de escena"], [C_OLD, C_NEW, "bucle de entrada"]]) {
    if (!code.includes(oldStr)) throw new Error(`UI_TrainerCard original no reconocida (${tag})`);
    code = code.replace(oldStr, newStr);
  }
  return code;
}
