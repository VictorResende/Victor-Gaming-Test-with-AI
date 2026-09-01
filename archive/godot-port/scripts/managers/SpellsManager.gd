extends Node

signal spell_cast(spell_type: String, position: Vector2)
signal cooldown_updated(spell_type: String, current_cooldown: float, max_cooldown: float)

var cooldowns: Dictionary = {
	"METEOR": 0.0,
	"REINFORCE": 0.0,
	"SHIELD": 0.0
}

var max_cooldowns: Dictionary = {
	"METEOR": 35.0,
	"REINFORCE": 20.0,
	"SHIELD": 30.0
}

func _process(delta: float) -> void:
	for spell in cooldowns.keys():
		if cooldowns[spell] > 0:
			cooldowns[spell] = max(0.0, cooldowns[spell] - delta)
			cooldown_updated.emit(spell, cooldowns[spell], max_cooldowns[spell])

func cast_spell(spell_type: String, target_position: Vector2) -> bool:
	if not cooldowns.has(spell_type) or cooldowns[spell_type] > 0:
		return false
	
	cooldowns[spell_type] = max_cooldowns[spell_type]
	spell_cast.emit(spell_type, target_position)
	return true

func is_ready(spell_type: String) -> bool:
	return cooldowns.get(spell_type, 0.0) <= 0.0
