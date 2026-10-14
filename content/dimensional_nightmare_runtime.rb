# Runtime extra del paquete QA de Dimensional Nightmare.
# Se inserta como seccion propia en Data/Scripts.rxdata al construir el ZIP QA;
# no se mezcla dentro del Scripts.rxdata del paquete de La Ruta de Dios.
# Sintaxis compatible con Ruby 1.8 / Essentials v19.

# Lucha segura contra una copia temporal de la party actual. Cada criatura se
# vuelve a crear para el entrenador espejo: no se transfieren instancias, estado,
# objetos equipados ni referencias de la party del jugador.
def dn_mirror_battle(mirror_name = "EL JUGADOR 000")
  if !$Trainer || $Trainer.able_pokemon_count <= 0
    pbMessage("El espejo no encuentra un equipo que pueda responder. Recuperate y vuelve cuando quieras.")
    return false
  end

  trainer_type = GameData::TrainerType.exists?(:SECRET_Red) ? :SECRET_Red : :TEAMROCKET
  mirror = NPCTrainer.new(mirror_name, trainer_type)
  mirror.id = $Trainer.make_foreign_ID
  mirror.lose_text = "El reflejo se deshace. Tu equipo sigue siendo tuyo."
  mirror.party = []

  $Trainer.party.each do |source|
    next if !source || source.egg?
    copy = Pokemon.new(source.species, source.level, mirror, false)
    copy.form_simple = source.form_simple if copy.respond_to?(:form_simple=) && source.respond_to?(:form_simple)
    copy.gender = source.gender if copy.respond_to?(:gender=) && source.respond_to?(:gender)
    copy.forget_all_moves
    if source.respond_to?(:moves) && source.moves && source.moves.length > 0
      source.moves.each do |move|
        copy.learn_move(move.id) if move
      end
    else
      copy.reset_moves
    end
    copy.reset_moves if copy.numMoves <= 0
    copy.heal
    mirror.party.push(copy)
    break if mirror.party.length >= Settings::MAX_PARTY_SIZE
  end

  if mirror.party.length <= 0
    pbMessage("El espejo no puede fijar una forma segura del equipo. Puedes volver a intentarlo.")
    return false
  end

  # Copia como maximo cuatro recursos curativos que ya lleva el jugador; no los
  # consume ni mueve desde la Mochila. Si no lleva ninguno, el espejo tampoco.
  mirror.items = []
  if $PokemonBag && $PokemonBag.respond_to?(:pbQuantity)
    [:FULLRESTORE, :MAXPOTION, :HYPERPOTION, :SUPERPOTION, :POTION, :FULLHEAL, :REVIVE, :MAXREVIVE].each do |item_id|
      next if !GameData::Item.exists?(item_id)
      quantity = $PokemonBag.pbQuantity(item_id)
      next if !quantity || quantity <= 0
      [quantity, 4 - mirror.items.length].min.times { mirror.items.push(item_id) }
      break if mirror.items.length >= 4
    end
  end

  pbMessage("El reflejo adopta las especies, niveles y movimientos que llevas. Ningun Pokemon ni objeto saldra de tu equipo.")
  $PokemonTemp.clearBattleRules if $PokemonTemp
  setBattleRule("canLose")
  setBattleRule("noExp")
  setBattleRule("noMoney")
  setBattleRule("noPartner")
  return pbTrainerBattleCore(mirror) == 1
rescue StandardError => error
  pbMessage("El reflejo pierde la forma por un instante. No se ha alterado tu equipo; puedes reintentar.")
  echoln("DN mirror battle: #{error}") if defined?(echoln)
  return false
ensure
  $PokemonTemp.clearBattleRules if $PokemonTemp
end

# Combate contra un trainer registrado, sin EXP/dinero y permitiendo perder.
def dn_registered_boss_battle(trainer_type, trainer_name)
  $PokemonTemp.clearBattleRules if $PokemonTemp
  setBattleRule("noExp")
  setBattleRule("noMoney")
  setBattleRule("noPartner")
  return pbTrainerBattle(trainer_type, trainer_name, nil, false, 0, true)
ensure
  $PokemonTemp.clearBattleRules if $PokemonTemp
end

# EP06: tras completar KINGGUS en los siete pedestales, se combate primero con
# la forma que deletrea y luego con EL REY SIN LETRA (equipo final 120–125).
# Cada derrota permite reintentar; canLose restablece la party del jugador.
def dn_kinggus_final_sequence
  pbMessage("Las siete letras quedan en orden. KINGGUS se levanta para la primera prueba.")
  return false if !dn_registered_boss_battle(:DN_KINGGUS, "KINGGUS")
  pbMessage("El Rey se desprende de las letras. EL REY SIN LETRA ocupa el trono.")
  return dn_registered_boss_battle(:DN_KINGGUS, "EL REY SIN LETRA")
end
