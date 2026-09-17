# webRPG
webRPG is an extensive yet simple RPG that can be played inside the browser.

# Features

## 3 professions, 3 systems

### Alchemy
Crafting potions with alchemy is dependent on a "essence" system where ingredients carry a certain essence that dictate the type of potions. Said ingredients also carry secondary effects that mainly affect numerical values. Most ingredients come with a trade-off of secondary stats and essence points. The challenge becomes balancing these two in order to maximize effectiveness whilst still brewing the potion type you want.

## Gameplay loop
The basic gameplay loop consists of exploration of areas, done via clicking a button. Each area has a certain set of basic events. Each event can be engaged with manually, these are forage, encounter, loot and locate. The pools for these events depend on the current area. Every button press equates to some xp, but not necessarily an event that triggers. This chance can be increased with alchemy potions. There is however a minor pity system to prevent exceptionally unlucky players from being unable to trigger events.

### Events
- Forage: Alchemy ingredients.
- Encounter: Sorcery ingredients.
- Loot: Artifice ingredients.
- Locate: Finds either an NPC or building.

### Procedural generation
Almost everything in the game is procedurally generated using a rigorous generator. This randomization makes sure no one area is necessarily obsolete, technically speaking. It also makes sure no one most effective item exists, again, technically speaking. Generation is dependent on a certain "points" budget which is spread across several areas until every point is used. This budget is dependent on the items required level. The game also generates sprites, this consists of a basic base sprite which contains slight variations depending on the type of item, a spike trap for example can have differently colored tips depending on the type of elemental damage.

### Player character
Alongside professions, the player character has multiple stats and slots to equip armor and weapons:
- 4 armor slots
- 1 weapon slot
- HP stat
- Item slots   

### Combat
Combat in this game is a basic turn based system. The player can attack once each turn and use one item (trap, potion or non-damaging scrolls). The first turn of an encounter however can be used to set a trap with no cost. 

### Bosses
Exploration slowly fills a boss encounter meter which upon reaching 100% allows the player to engage in a boss fight for the current area. These bosses require certain counters to be defeated (potions, spells or mechanism). Upon defeat, they drop an exclusive currency (gems) that can be spent on high-tier materials that exceed most point budgets. Bosses also have a small chance to drop a trophy, a purely cosmetic item.

### Coins
Coins are the main currency of the game, coins can be acquired if the player locates a certain type of NPC or building. Coins can be used for bulk acquisition of basic materials if the player finds another type of NPC or building.

### End-game
The end-game of this game is a perpetual investment sink. Coins can be used to upgrade a housing unit to give passive bonusses to professions. These upgrades have no real ceiling, instead they have diminishing returns. Some upgrades also add new unlocks to the game. 

#### End-game unlocks
- Manifestation: Allows the player to generate their own ingredients at a steep cost (coins and gems).
- Damage time-trial: A small mode where the player must do as much damage as possible in 10 turns. Certain milestones give cosmetic trophies.
- ???: A prestige-like system that allows the player to convert some of their profession XP into coins and gems.
### Stat tracking
A lot of statistics are tracked and can be viewed later.

### Save encoding
The game uses a text-based solution to handle saves. The localstorage is used for data storage, however, that data is not persistent across devices. As such the game allows you to convert your game state into a text based key that can be stored somewhere to load later if need be. 
