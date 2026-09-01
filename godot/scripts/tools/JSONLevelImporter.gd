@tool
class_name JSONLevelImporter
extends Node

## Helper tool to convert JSON level data into Godot .tres resources
static func import_json_level(json_text: String, save_path: String) -> LevelData:
	var json = JSON.new()
	var parse_result = json.parse(json_text)
	if parse_result != OK:
		push_error("Failed to parse JSON level: " + json.get_error_message())
		return null
	
	var data = json.get_data()
	var level = LevelData.new()
	level.level_id = int(data.get("id", 1))
	level.display_name = String(data.get("nameKey", ""))
	level.biome = String(data.get("biome", "FOREST"))
	level.initial_gold = int(data.get("initialGold", 400))
	level.initial_lives = int(data.get("initialLives", 20))
	
	ResourceSaver.save(level, save_path)
	print("Successfully imported LevelData to: ", save_path)
	return level
