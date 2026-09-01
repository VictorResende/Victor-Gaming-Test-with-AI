extends Node

const SAVE_PATH = "user://savegame.cfg"

var unlocked_levels: Array[int] = [1]
var level_stars: Dictionary = {} # int level_id -> int stars
var available_stars: int = 0
var sfx_volume: float = 1.0
var music_volume: float = 0.8
var sfx_enabled: bool = true
var music_enabled: bool = true
var language: String = "pt"
var high_contrast: bool = false
var reduced_motion: bool = false

func _ready() -> void:
	load_save()

func save_game() -> void:
	var config = ConfigFile.new()
	config.set_value("progress", "unlocked_levels", unlocked_levels)
	config.set_value("progress", "level_stars", level_stars)
	config.set_value("progress", "available_stars", available_stars)
	
	config.set_value("settings", "sfx_volume", sfx_volume)
	config.set_value("settings", "music_volume", music_volume)
	config.set_value("settings", "sfx_enabled", sfx_enabled)
	config.set_value("settings", "music_enabled", music_enabled)
	config.set_value("settings", "language", language)
	config.set_value("settings", "high_contrast", high_contrast)
	config.set_value("settings", "reduced_motion", reduced_motion)
	
	config.save(SAVE_PATH)

func load_save() -> void:
	var config = ConfigFile.new()
	var err = config.load(SAVE_PATH)
	if err == OK:
		unlocked_levels = Array(config.get_value("progress", "unlocked_levels", [1]), TYPE_INT, "", null)
		level_stars = config.get_value("progress", "level_stars", {})
		available_stars = config.get_value("progress", "available_stars", 0)
		
		sfx_volume = config.get_value("settings", "sfx_volume", 1.0)
		music_volume = config.get_value("settings", "music_volume", 0.8)
		sfx_enabled = config.get_value("settings", "sfx_enabled", true)
		music_enabled = config.get_value("settings", "music_enabled", true)
		language = config.get_value("settings", "language", "pt")
		high_contrast = config.get_value("settings", "high_contrast", false)
		reduced_motion = config.get_value("settings", "reduced_motion", false)

func complete_level(level_id: int, stars: int) -> void:
	var prev_stars = level_stars.get(level_id, 0)
	if stars > prev_stars:
		available_stars += (stars - prev_stars)
		level_stars[level_id] = stars
	
	var next_id = level_id + 1
	if not unlocked_levels.has(next_id):
		unlocked_levels.append(next_id)
	
	save_game()
