class_name BossEnemy
extends Enemy

signal phase_changed(new_phase: int, boss_name: String)
signal shockwave_triggered(position: Vector2, color: Color)

@export var boss_type: String = "GOLEM_BOSS" # GOLEM_BOSS, FROST_GIANT_BOSS, INFERNAL_BOSS

var current_phase: int = 1
var phase2_triggered: bool = false
var phase3_triggered: bool = false

func take_damage(amount: float, type: String = "PHYSICAL") -> void:
	super.take_damage(amount, type)
	
	if not is_alive:
		return
	
	var hp_ratio = current_hp / config.max_hp if config else 1.0
	
	if hp_ratio <= 0.66 and not phase2_triggered:
		enter_phase(2)
	elif hp_ratio <= 0.33 and not phase3_triggered:
		enter_phase(3)

func enter_phase(phase: int) -> void:
	current_phase = phase
	if phase == 2:
		phase2_triggered = true
		if boss_type == "GOLEM_BOSS":
			shockwave_triggered.emit(global_position, Color(0.8, 0.6, 0.2))
		elif boss_type == "FROST_GIANT_BOSS":
			shockwave_triggered.emit(global_position, Color(0.2, 0.8, 1.0))
		elif boss_type == "INFERNAL_BOSS":
			current_speed *= 1.4
			shockwave_triggered.emit(global_position, Color(1.0, 0.3, 0.1))
	elif phase == 3:
		phase3_triggered = true
		if config:
			config.armor = min(0.8, config.armor + 0.2)
	
	phase_changed.emit(current_phase, config.display_name if config else "Boss")
