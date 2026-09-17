# Alchemy info
Alchemy is the first of 3 professions in webRPG. Alchemy allows you to craft potions of various types if you use the right ingredients. The alchemy system works on an 'essence' system where the player has to balance 3 gauges in order to craft the desired potion type.

On the left you will see a list-item style layout card containing all your ingredients that can be used for brewing. It also has a simple search function that filters by name and updates with each keystroke. The list contains the name of the item alongside secondary effects, element types and essence spread, so you don't have to look at individual items for details! You can click on the desired ingredient to add it. Be careful, you can't remove an ingredient once it's in! You can add up to 10 ingredients when brewing a potion.

To the right, you will see a card contain 3 gauges, in order from left to right these are viscosity, volatility and potency, there is also a label under to show their concentration (low < 25%, medium =< 60%, high > 60%), these percentages are based on ratios of the total amount of essences. To the right of those gauges you will see the secondary stats of the potion. Above those two is the elemental & potion type, and under those two is a brew button. 

## The 3 gauges
Each of the three gauges has an apt 3 values for concentration, these are: low, medium, and high. 

### Viscosity 
Viscosity determines if a potion can be drank or not. Low viscosity potions can easily be rank, medium viscosity potions can be drank, and high viscosity potions can be applied to weapons. 

### Volatility
Volatility dictates the "trigger". A low volatility potion will take some time for its effects to activate (1 turn). Medium volatility potions give their effects immediately. High volatility potions deal increased damage when thrown and have an increased effect when drank, at the cost of lower duration. 

### Potency
Finally, potency determines the magnitude of the other two gauges. Uniquely, a potency of zero will make your potion inert. A low potency will make your effects weaker but last longer, a medium potency gives you no benefits or downsides, and a high potency increases the potion's effects but at the cost of self damamge, however, when thrown, it also applies its effects to the player instead of dealing self damage. 

## Potion types
| Viscosity | Volatility | Potency | Potion Type |
|---|---|---|---|
| Low | Low | Low | Vapor |
| Low | Low | Medium | Haze |
| Low | Low | High | Miasma |
| Low | Medium | Low | Vapor |
| Low | Medium | Medium | Aerosol |
| Low | Medium | High | Plume |
| Low | High | Low | Fume |
| Low | High | Medium | Cloud |
| Low | High | High | Blastwave |
| Medium | Low | Low | Draught |
| Medium | Low | Medium | Tonic |
| Medium | Low | High | Elixir |
| Medium | Medium | Low | Fluid |
| Medium | Medium | Medium | Elixer |
| Medium | Medium | High | Splash |
| Medium | High | Low | Fuming |
| Medium | High | Medium | Brew |
| Medium | High | High | Thermite |
| High | Low | Low | Balm |
| High | Low | Medium | Oil |
| High | Low | High | Paste |
| High | Medium | Low | Slime |
| High | Medium | Medium | Adhesive |
| High | Medium | High | Pitch |
| High | High | Low | Reactive Gel |
| High | High | Medium | Volatile Paste |
| High | High | High | Sludge |

## Integration of elemental damage types
Because every ingredient has a big chance to contain an elemental damage, elemental damage types are not restrictive, instead, the dominant element will determine a few key mechanics:
1. The dominant element determines the elemental damage type of that potion (can be null).
2. The dominant element determines a secondary potion effect.
    - Fire: Doubles damage over time damage.
    - Earth: Increases healing by 25% additively.
    - Air: Increases the effects of low viscosity potions by 10% multiplicitively.
    - Water: Eliminates delay for low volatility potions.
    - Thunder: 25% chance to skip a turn (enemy or player) on turn start. 
    - Necrotic: Adds a flat +5% to percentual damage.  
    - Radiant: Increases temporary HP gain by 50% additively.
    - Poison: Doubles damage over time duration.


