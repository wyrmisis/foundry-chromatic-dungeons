# To Do

## Characters

* Pretty up the Active Effects tab
* Apply the Material UI-esque floating panel aesthetic to the rest of the discrete panels in the character sheet

## Equipment

* Streamline the process of adding a new ammunition item/type (it's clumsy to expect non-technical GMs to remember to enter strings)
* Implement equippable vs. non-equippable magic items
* Implement unidentified items

## Spells

* Automate area of effect targeting
* Automate prompts for saves
* Automate spell damage

## Monsters

* When dropping an NPC token on the map, optionally allow the GM to drop a number of them equal to the formula in `data.numberAppearing`
* Split the number of creatures that can show up in a lair/colony/etc out from `data.numberAppearing`
* Monster spellcasting
* Monster variants

## Architecture

* Figure out how to "componentize" the system (so many things use repeated code)
* Figure out how to break the extended Item and Actor classes out into separate Document classes per Item/Actor type, if possible
  * Do the same for the custom ItemSheet/ActorSheets
* Add testing... somehow
* Implement a container query polyfill so we can make better use of the available space.