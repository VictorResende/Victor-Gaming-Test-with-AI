class_name WaveManager
extends Node

signal wave_started(wave_number: int, total_waves: int)
signal wave_completed(wave_number: int)
signal all_waves_cleared()

@export var current_wave: int = 0
@export var total_waves: int = 5

var active_enemies: int = 0
var wave_in_progress: bool = false

func start_next_wave() -> void:
	if wave_in_progress:
		return
	
	current_wave += 1
	wave_in_progress = true
	wave_started.emit(current_wave, total_waves)

func on_enemy_died() -> void:
	active_enemies = max(0, active_enemies - 1)
	check_wave_completion()

func on_enemy_escaped() -> void:
	active_enemies = max(0, active_enemies - 1)
	check_wave_completion()

func check_wave_completion() -> void:
	if active_enemies == 0 and wave_in_progress:
		wave_in_progress = false
		wave_completed.emit(current_wave)
		if current_wave >= total_waves:
			all_waves_cleared.emit()
