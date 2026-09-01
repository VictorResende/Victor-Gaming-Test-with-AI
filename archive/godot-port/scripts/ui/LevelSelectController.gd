class_name LevelSelectController
extends Control

signal level_selected(level_id: int)

@export var columns: int = 4
@export var card_width: float = 240.0
@export var card_height: float = 130.0

var level_positions: Array[Vector2] = []
var level_unlocked_states: Array[bool] = []

func _ready() -> void:
	calculate_node_positions()
	queue_redraw()

func calculate_node_positions() -> void:
	level_positions.clear()
	level_unlocked_states.clear()
	
	var total_levels = 10
	var start_x = 120.0
	var start_y = 180.0
	var spacing_x = 270.0
	var spacing_y = 150.0
	
	for i in range(total_levels):
		var col = i % columns
		var row = i / columns
		var pos = Vector2(start_x + col * spacing_x, start_y + row * spacing_y)
		level_positions.append(pos)
		
		var level_id = i + 1
		var is_unlocked = SaveManager.unlocked_levels.has(level_id) if SaveManager else (i == 0)
		level_unlocked_states.append(is_unlocked)

func _draw() -> void:
	for i in range(level_positions.size() - 1):
		var curr_pos = level_positions[i]
		var next_pos = level_positions[i + 1]
		var is_unlocked = level_unlocked_states[i] and level_unlocked_states[i + 1]
		
		var line_color = Color(0.98, 0.75, 0.14, 0.8) if is_unlocked else Color(0.25, 0.25, 0.27, 0.4)
		var width = 3.0 if is_unlocked else 1.5
		draw_line(curr_pos, next_pos, line_color, width)

func select_level(level_id: int) -> void:
	level_selected.emit(level_id)
	get_tree().change_scene_to_file("res://scenes/levels/Level" + str(level_id) + ".tscn")
