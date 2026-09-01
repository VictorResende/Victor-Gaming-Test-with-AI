class_name MenuController
extends Control

signal play_campaign_requested()
signal settings_opened()
signal relics_opened()

@onready var title_label: Label = $VBox/TitleLabel
@onready var stars_label: Label = $TopBar/StarsLabel

func _ready() -> void:
	update_ui()

func update_ui() -> void:
	if SaveManager:
		if stars_label:
			stars_label.text = "★ " + str(SaveManager.available_stars)

func _on_play_button_pressed() -> void:
	play_campaign_requested.emit()
	get_tree().change_scene_to_file("res://scenes/ui/LevelSelect.tscn")

func _on_settings_button_pressed() -> void:
	settings_opened.emit()

func _on_relics_button_pressed() -> void:
	relics_opened.emit()

func toggle_language() -> void:
	if not SaveManager:
		return
	
	if SaveManager.language == "pt":
		SaveManager.language = "en"
	elif SaveManager.language == "en":
		SaveManager.language = "es"
	else:
		SaveManager.language = "pt"
	
	TranslationServer.set_locale(SaveManager.language)
	SaveManager.save_game()
	update_ui()
