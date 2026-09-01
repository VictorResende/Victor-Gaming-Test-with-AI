class_name HUDController
extends Control

signal pause_requested()
signal speed_changed(new_speed: float)
signal wave_call_requested()

@onready var gold_label: Label = $TopBar/Margin/HBox/GoldLabel
@onready var lives_label: Label = $TopBar/Margin/HBox/LivesLabel
@onready var wave_label: Label = $TopBar/Margin/HBox/WaveLabel

var current_gold: int = 400
var current_lives: int = 20
var current_speed: float = 1.0

func update_gold(amount: int) -> void:
	current_gold = amount
	if gold_label:
		gold_label.text = str(amount) + "G"

func update_lives(lives: int) -> void:
	current_lives = lives
	if lives_label:
		lives_label.text = "♥ " + str(lives)

func update_wave(current: int, total: int) -> void:
	if wave_label:
		wave_label.text = "Wave " + str(current) + "/" + str(total)

func _on_pause_button_pressed() -> void:
	pause_requested.emit()

func _on_speed_1x_pressed() -> void:
	set_speed(1.0)

func _on_speed_2x_pressed() -> void:
	set_speed(2.0)

func _on_speed_4x_pressed() -> void:
	set_speed(4.0)

func set_speed(speed: float) -> void:
	current_speed = speed
	Engine.time_scale = speed
	speed_changed.emit(speed)
