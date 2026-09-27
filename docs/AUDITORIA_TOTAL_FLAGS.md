# Auditoría total de flags de Fire Ash

Generada: 2026-09-27T17:30:31.313Z

## Cobertura

- 2020 mapas.
- 50 eventos comunes.
- 402 secciones de script.
- 737 slots de switch (675 con nombre).
- 133 slots de variable (124 con nombre).
- 5704 claves de self-switch observadas.
- 73 expresiones dinámicas distintas.

La ausencia de una referencia literal no demuestra que una flag sea libre: Ruby puede calcular índices en ejecución. Por eso las expresiones dinámicas se conservan en el JSON completo.

## Flags PokeMod reservadas

| ID | Nombre | Estado |
|---:|---|---|
| 701 | POKEMOD HYPNO RESCUE STARTED | used |
| 702 | POKEMOD HYPNO SUBDUED | used |
| 703 | POKEMOD CHILDREN RESCUED | used |
| 704 | POKEMOD HORIZONS OPEN | used |
| 705 | POKEMOD HORIZONS 500 COMPLETE | used |
| 706 | POKEMOD ATLAS MIL OPEN | used |
| 707 | POKEMOD ATLAS MIL 500 COMPLETE | used |
| 708 | POKEMOD ATLAS SEAL 01 BELL | used |
| 709 | POKEMOD ATLAS SEAL 02 | used |
| 710 | POKEMOD ATLAS SEAL 03 | used |
| 711 | POKEMOD ATLAS SEAL 04 | used |
| 712 | POKEMOD ATLAS SEAL 05 | used |
| 713 | POKEMOD ATLAS SEAL 06 | used |
| 714 | POKEMOD ATLAS SEAL 07 | used |
| 715 | POKEMOD ATLAS SEAL 08 | used |
| 716 | POKEMOD ATLAS SEAL 09 | used |
| 717 | POKEMOD ATLAS SEAL 10 | used |
| 718 | POKEMOD ATLAS SEAL 11 | used |
| 719 | POKEMOD ATLAS SEAL 12 | used |
| 720 | POKEMOD ATLAS SEAL 13 | used |
| 721 | POKEMOD ATLAS SEAL 14 | used |
| 722 | POKEMOD ATLAS SEAL 15 | used |
| 723 | POKEMOD ATLAS SEAL 16 | used |
| 724 | POKEMOD ATLAS SEAL 17 | used |
| 725 | POKEMOD ATLAS SEAL 18 | used |
| 726 | POKEMOD ATLAS SEAL 19 | used |
| 727 | POKEMOD ATLAS SEAL 20 | used |
| 728 | POKEMOD ATLAS SEAL 21 | used |
| 729 | POKEMOD ATLAS SEAL 22 | used |
| 730 | POKEMOD ATLAS SEAL 23 | used |
| 731 | POKEMOD ATLAS SEAL 24 | used |
| 732 | POKEMOD ATLAS SEAL 25 | used |
| 733 | POKEMOD ATLAS SEAL 26 | used |
| 734 | POKEMOD ATLAS SEAL 27 | used |
| 735 | POKEMOD ATLAS SEAL 28 | used |
| 736 | POKEMOD ATLAS SEAL 29 | used |
| 737 | POKEMOD ATLAS SEAL 30 | used |

Conflictos de reserva: **0**.

## Switches 1–737

| ID | Nombre | Lecturas | ON | OFF | Script | Estado |
|---:|---|---:|---:|---:|---:|---|
| 1 | Starting over | 151 | 0 | 121 | 0 | used |
| 2 | Seen Pokérus in Poké Center | 0 | 113 | 0 | 0 | write only/static |
| 3 | Choosing starter | 12 | 2 | 4 | 0 | used |
| 4 | Defeated Gym 1 | 11 | 2 | 0 | 0 | used |
| 5 | Defeated Gym 2 | 10 | 2 | 0 | 0 | used |
| 6 | Defeated Gym 3 | 21 | 1 | 0 | 0 | used |
| 7 | Defeated Gym 4 | 27 | 1 | 0 | 0 | used |
| 8 | Defeated Gym 5 | 19 | 1 | 0 | 0 | used |
| 9 | Defeated Gym 6 | 17 | 1 | 0 | 0 | used |
| 10 | Defeated Gym 7 | 17 | 1 | 0 | 0 | used |
| 11 | Defeated Gym 8 | 45 | 1 | 0 | 0 | used |
| 12 | Defeated Elite Four | 1 | 1 | 0 | 0 | used |
| 13 | Fossil revival in progress | 2 | 3 | 3 | 0 | used |
| 14 | s:PBDayNight.isDay? | 4 | 0 | 0 | 0 | read/access only |
| 15 | s:PBDayNight.isNight? | 5 | 0 | 0 | 0 | read/access only |
| 16 | s:PBDayNight.isMorning? | 0 | 0 | 0 | 0 | no literal use |
| 17 | s:PBDayNight.isAfternoon? | 0 | 0 | 0 | 0 | no literal use |
| 18 | s:PBDayNight.isEvening? | 0 | 0 | 0 | 0 | no literal use |
| 19 | s:pbIsWeekday(-1,2,4,6) | 1 | 0 | 0 | 0 | read/access only |
| 20 | s:!pbIsWeekday(-1,2,4,6) | 1 | 0 | 0 | 0 | read/access only |
| 21 | s:tsOn?("A") | 199 | 0 | 0 | 0 | read/access only |
| 22 | s:tsOff?("A") | 970 | 0 | 0 | 0 | read/access only |
| 23 | s:cooledDown?(86400) | 7 | 0 | 0 | 0 | read/access only |
| 24 | s:cooledDownDays?(1) | 9 | 0 | 0 | 0 | read/access only |
| 25 | s:pbInSafari? | 2 | 0 | 0 | 0 | read/access only |
| 26 | s:pbBugContestUndecided? | 2 | 0 | 0 | 0 | read/access only |
| 27 | s:pbBugContestDecided? | 5 | 0 | 0 | 0 | read/access only |
| 28 | s:pbInChallenge? | 9 | 0 | 0 | 0 | read/access only |
| 29 | Has National Dex | 2 | 2 | 1 | 0 | used |
| 30 | s:pbNextMysteryGiftID>0 | 2 | 0 | 0 | 0 | read/access only |
| 31 | Shiny wild Pokémon | 0 | 78 | 78 | 0 | write only/static |
| 32 | Fateful encounters | 0 | 2 | 2 | 0 | write only/static |
| 33 | No money lost in battle | 0 | 0 | 0 | 0 | no literal use |
| 34 | No Mega Evolution | 0 | 1 | 1 | 0 | write only/static |
| 35 | Gary | 2 | 1 | 0 | 0 | used |
| 36 | Pikachu | 2 | 1 | 1 | 0 | used |
| 37 | Team Rocket | 22 | 2 | 2 | 0 | used |
| 38 | Beginning | 2 | 1 | 1 | 0 | used |
| 39 | Before first gym | 3 | 3 | 1 | 0 | used |
| 40 | Get Charmander | 1 | 1 | 0 | 0 | used |
| 41 | Got Charmander | 2 | 1 | 0 | 0 | used |
| 42 | Got Squirtle | 10 | 1 | 0 | 0 | used |
| 43 | 3rd Gym Switch | 7 | 1 | 2 | 0 | used |
| 44 | 3rd Gym Switch 2 | 7 | 1 | 2 | 0 | used |
| 45 | S.S. Anne Beat | 3 | 1 | 0 | 0 | used |
| 46 | Defeated Gym 4-2 | 1 | 1 | 0 | 0 | used |
| 47 | Defeated Pokemon Tower | 1 | 1 | 0 | 0 | used |
| 48 | Safari Zone | 29 | 1 | 0 | 0 | used |
| 49 | Togepi | 2 | 1 | 0 | 0 | used |
| 50 | Vermillion Ticket | 1 | 1 | 0 | 0 | used |
| 51 | Visited Berth Island | 0 | 1 | 0 | 0 | write only/static |
| 52 | Visited Faraday Island | 0 | 1 | 0 | 0 | write only/static |
| 53 | Latias/Latios roaming | 1 | 1 | 0 | 0 | used |
| 54 | Kyogre roaming | 1 | 1 | 0 | 0 | used |
| 55 | Entei roaming | 1 | 1 | 0 | 0 | used |
| 56 | Reset Mew encounter | 1 | 1 | 1 | 0 | used |
| 57 | Boulder down hole rock cave | 2 | 1 | 0 | 0 | used |
| 58 | Boulder down hole ice cave | 2 | 1 | 0 | 0 | used |
| 59 | Cinnabar Gym | 1 | 1 | 0 | 0 | used |
| 60 | Defeated Gym 7-2 | 3 | 1 | 0 | 0 | used |
| 61 | Cinnabar Switch | 1 | 1 | 0 | 0 | used |
| 62 | Indigo Start | 1 | 1 | 1 | 0 | used |
| 63 | Indigo Water | 1 | 1 | 1 | 0 | used |
| 64 | Indigo Rock | 1 | 1 | 1 | 0 | used |
| 65 | Indigo Ice | 1 | 1 | 1 | 0 | used |
| 66 | Indigo Grass | 1 | 1 | 1 | 0 | used |
| 67 | Kingler Image | 1 | 1 | 0 | 0 | used |
| 68 | Indigo Brock | 3 | 1 | 1 | 0 | used |
| 69 | Indigo Done | 10 | 1 | 1 | 0 | used |
| 70 | Fearow | 3 | 1 | 0 | 0 | used |
| 71 | Fearow Done | 4 | 1 | 0 | 0 | used |
| 72 | Got GS Ball | 7 | 1 | 0 | 0 | used |
| 73 | Defeated Gym 8.1 | 12 | 1 | 0 | 0 | used |
| 74 | Defeated Gym 8.2 | 4 | 1 | 0 | 0 | used |
| 75 | Defeated Gym 8.3 | 10 | 1 | 0 | 0 | used |
| 76 | Defeated Gym 8.4 | 10 | 1 | 0 | 0 | used |
| 77 | Snorlax Go | 2 | 1 | 2 | 0 | used |
| 78 | Snorlax Stop | 8 | 2 | 0 | 0 | used |
| 79 | Ascorbia Wartortle | 18 | 1 | 0 | 0 | used |
| 80 | Registered Drake | 1 | 1 | 0 | 0 | used |
| 81 | Beat Drake | 15 | 1 | 0 | 0 | used |
| 82 | Start Johto | 1 | 1 | 0 | 0 | used |
| 83 | Beat Gym 9 | 5 | 1 | 0 | 0 | used |
| 84 | Beat Gym 10 | 7 | 1 | 0 | 0 | used |
| 85 | Beat Gym 11 | 15 | 1 | 0 | 0 | used |
| 86 | Beat Gym 12 | 12 | 1 | 0 | 0 | used |
| 87 | Beat Gym 13 | 19 | 1 | 0 | 0 | used |
| 88 | Beat Gym 14 | 9 | 1 | 0 | 0 | used |
| 89 | Beat Gym 15 | 15 | 1 | 0 | 0 | used |
| 90 | Beat Gym 16 | 19 | 1 | 0 | 0 | used |
| 91 | Sprout Tower | 2 | 1 | 0 | 0 | used |
| 92 | GS Ball Delivered | 3 | 1 | 0 | 0 | used |
| 93 | Squirtle Swap Meet | 1 | 3 | 0 | 0 | used |
| 94 | Got Totodile | 0 | 1 | 0 | 0 | write only/static |
| 95 | Sudowoodo | 2 | 2 | 0 | 0 | used |
| 96 | Burned Tower | 2 | 1 | 0 | 0 | used |
| 97 | Sumo Wrestling | 1 | 1 | 0 | 0 | used |
| 98 | Glitter Lighthouse | 5 | 1 | 1 | 0 | used |
| 99 | Misty Whirl Islands | 1 | 1 | 0 | 0 | used |
| 100 | Whirl Islands Registration | 2 | 1 | 0 | 0 | used |
| 101 | Won Whirl Cup | 2 | 1 | 0 | 0 | used |
| 102 | Lake of Rage | 11 | 4 | 0 | 0 | used |
| 103 | Defeated Gym 16-2 | 14 | 1 | 0 | 0 | used |
| 104 | Dragon Holy Land | 1 | 1 | 0 | 0 | used |
| 105 | Silver Conference Start | 1 | 1 | 1 | 0 | used |
| 106 | Elimination Won | 1 | 1 | 1 | 0 | used |
| 107 | Robin 1 Won | 1 | 1 | 1 | 0 | used |
| 108 | Robin 2 Won | 2 | 1 | 1 | 0 | used |
| 109 | Silver Gary | 2 | 1 | 1 | 0 | used |
| 110 | Silver Harrison | 12 | 1 | 1 | 0 | used |
| 111 | Start Hoenn | 22 | 1 | 0 | 0 | used |
| 112 | Met Birch | 9 | 1 | 0 | 0 | used |
| 113 | Beat Gym 17 | 23 | 1 | 0 | 0 | used |
| 114 | Beat Gym 18 | 11 | 1 | 0 | 0 | used |
| 115 | Beat Gym 19 | 14 | 1 | 0 | 0 | used |
| 116 | Beat Gym 20 | 28 | 1 | 0 | 0 | used |
| 117 | Beat Gym 21 | 7 | 1 | 0 | 0 | used |
| 118 | Beat Gym 22 | 13 | 1 | 0 | 0 | used |
| 119 | Beat Gym 23 | 14 | 2 | 0 | 0 | used |
| 120 | Beat Gym 24 | 20 | 1 | 0 | 0 | used |
| 121 | Met Roxanne | 2 | 2 | 0 | 0 | used |
| 122 | Beat Gym 18.2 | 1 | 1 | 0 | 0 | used |
| 123 | Slateport Contest | 2 | 0 | 0 | 0 | read/access only |
| 124 | Fallabor Contest | 4 | 1 | 0 | 0 | used |
| 125 | Feather Carnival | 5 | 1 | 0 | 0 | used |
| 126 | Izabe Island | 1 | 1 | 0 | 0 | used |
| 127 | Izabe End | 3 | 1 | 0 | 0 | used |
| 128 | Pacifidlog | 1 | 1 | 0 | 0 | used |
| 129 | Go Ever Grande | 1 | 1 | 0 | 0 | used |
| 130 | Ever Grande Start | 1 | 1 | 1 | 0 | used |
| 131 | Doubles 1 | 2 | 1 | 2 | 0 | used |
| 132 | Grande 32 | 1 | 1 | 1 | 0 | used |
| 133 | Grande 16 | 1 | 1 | 1 | 0 | used |
| 134 | Grande 8 | 1 | 1 | 1 | 0 | used |
| 135 | Ever Grande over | 11 | 1 | 1 | 0 | used |
| 136 | Doubles 1.1 | 2 | 2 | 2 | 0 | used |
| 137 | Doubles 1.2 | 2 | 2 | 1 | 0 | used |
| 138 | Frontier Start | 67 | 1 | 0 | 0 | used |
| 139 | Beat Factory | 7 | 1 | 0 | 0 | used |
| 140 | Beat Arena | 6 | 1 | 0 | 0 | used |
| 141 | Beat Dome | 2 | 1 | 0 | 0 | used |
| 142 | Beat Pike | 7 | 1 | 0 | 0 | used |
| 143 | Beat Palace | 3 | 1 | 0 | 0 | used |
| 144 | Beat Tower | 4 | 1 | 0 | 0 | used |
| 145 | Beat Pyramid | 15 | 1 | 0 | 0 | used |
| 146 | Rocket Egg | 27 | 1 | 0 | 0 | used |
| 147 | Beat Tower.5 | 2 | 1 | 0 | 0 | used |
| 148 | Pyramid.1 | 3 | 1 | 0 | 0 | used |
| 149 | Pyramid.2 | 18 | 1 | 0 | 0 | used |
| 150 | Aipom Start | 1 | 1 | 0 | 0 | used |
| 151 | Aipom Stop | 1 | 1 | 0 | 0 | used |
| 152 | Sinnoh Start | 15 | 1 | 0 | 0 | used |
| 153 | Met Paul | 8 | 1 | 0 | 0 | used |
| 154 | Beat Gym 25 | 8 | 1 | 0 | 0 | used |
| 155 | Beat Gym 26 | 21 | 1 | 0 | 0 | used |
| 156 | Beat Gym 27 | 23 | 1 | 0 | 0 | used |
| 157 | Beat Gym 28 | 24 | 1 | 0 | 0 | used |
| 158 | Beat Gym 29 | 7 | 1 | 0 | 0 | used |
| 159 | Beat Gym 30 | 37 | 1 | 0 | 0 | used |
| 160 | Beat Gym 31 | 20 | 1 | 0 | 0 | used |
| 161 | Beat Gym 32 | 19 | 1 | 0 | 0 | used |
| 162 | Got Turtwig | 2 | 2 | 0 | 0 | used |
| 163 | Brock Jubilife | 1 | 1 | 0 | 0 | used |
| 164 | Met Roark | 1 | 1 | 0 | 0 | used |
| 165 | Floaroma Contest | 2 | 1 | 0 | 0 | used |
| 166 | Gardenia Gym | 1 | 2 | 0 | 0 | used |
| 167 | Start Tag Battle | 3 | 1 | 1 | 0 | used |
| 168 | End Tag Battle | 16 | 1 | 0 | 0 | used |
| 169 | Tag Battle 2 | 1 | 1 | 1 | 0 | used |
| 170 | Joined Paul | 2 | 1 | 0 | 0 | used |
| 171 | Tag Battle 4 | 1 | 1 | 1 | 0 | used |
| 172 | Tag Battle 3 | 1 | 1 | 1 | 0 | used |
| 173 | Lose Paul | 1 | 1 | 1 | 0 | used |
| 174 | Chimchar | 4 | 1 | 2 | 0 | used |
| 175 | Mid Tag Battle | 2 | 2 | 1 | 0 | used |
| 176 | Lose Paul 2 | 1 | 1 | 1 | 0 | used |
| 177 | Solaceon Ruins | 1 | 1 | 0 | 0 | used |
| 178 | Met Reggie | 2 | 1 | 0 | 0 | used |
| 179 | Met Wallace | 10 | 1 | 0 | 0 | used |
| 180 | Sinnoh May | 2 | 1 | 0 | 0 | used |
| 181 | Brock Pastoria | 1 | 1 | 0 | 0 | used |
| 182 | Sinnoh Gary | 1 | 1 | 0 | 0 | used |
| 183 | Secret Potion | 3 | 1 | 0 | 0 | used |
| 184 | Met Fantina | 4 | 3 | 0 | 0 | used |
| 185 | Celestic Ruins | 33 | 1 | 0 | 0 | used |
| 186 | Brandon Sinnoh | 1 | 1 | 0 | 0 | used |
| 187 | Paul 6v6 | 9 | 1 | 0 | 0 | used |
| 188 | Palmer | 1 | 1 | 0 | 0 | used |
| 189 | Flint | 2 | 1 | 0 | 0 | used |
| 190 | Defeated Gym 32-2 | 13 | 1 | 0 | 0 | used |
| 191 | Sunnyshore Tower | 9 | 1 | 0 | 0 | used |
| 192 | Lily Start | 1 | 1 | 1 | 0 | used |
| 193 | Lily Round 2 | 1 | 1 | 1 | 0 | used |
| 194 | Lily Conway | 2 | 1 | 1 | 0 | used |
| 195 | Lily Paul | 3 | 1 | 1 | 0 | used |
| 196 | Lily Tobias | 4 | 1 | 1 | 0 | used |
| 197 | Lily Done | 14 | 1 | 1 | 0 | used |
| 198 | Unova Start | 23 | 1 | 0 | 0 | used |
| 199 | Met Juniper | 9 | 1 | 0 | 0 | used |
| 200 | Beat Gym 33 | 7 | 1 | 0 | 0 | used |
| 201 | Beat Gym 34 | 8 | 1 | 0 | 0 | used |
| 202 | Beat Gym 35 | 9 | 1 | 0 | 0 | used |
| 203 | Beat Gym 36 | 6 | 1 | 0 | 0 | used |
| 204 | Beat Gym 37 | 13 | 1 | 0 | 0 | used |
| 205 | Beat Gym 38 | 12 | 1 | 0 | 0 | used |
| 206 | Beat Gym 39 | 15 | 1 | 0 | 0 | used |
| 207 | Beat Gym 40 | 19 | 1 | 0 | 0 | used |
| 208 | Met Oshawott | 1 | 1 | 1 | 0 | used |
| 209 | Juniper Oshawott | 1 | 1 | 0 | 0 | used |
| 210 | Met Tepig | 1 | 1 | 0 | 0 | used |
| 211 | Straiton Gym Start | 3 | 3 | 0 | 0 | used |
| 212 | Beat Chili | 1 | 1 | 0 | 0 | used |
| 213 | Beat Cress | 2 | 1 | 0 | 0 | used |
| 214 | Met Snivy | 1 | 1 | 0 | 0 | used |
| 215 | Lenora Bookcase | 8 | 1 | 0 | 0 | used |
| 216 | Beat Gym 34.2 | 1 | 1 | 0 | 0 | used |
| 217 | Hawkes | 1 | 1 | 0 | 0 | used |
| 218 | Met Burgh | 6 | 3 | 0 | 0 | used |
| 219 | Venipede Fix | 59 | 1 | 0 | 0 | used |
| 220 | Club Battle over | 3 | 1 | 0 | 0 | used |
| 221 | Met Clay | 2 | 1 | 0 | 0 | used |
| 222 | Beat Subway | 6 | 1 | 0 | 0 | used |
| 223 | Subway Over | 1 | 1 | 1 | 0 | used |
| 224 | Forces of Nature | 2 | 1 | 0 | 0 | used |
| 225 | Met Skyla | 1 | 1 | 0 | 0 | used |
| 226 | Clubsplosion over | 2 | 1 | 0 | 0 | used |
| 227 | Mistralton Tower | 0 | 0 | 0 | 0 | no literal use |
| 228 | Tiwst Mountain | 2 | 1 | 0 | 0 | used |
| 229 | Meloetta Over | 1 | 3 | 1 | 0 | used |
| 230 | Found Meloetta | 1 | 1 | 0 | 0 | used |
| 231 | Undella Town | 10 | 1 | 0 | 0 | used |
| 232 | Unova Dawn | 2 | 1 | 0 | 0 | used |
| 233 | Junior Cup Over | 50 | 1 | 0 | 0 | used |
| 234 | Meloetta Gone | 50 | 1 | 0 | 0 | used |
| 235 | Opelucid Iris | 10 | 1 | 0 | 0 | used |
| 236 | Vetress Start | 1 | 1 | 1 | 0 | used |
| 237 | Vetress 64 | 1 | 1 | 1 | 0 | used |
| 238 | Vetress 32 | 1 | 1 | 1 | 0 | used |
| 239 | Vetress 16 | 1 | 1 | 1 | 0 | used |
| 240 | Vetress 8 | 1 | 1 | 1 | 0 | used |
| 241 | Vetress Done | 3 | 1 | 1 | 0 | used |
| 242 | N arc | 6 | 1 | 0 | 0 | used |
| 243 | No Meloetta | 1 | 1 | 0 | 0 | used |
| 244 | Beat Cheren | 13 | 1 | 0 | 0 | used |
| 245 | Reshiram | 26 | 1 | 0 | 0 | used |
| 246 | Pokedex | 1 | 1 | 1 | 0 | used |
| 247 | Beat Whirl Cup | 6 | 1 | 0 | 0 | used |
| 248 | Lake of Rage Done | 1 | 2 | 0 | 0 | used |
| 249 | Beat Gym 41 | 8 | 1 | 0 | 0 | used |
| 250 | Beat Gym 42 | 11 | 1 | 0 | 0 | used |
| 251 | Beat Gym 43 | 17 | 1 | 0 | 0 | used |
| 252 | Beat Gym 44 | 46 | 1 | 0 | 0 | used |
| 253 | Beat Gym 45 | 7 | 1 | 0 | 0 | used |
| 254 | Beat Gym 46 | 16 | 1 | 0 | 0 | used |
| 255 | Beat Gym 47 | 18 | 1 | 0 | 0 | used |
| 256 | Beat Gym 48 | 14 | 1 | 0 | 0 | used |
| 257 | Met Sycamore | 8 | 1 | 0 | 0 | used |
| 258 | Froakie | 2 | 1 | 0 | 0 | used |
| 259 | Got Mega Ring | 4 | 1 | 0 | 0 | used |
| 260 | Met Clemont | 4 | 1 | 0 | 0 | used |
| 261 | Clemont gym fix | 1 | 1 | 0 | 0 | used |
| 262 | Poke Flute | 4 | 1 | 0 | 0 | used |
| 263 | Met Diantha | 2 | 1 | 0 | 0 | used |
| 264 | Coumarine Clemont | 1 | 1 | 0 | 0 | used |
| 265 | Poké Ball Factory | 3 | 1 | 0 | 0 | used |
| 266 | Met Olympia | 2 | 1 | 0 | 0 | used |
| 267 | Team Flare begin | 6 | 1 | 0 | 0 | used |
| 268 | Sawyer Couriway | 11 | 1 | 0 | 0 | used |
| 269 | Terminus Cave | 6 | 1 | 0 | 0 | used |
| 270 | Beat Gym 48.2 | 13 | 1 | 0 | 0 | used |
| 271 | Pokémon Village | 1 | 1 | 0 | 0 | used |
| 272 | Clemont League | 3 | 1 | 0 | 0 | used |
| 273 | Lumiose Start | 1 | 1 | 1 | 0 | used |
| 274 | Lumiose 32 | 1 | 1 | 1 | 0 | used |
| 275 | Lumiose 16 | 1 | 1 | 1 | 0 | used |
| 276 | Lumiose 8 | 1 | 1 | 1 | 0 | used |
| 277 | Lumiose 4 | 2 | 1 | 1 | 0 | used |
| 278 | Lumiose Finals | 3 | 1 | 1 | 0 | used |
| 279 | Lumiose Team Flare | 32 | 1 | 1 | 0 | used |
| 280 | Team Flare Done | 15 | 1 | 1 | 0 | used |
| 281 | Kalos Done | 12 | 1 | 1 | 0 | used |
| 282 | Met Tracey | 1 | 1 | 0 | 0 | used |
| 283 | Met Elm | 3 | 1 | 0 | 0 | used |
| 284 | Mirage Kingdom | 2 | 1 | 0 | 0 | used |
| 285 | Alola Start | 27 | 1 | 0 | 0 | used |
| 286 | Earth Badge | 1 | 1 | 0 | 0 | used |
| 287 | Alola Mom | 3 | 1 | 0 | 0 | used |
| 288 | Egg Delivered | 4 | 1 | 0 | 0 | used |
| 289 | Start School | 2 | 1 | 0 | 0 | used |
| 290 | Got Rotom Dex | 35 | 1 | 0 | 0 | used |
| 291 | Rotom Over | 1 | 1 | 1 | 0 | used |
| 292 | First Lesson | 4 | 1 | 0 | 0 | used |
| 293 | Melemele Forest Done | 8 | 1 | 0 | 0 | used |
| 294 | Classmate Battle 1 | 8 | 4 | 0 | 0 | used |
| 295 | Start Lana | 5 | 1 | 0 | 0 | used |
| 296 | Classmate Switch | 15 | 21 | 16 | 0 | used |
| 297 | Lana Gyarados | 9 | 1 | 0 | 0 | used |
| 298 | Start Sophocles | 7 | 1 | 0 | 0 | used |
| 299 | Beat Mall | 16 | 2 | 0 | 0 | used |
| 300 | Start Llillie | 5 | 1 | 0 | 0 | used |
| 301 | Beat Hobbes | 8 | 1 | 0 | 0 | used |
| 302 | Bridge Open | 9 | 1 | 0 | 0 | used |
| 303 | Met Hala | 4 | 1 | 0 | 0 | used |
| 304 | Beat Trial 1 | 5 | 1 | 0 | 0 | used |
| 305 | Beat Trial 2 | 5 | 1 | 0 | 0 | used |
| 306 | Beat Trial 3 | 15 | 1 | 0 | 0 | used |
| 307 | Beat Trial 4 | 8 | 1 | 0 | 0 | used |
| 308 | Beat Trial 5 | 0 | 0 | 0 | 0 | no literal use |
| 309 | Beat Trial 6 | 0 | 0 | 0 | 0 | no literal use |
| 310 | Beat Grand Trial 1 | 7 | 1 | 0 | 0 | used |
| 311 | Beat Grand Trial 2 | 5 | 1 | 0 | 0 | used |
| 312 | Beat Grand Trial 3 | 7 | 1 | 0 | 0 | used |
| 313 | Beat Grand Trial 4 | 9 | 1 | 0 | 0 | used |
| 314 | Start Lillie 2 | 9 | 1 | 0 | 0 | used |
| 315 | Beat Lillie | 3 | 1 | 0 | 0 | used |
| 316 | Beat Kiawe | 10 | 1 | 0 | 0 | used |
| 317 | Start Mallow | 7 | 1 | 0 | 0 | used |
| 318 | Got Nectar | 3 | 1 | 0 | 0 | used |
| 319 | Beat Mallow | 6 | 1 | 0 | 0 | used |
| 320 | Start Gladion | 7 | 1 | 0 | 0 | used |
| 321 | Beat Gladion | 3 | 1 | 0 | 0 | used |
| 322 | Start Akala | 14 | 1 | 0 | 0 | used |
| 323 | Go to Akala | 21 | 1 | 0 | 0 | used |
| 324 | Finished Lana | 1 | 1 | 1 | 0 | used |
| 325 | Wela Volcano | 4 | 1 | 0 | 0 | used |
| 326 | Sophocles.1 | 6 | 1 | 0 | 0 | used |
| 327 | Beat Sophocles.1 | 3 | 1 | 0 | 0 | used |
| 328 | Return to Kanto | 11 | 1 | 0 | 0 | used |
| 329 | Kanto Go | 20 | 1 | 0 | 0 | used |
| 330 | Beat Misty | 1 | 1 | 0 | 0 | used |
| 331 | Beat Brock | 1 | 1 | 0 | 0 | used |
| 332 | Return to School | 17 | 1 | 0 | 0 | used |
| 333 | Rocket Return Kanto | 5 | 1 | 0 | 0 | used |
| 334 | Find Nebby | 3 | 1 | 0 | 0 | used |
| 335 | Found Nebby | 4 | 1 | 0 | 0 | used |
| 336 | Nebby Over | 1 | 1 | 1 | 0 | used |
| 337 | Named Nebby | 3 | 1 | 0 | 0 | used |
| 338 | To Aether | 13 | 1 | 0 | 0 | used |
| 339 | Go To Aether | 3 | 1 | 0 | 0 | used |
| 340 | Finished Aether | 12 | 1 | 0 | 0 | used |
| 341 | Ten Carat Hill | 4 | 1 | 0 | 0 | used |
| 342 | Beat Gladion 2 | 6 | 1 | 0 | 0 | used |
| 343 | Visit Faba | 12 | 1 | 0 | 0 | used |
| 344 | Cosmoem | 5 | 1 | 0 | 0 | used |
| 345 | To Poni Island | 7 | 1 | 0 | 0 | used |
| 346 | Beat Lusamine | 7 | 1 | 0 | 0 | used |
| 347 | Saved Lusamine | 10 | 1 | 0 | 0 | used |
| 348 | Begin Snow Mnt | 10 | 1 | 0 | 0 | used |
| 349 | Go To Lanakila | 2 | 1 | 0 | 0 | used |
| 350 | Lillie Lanakila | 6 | 1 | 0 | 0 | used |
| 351 | Start UB | 16 | 1 | 0 | 0 | used |
| 352 | Find Buzzwole | 4 | 1 | 0 | 0 | used |
| 353 | Found Buzzwole | 5 | 1 | 0 | 0 | used |
| 354 | Go Royal Avenue | 7 | 1 | 0 | 0 | used |
| 355 | Beat Masked Royal | 21 | 4 | 0 | 0 | used |
| 356 | Remove Kiawe | 1 | 4 | 1 | 0 | used |
| 357 | Remove Sophocles | 1 | 2 | 1 | 0 | used |
| 358 | Find Poipole | 5 | 1 | 0 | 0 | used |
| 359 | Found Poipole | 6 | 2 | 0 | 0 | used |
| 360 | Paul remove Chimchar | 1 | 1 | 0 | 0 | used |
| 361 | Celesteela | 6 | 1 | 0 | 0 | used |
| 362 | Kiawe Farm | 3 | 1 | 0 | 0 | used |
| 363 | Lana Dewpider | 3 | 1 | 0 | 0 | used |
| 364 | Mallow Shop | 4 | 1 | 0 | 0 | used |
| 365 | Day done | 4 | 1 | 0 | 0 | used |
| 366 | UlaUla Island | 6 | 1 | 0 | 0 | used |
| 367 | Met Nanu | 7 | 1 | 0 | 0 | used |
| 368 | Tapu Bulu | 10 | 1 | 0 | 0 | used |
| 369 | UB 1 and 2 | 4 | 1 | 0 | 0 | used |
| 370 | Blacephalon | 1 | 1 | 0 | 0 | used |
| 371 | UB done | 2 | 1 | 0 | 0 | used |
| 372 | Hokulani Observatory | 1 | 1 | 0 | 0 | used |
| 373 | Lillie Lanakila | 1 | 1 | 0 | 0 | used |
| 374 | Beat Lillie Lanakila | 6 | 1 | 0 | 0 | used |
| 375 | Masked Royal 2 | 2 | 1 | 0 | 0 | used |
| 376 | Remove Masked Royal | 1 | 2 | 1 | 0 | used |
| 377 | Won Battle Dome | 4 | 3 | 0 | 0 | used |
| 378 | Xurkitree | 1 | 1 | 0 | 0 | used |
| 379 | Stakataka | 6 | 1 | 0 | 0 | used |
| 380 | Got Stakataka | 3 | 1 | 0 | 0 | used |
| 381 | Lunala | 21 | 1 | 0 | 0 | used |
| 382 | Necrozma | 20 | 1 | 0 | 0 | used |
| 383 | Find Hau | 5 | 1 | 0 | 0 | used |
| 384 | Beat Hau | 3 | 1 | 0 | 0 | used |
| 385 | Guzzlord | 14 | 1 | 0 | 0 | used |
| 386 | Beat Alola Misty | 2 | 1 | 0 | 0 | used |
| 387 | Beat Alola Brock | 3 | 1 | 0 | 0 | used |
| 388 | Start Poni | 11 | 1 | 0 | 0 | used |
| 389 | Go Poni | 8 | 1 | 0 | 0 | used |
| 390 | Beat Hapu | 2 | 1 | 0 | 0 | used |
| 391 | Beat Poni Lillie | 5 | 1 | 0 | 0 | used |
| 392 | Beat Poni Sophocles | 5 | 1 | 0 | 0 | used |
| 393 | Beat Poni Lana | 5 | 1 | 0 | 0 | used |
| 394 | Meltan Go | 4 | 1 | 0 | 0 | used |
| 395 | Meltan Got | 1 | 2 | 0 | 0 | used |
| 396 | TR Meltan | 5 | 1 | 0 | 0 | used |
| 397 | Pheramosa | 3 | 1 | 0 | 0 | used |
| 398 | Guzma | 4 | 1 | 0 | 0 | used |
| 399 | Beat Guzma | 5 | 1 | 0 | 0 | used |
| 400 | Malie Go | 10 | 1 | 0 | 0 | used |
| 401 | Malie Start | 6 | 1 | 0 | 0 | used |
| 402 | Beat Kantonian Gym | 15 | 1 | 0 | 0 | used |
| 403 | Kartana | 8 | 2 | 0 | 0 | used |
| 404 | Manalo Concept | 12 | 1 | 0 | 0 | used |
| 405 | Manalo Go | 3 | 1 | 0 | 0 | used |
| 406 | Manalo Start | 1 | 1 | 1 | 0 | used |
| 407 | Manalo Royal 1 | 9 | 8 | 0 | 0 | used |
| 408 | Manalo Royal 2 | 8 | 8 | 0 | 0 | used |
| 409 | Manalo Royal 3 | 33 | 14 | 1 | 0 | used |
| 410 | Manalo 8 | 18 | 1 | 1 | 0 | used |
| 411 | Manalo 4 | 23 | 1 | 1 | 0 | used |
| 412 | Manalo Finals | 26 | 1 | 1 | 0 | used |
| 413 | Guzzlord League | 58 | 1 | 0 | 0 | used |
| 414 | Guzzlord Defeat | 25 | 1 | 0 | 0 | used |
| 415 | Kukui Fight | 25 | 1 | 0 | 0 | used |
| 416 | Beat Gym 11.2 | 1 | 1 | 0 | 0 | used |
| 417 | Lugia Over | 4 | 1 | 0 | 0 | used |
| 418 | Devon Aqua | 2 | 1 | 0 | 0 | used |
| 419 | Slateport Magma | 3 | 1 | 0 | 0 | used |
| 420 | Weather Institute | 14 | 1 | 0 | 0 | used |
| 421 | Aqua/Magma | 17 | 1 | 0 | 0 | used |
| 422 | 124 Aqua | 5 | 1 | 0 | 0 | used |
| 423 | 124 Magma | 5 | 1 | 0 | 0 | used |
| 424 | Frontier Pass | 2 | 1 | 0 | 0 | used |
| 425 | Kanto Grand Festival | 2 | 1 | 0 | 0 | used |
| 426 | Jubilife Contest | 4 | 1 | 0 | 0 | used |
| 427 | Last Classroom | 12 | 1 | 0 | 0 | used |
| 428 | Alola Done | 12 | 1 | 0 | 0 | used |
| 429 | Postgame | 388 | 1 | 3 | 0 | used |
| 430 | Galar Start | 58 | 1 | 0 | 0 | used |
| 431 | Galactic Veilstone | 10 | 1 | 0 | 0 | used |
| 432 | Valor Contest | 3 | 1 | 0 | 0 | used |
| 433 | Finished Cynthia | 1 | 1 | 1 | 0 | used |
| 434 | Celestic Galactic | 26 | 1 | 0 | 0 | used |
| 435 | Iron Island Galactic | 6 | 1 | 0 | 0 | used |
| 436 | Spear Pillar | 20 | 1 | 0 | 0 | used |
| 437 | Growlie | 6 | 1 | 0 | 0 | used |
| 438 | Sinnoh Grand Festival | 1 | 1 | 0 | 0 | used |
| 439 | Kalos Start | 1 | 1 | 0 | 0 | used |
| 440 | First Skull | 2 | 1 | 0 | 0 | used |
| 441 | Met Ilima | 13 | 1 | 0 | 0 | used |
| 442 | Find Mina | 7 | 1 | 0 | 0 | used |
| 443 | Poni Skull | 2 | 1 | 0 | 0 | used |
| 444 | Manalo Skull | 16 | 1 | 0 | 0 | used |
| 445 | Learnt Z Move | 3 | 1 | 0 | 0 | used |
| 446 | Mr Mime | 2 | 2 | 0 | 0 | used |
| 447 | Lugia Vermilion | 7 | 1 | 0 | 0 | used |
| 448 | Luigia Vermilion Done | 10 | 3 | 0 | 0 | used |
| 449 | Venusuar JN | 41 | 2 | 0 | 1 | used |
| 450 | Begin Galar | 31 | 1 | 0 | 1 | used |
| 451 | Flute Cup | 19 | 1 | 0 | 1 | used |
| 452 | Flute Cup Over | 23 | 1 | 0 | 1 | used |
| 453 | Dragonite Island | 0 | 0 | 0 | 0 | no literal use |
| 454 | Galar Champion | 22 | 1 | 0 | 1 | used |
| 455 | Unova Ruins | 15 | 1 | 0 | 1 | used |
| 456 | WCS Start | 17 | 1 | 0 | 1 | used |
| 457 | WCS Oliver | 6 | 1 | 0 | 1 | used |
| 458 | WCS Hayden | 11 | 1 | 0 | 1 | used |
| 459 | Resort Area | 8 | 1 | 0 | 1 | used |
| 460 | WCS Korrina | 14 | 1 | 0 | 1 | used |
| 461 | Raihan/Sonia | 17 | 1 | 0 | 1 | used |
| 462 | Sonia | 1 | 1 | 0 | 0 | used |
| 463 | Raihan | 1 | 1 | 0 | 0 | used |
| 464 | WCS Tony | 6 | 1 | 0 | 1 | used |
| 465 | WCS Kricketina Kylie | 14 | 1 | 0 | 1 | used |
| 466 | Goh Heracross | 5 | 1 | 0 | 1 | used |
| 467 | WCS Bea | 6 | 1 | 0 | 1 | used |
| 468 | WCS Wrap | 5 | 1 | 0 | 1 | used |
| 469 | WCS Bind | 2 | 1 | 0 | 1 | used |
| 470 | Flygon | 2 | 1 | 0 | 1 | used |
| 471 | Alola Return | 13 | 1 | 0 | 1 | used |
| 472 | Alola Battle | 6 | 2 | 0 | 0 | used |
| 473 | WCS Carmo | 12 | 4 | 0 | 1 | used |
| 474 | WCS Bea 2 | 3 | 1 | 0 | 1 | used |
| 475 | Zapdos | 9 | 1 | 0 | 1 | used |
| 476 | Finished Goh | 4 | 2 | 1 | 0 | used |
| 477 | Team Rocket PP | 6 | 1 | 0 | 0 | used |
| 478 | Darkest Day Start | 8 | 1 | 0 | 1 | used |
| 479 | Dynamax Centy | 4 | 1 | 0 | 1 | used |
| 480 | Dynamax Pangoro | 7 | 1 | 0 | 1 | used |
| 481 | Dynamax Coalossal | 6 | 1 | 0 | 1 | used |
| 482 | Rose Tower | 6 | 1 | 0 | 1 | used |
| 483 | Hammerlocke | 10 | 1 | 0 | 1 | used |
| 484 | Rose Battle | 2 | 1 | 0 | 1 | used |
| 485 | Eternatus | 1 | 1 | 0 | 1 | used |
| 486 | WCS Maike | 13 | 1 | 0 | 1 | used |
| 487 | Finished Goh 2 | 2 | 1 | 1 | 0 | used |
| 488 | WCS Riven | 1 | 1 | 0 | 1 | used |
| 489 | WCS Patrick | 1 | 1 | 0 | 1 | used |
| 490 | Mewtwo | 3 | 1 | 0 | 1 | used |
| 491 | WCS Ariel | 2 | 1 | 0 | 1 | used |
| 492 | Galar Fossil | 13 | 1 | 0 | 1 | used |
| 493 | Riolu Switch | 1 | 2 | 0 | 0 | used |
| 494 | Max Raid Switch | 0 | 0 | 0 | 0 | no literal use |
| 495 | Hard Mode Raid | 0 | 0 | 0 | 0 | no literal use |
| 496 | No Fly | 1 | 24 | 37 | 2 | used |
| 497 | No Ultra Burst | 0 | 0 | 0 | 0 | no literal use |
| 498 | No Dynamax | 0 | 0 | 0 | 0 | no literal use |
| 499 | No PBL | 0 | 0 | 0 | 0 | no literal use |
| 500 | No Z-Move | 0 | 1 | 1 | 0 | write only/static |
| 501 | WCS Johan | 6 | 1 | 0 | 1 | used |
| 502 | WCS Kate | 2 | 1 | 0 | 1 | used |
| 503 | WCS Muse | 1 | 1 | 0 | 1 | used |
| 504 | WCS Dozer | 1 | 1 | 0 | 1 | used |
| 505 | Ballonlea | 9 | 1 | 0 | 1 | used |
| 506 | WCS Harry | 6 | 1 | 0 | 1 | used |
| 507 | Wikstrom | 4 | 1 | 0 | 1 | used |
| 508 | WCS Rinto | 6 | 1 | 0 | 1 | used |
| 509 | WCS Iris | 11 | 1 | 0 | 1 | used |
| 510 | Moltres | 17 | 1 | 0 | 1 | used |
| 511 | Alolan Ninetales | 18 | 1 | 0 | 1 | used |
| 512 | Cressila/Darkrai | 15 | 1 | 0 | 1 | used |
| 513 | Goh Battle | 17 | 1 | 0 | 1 | used |
| 514 | WCS Volkner | 13 | 1 | 0 | 1 | used |
| 515 | PM Volcarona | 19 | 1 | 0 | 1 | used |
| 516 | Opal | 13 | 1 | 0 | 1 | used |
| 517 | WCS Bea 3 | 15 | 1 | 0 | 1 | used |
| 518 | Dialga/Palkia | 26 | 1 | 0 | 1 | used |
| 519 | Max Soup | 54 | 2 | 0 | 1 | used |
| 520 | TG Hisui | 16 | 1 | 0 | 1 | used |
| 521 | TG Brock | 7 | 1 | 0 | 1 | used |
| 522 | TG Heatran | 24 | 1 | 0 | 1 | used |
| 523 | JN Sophocles | 34 | 1 | 0 | 1 | used |
| 524 | WCS Marnie | 12 | 1 | 0 | 1 | used |
| 525 | Piers | 8 | 1 | 0 | 1 | used |
| 526 | PM Articuno | 10 | 1 | 0 | 1 | used |
| 527 | JN Clemont | 24 | 1 | 0 | 1 | used |
| 528 | Drasna | 6 | 1 | 0 | 1 | used |
| 529 | JN Wallace | 26 | 1 | 0 | 1 | used |
| 530 | JN Serena | 4 | 1 | 3 | 1 | used |
| 531 | WCS Raihan | 23 | 1 | 3 | 1 | used |
| 532 | Crown Tundra | 5 | 1 | 0 | 1 | used |
| 533 | Alola Battle Royal | 30 | 1 | 0 | 1 | used |
| 534 | Pallet Town Paul | 17 | 2 | 0 | 1 | used |
| 535 | Remove Gladion | 2 | 2 | 1 | 0 | used |
| 536 | Final Goh Battle | 6 | 1 | 0 | 1 | used |
| 537 | WCS Masters | 25 | 1 | 0 | 1 | used |
| 538 | Met Magnolia | 9 | 1 | 0 | 0 | used |
| 539 | WCS Intro Iris | 2 | 1 | 0 | 0 | used |
| 540 | WCS Intro Alain | 2 | 1 | 0 | 0 | used |
| 541 | WCS Intro Diantha | 2 | 1 | 0 | 0 | used |
| 542 | WCS Intro Lance | 2 | 1 | 0 | 0 | used |
| 543 | WCS Intro Steven | 2 | 1 | 0 | 0 | used |
| 544 | WCS Intro Cynthia | 2 | 1 | 0 | 0 | used |
| 545 | WCS Intro Leon | 2 | 1 | 0 | 0 | used |
| 546 | WCS Steven | 6 | 1 | 0 | 1 | used |
| 547 | WCS Cynthia | 15 | 1 | 0 | 1 | used |
| 548 | TR Break | 14 | 1 | 0 | 1 | used |
| 549 | WCS Leon | 15 | 1 | 0 | 1 | used |
| 550 | Beat Leon | 15 | 1 | 0 | 2 | used |
| 551 | WCS Master Start | 1 | 1 | 0 | 0 | used |
| 552 | Lugia battle | 11 | 1 | 0 | 1 | used |
| 553 | Leave Cerise Lab | 8 | 1 | 0 | 1 | used |
| 554 | Find Latias | 22 | 1 | 0 | 0 | used |
| 555 | Find Misty/Clauncher | 11 | 1 | 0 | 0 | used |
| 556 | Find Cilan | 10 | 1 | 0 | 0 | used |
| 557 | Beartic | 11 | 1 | 0 | 0 | used |
| 558 | Squirtle | 16 | 1 | 0 | 0 | used |
| 559 | Lapras/Wailmer | 14 | 1 | 0 | 0 | used |
| 560 | Banette | 11 | 1 | 0 | 0 | used |
| 561 | Found Banette Trainer | 1 | 1 | 0 | 0 | used |
| 562 | Jessie/James | 9 | 1 | 0 | 0 | used |
| 563 | Jessie/James Blastoff | 5 | 2 | 0 | 0 | used |
| 564 | Return Home | 7 | 1 | 0 | 0 | used |
| 565 | — | 0 | 0 | 0 | 0 | no literal use |
| 566 | Not the Monarch anymore??? | 7 | 1 | 1 | 0 | used |
| 567 | Flavor Fix | 1 | 1 | 1 | 0 | used |
| 568 | 3.4+ Brilliant | 4 | 5 | 0 | 0 | used |
| 569 | s:PBDayNight.isRainbow? | 1 | 0 | 0 | 0 | read/access only |
| 570 | No Teleport | 7 | 1 | 1 | 0 | used |
| 571 | No player Dynamax | 0 | 1 | 1 | 0 | write only/static |
| 572 | Terracotta Start | 5 | 1 | 0 | 0 | used |
| 573 | Terracotta Win | 6 | 1 | 0 | 0 | used |
| 574 | Brilliant Pokémon Switch | 0 | 0 | 0 | 0 | no literal use |
| 575 | Infinite Dynamax | 0 | 1 | 5 | 0 | write only/static |
| 576 | Spawn Postgame Mewtwo | 1 | 1 | 1 | 0 | used |
| 577 | Spawn Postgame Groudon | 1 | 1 | 1 | 0 | used |
| 578 | Spawn Postgame Kyogre | 1 | 1 | 1 | 0 | used |
| 579 | Spawn Postgame Dialga | 1 | 1 | 1 | 0 | used |
| 580 | Spawn Postgame Palkia | 1 | 1 | 1 | 0 | used |
| 581 | Spawn Postgame Tornadus | 1 | 1 | 1 | 0 | used |
| 582 | Spawn Postgame Thunderus | 1 | 1 | 1 | 0 | used |
| 583 | Spawn Postgame Landorus | 1 | 1 | 1 | 0 | used |
| 584 | Spawn Postgame Meloetta | 1 | 1 | 1 | 0 | used |
| 585 | Spawn Postgame Zygarde | 1 | 1 | 1 | 0 | used |
| 586 | Spawn Postgame Koko | 1 | 1 | 1 | 0 | used |
| 587 | Spawn Postgame Bulu | 1 | 1 | 1 | 0 | used |
| 588 | Spawn Postgame Solgaleo | 1 | 1 | 1 | 0 | used |
| 589 | Spawn Postgame Necrozma | 1 | 1 | 1 | 0 | used |
| 590 | Spawn Postgame Nihilego | 1 | 1 | 1 | 0 | used |
| 591 | Spawn Postgame Buzzwole | 1 | 1 | 1 | 0 | used |
| 592 | Spawn Postgame Pheromosa | 1 | 1 | 1 | 0 | used |
| 593 | Spawn Postgame Xurkitree | 1 | 1 | 1 | 0 | used |
| 594 | Spawn Postgame Kartana | 1 | 1 | 1 | 0 | used |
| 595 | Spawn Postgame Guzzlord | 1 | 1 | 1 | 0 | used |
| 596 | Spawn Postgame Celesteela | 1 | 1 | 1 | 0 | used |
| 597 | Spawn Postgame Stakataka | 1 | 1 | 1 | 0 | used |
| 598 | Spawn Postgame Blacephalon | 1 | 1 | 1 | 0 | used |
| 599 | Spawn Postgame Lunala | 1 | 1 | 1 | 0 | used |
| 600 | Spawn Postgame Calyrex | 1 | 1 | 1 | 0 | used |
| 601 | LOUNGE BGM | 3 | 2 | 0 | 0 | used |
| 602 | To Cerise Lab | 2 | 23 | 24 | 1 | used |
| 603 | s:visitedCianwood? | 2 | 3 | 0 | 1 | used |
| 604 | — | 0 | 0 | 0 | 1 | read/access only; unnamed |
| 605 | — | 0 | 0 | 0 | 0 | no literal use |
| 606 | — | 0 | 0 | 0 | 0 | no literal use |
| 607 | — | 0 | 0 | 0 | 0 | no literal use |
| 608 | — | 0 | 0 | 0 | 0 | no literal use |
| 609 | — | 0 | 0 | 0 | 0 | no literal use |
| 610 | — | 0 | 0 | 0 | 0 | no literal use |
| 611 | — | 0 | 0 | 0 | 0 | no literal use |
| 612 | — | 0 | 0 | 0 | 0 | no literal use |
| 613 | — | 0 | 0 | 0 | 0 | no literal use |
| 614 | — | 0 | 0 | 0 | 0 | no literal use |
| 615 | — | 0 | 0 | 0 | 0 | no literal use |
| 616 | — | 0 | 0 | 0 | 0 | no literal use |
| 617 | — | 0 | 0 | 0 | 0 | no literal use |
| 618 | — | 0 | 0 | 0 | 0 | no literal use |
| 619 | — | 0 | 0 | 0 | 0 | no literal use |
| 620 | — | 0 | 0 | 0 | 0 | no literal use |
| 621 | — | 0 | 0 | 0 | 0 | no literal use |
| 622 | — | 0 | 0 | 0 | 0 | no literal use |
| 623 | — | 0 | 0 | 0 | 0 | no literal use |
| 624 | — | 0 | 0 | 0 | 0 | no literal use |
| 625 | — | 0 | 0 | 0 | 0 | no literal use |
| 626 | PWC Registered | 5 | 1 | 11 | 0 | used |
| 627 | Is PWC Champion | 6 | 1 | 1 | 0 | used |
| 628 | — | 0 | 0 | 0 | 0 | no literal use |
| 629 | — | 0 | 0 | 0 | 0 | no literal use |
| 630 | — | 0 | 0 | 0 | 0 | no literal use |
| 631 | — | 0 | 0 | 0 | 0 | no literal use |
| 632 | — | 0 | 0 | 0 | 0 | no literal use |
| 633 | — | 0 | 0 | 0 | 0 | no literal use |
| 634 | — | 0 | 0 | 0 | 0 | no literal use |
| 635 | — | 0 | 0 | 0 | 0 | no literal use |
| 636 | — | 0 | 0 | 0 | 0 | no literal use |
| 637 | — | 0 | 0 | 0 | 0 | no literal use |
| 638 | — | 0 | 0 | 0 | 0 | no literal use |
| 639 | — | 0 | 0 | 0 | 0 | no literal use |
| 640 | — | 0 | 0 | 0 | 0 | no literal use |
| 641 | — | 0 | 0 | 0 | 0 | no literal use |
| 642 | — | 0 | 0 | 0 | 0 | no literal use |
| 643 | — | 0 | 0 | 0 | 0 | no literal use |
| 644 | — | 0 | 0 | 0 | 0 | no literal use |
| 645 | — | 0 | 0 | 0 | 0 | no literal use |
| 646 | — | 0 | 0 | 0 | 0 | no literal use |
| 647 | — | 0 | 0 | 0 | 0 | no literal use |
| 648 | — | 0 | 0 | 0 | 0 | no literal use |
| 649 | — | 0 | 0 | 0 | 0 | no literal use |
| 650 | — | 0 | 0 | 0 | 0 | no literal use |
| 651 | — | 0 | 0 | 0 | 0 | no literal use |
| 652 | — | 0 | 0 | 0 | 0 | no literal use |
| 653 | — | 0 | 0 | 0 | 0 | no literal use |
| 654 | — | 0 | 0 | 0 | 0 | no literal use |
| 655 | — | 0 | 0 | 0 | 0 | no literal use |
| 656 | — | 0 | 0 | 0 | 0 | no literal use |
| 657 | — | 0 | 0 | 0 | 0 | no literal use |
| 658 | — | 0 | 0 | 0 | 0 | no literal use |
| 659 | — | 0 | 0 | 0 | 0 | no literal use |
| 660 | — | 0 | 0 | 0 | 0 | no literal use |
| 661 | — | 0 | 0 | 0 | 0 | no literal use |
| 662 | — | 0 | 0 | 0 | 0 | no literal use |
| 663 | — | 0 | 0 | 0 | 0 | no literal use |
| 664 | — | 0 | 0 | 0 | 0 | no literal use |
| 665 | — | 0 | 0 | 0 | 0 | no literal use |
| 666 | — | 0 | 0 | 0 | 0 | no literal use |
| 667 | s:pbGet(94) >= 4 | 1 | 0 | 0 | 0 | read/access only |
| 668 | s:pbGet(95) >= 4 | 1 | 0 | 0 | 0 | read/access only |
| 669 | SYGNA BUFFS ACTIVATED | 10 | 2 | 0 | 1 | used |
| 670 | EPIC BEAT DROP | 0 | 0 | 0 | 1 | used |
| 671 | DUET WIN | 1 | 0 | 0 | 0 | read/access only |
| 672 | DUET PARTNER SELECTED | 7 | 3 | 2 | 0 | used |
| 673 | MAYHEM LOCK | 53 | 54 | 221 | 0 | used |
| 674 | NO ITEM INBATT | 0 | 8 | 10 | 1 | used |
| 675 | NO ITEM OUTBATT | 0 | 8 | 11 | 3 | used |
| 676 | ROOKIE | 31 | 7 | 10 | 2 | used |
| 677 | VETERAN | 28 | 7 | 10 | 5 | used |
| 678 | ACE | 18 | 7 | 10 | 14 | used |
| 679 | KANTO | 2 | 1 | 10 | 2 | used |
| 680 | JOHTO | 2 | 1 | 10 | 2 | used |
| 681 | HOENN | 2 | 1 | 10 | 2 | used |
| 682 | SINNOH | 2 | 1 | 10 | 2 | used |
| 683 | UNOVA | 2 | 1 | 10 | 2 | used |
| 684 | KALOS | 2 | 1 | 10 | 2 | used |
| 685 | ALOLA | 2 | 1 | 10 | 2 | used |
| 686 | FRONTIER | 2 | 1 | 10 | 2 | used |
| 687 | HISUI | 2 | 1 | 10 | 2 | used |
| 688 | GALAR | 2 | 1 | 10 | 2 | used |
| 689 | MASTER | 19 | 4 | 10 | 13 | used |
| 690 | DESPAIR | 12 | 1 | 3 | 4 | used |
| 691 | BACKSTAGE BATTLE | 6 | 1 | 2 | 0 | used |
| 692 | DUET | 1 | 1 | 10 | 1 | used |
| 693 | TITAN | 1 | 3 | 12 | 12 | used |
| 694 | SYGNA | 1 | 4 | 13 | 8 | used |
| 695 | OLD BGM (DON'T USE) | 2 | 0 | 2 | 0 | used |
| 696 | MAYHEM | 7 | 2 | 10 | 1 | used |
| 697 | GAUNTLET | 1 | 1 | 10 | 1 | used |
| 698 | CLUB | 1 | 1 | 10 | 1 | used |
| 699 | PRACTICE | 1 | 1 | 10 | 1 | used |
| 700 | ARCEUS | 2 | 1 | 4 | 1 | used |
| 701 | POKEMOD HYPNO RESCUE STARTED | 8 | 1 | 0 | 0 | used |
| 702 | POKEMOD HYPNO SUBDUED | 7 | 0 | 0 | 1 | used |
| 703 | POKEMOD CHILDREN RESCUED | 2 | 1 | 0 | 0 | used |
| 704 | POKEMOD HORIZONS OPEN | 1 | 2 | 0 | 0 | used |
| 705 | POKEMOD HORIZONS 500 COMPLETE | 1 | 0 | 0 | 0 | used |
| 706 | POKEMOD ATLAS MIL OPEN | 41 | 1 | 0 | 0 | used |
| 707 | POKEMOD ATLAS MIL 500 COMPLETE | 1 | 0 | 0 | 0 | used |
| 708 | POKEMOD ATLAS SEAL 01 BELL | 4 | 1 | 0 | 0 | used |
| 709 | POKEMOD ATLAS SEAL 02 | 4 | 1 | 0 | 0 | used |
| 710 | POKEMOD ATLAS SEAL 03 | 4 | 1 | 0 | 0 | used |
| 711 | POKEMOD ATLAS SEAL 04 | 4 | 1 | 0 | 0 | used |
| 712 | POKEMOD ATLAS SEAL 05 | 4 | 1 | 0 | 0 | used |
| 713 | POKEMOD ATLAS SEAL 06 | 4 | 1 | 0 | 0 | used |
| 714 | POKEMOD ATLAS SEAL 07 | 4 | 1 | 0 | 0 | used |
| 715 | POKEMOD ATLAS SEAL 08 | 4 | 1 | 0 | 0 | used |
| 716 | POKEMOD ATLAS SEAL 09 | 4 | 1 | 0 | 0 | used |
| 717 | POKEMOD ATLAS SEAL 10 | 4 | 1 | 0 | 0 | used |
| 718 | POKEMOD ATLAS SEAL 11 | 4 | 1 | 0 | 0 | used |
| 719 | POKEMOD ATLAS SEAL 12 | 4 | 1 | 0 | 0 | used |
| 720 | POKEMOD ATLAS SEAL 13 | 4 | 1 | 0 | 0 | used |
| 721 | POKEMOD ATLAS SEAL 14 | 4 | 1 | 0 | 0 | used |
| 722 | POKEMOD ATLAS SEAL 15 | 4 | 1 | 0 | 0 | used |
| 723 | POKEMOD ATLAS SEAL 16 | 4 | 1 | 0 | 0 | used |
| 724 | POKEMOD ATLAS SEAL 17 | 4 | 1 | 0 | 0 | used |
| 725 | POKEMOD ATLAS SEAL 18 | 4 | 1 | 0 | 0 | used |
| 726 | POKEMOD ATLAS SEAL 19 | 4 | 1 | 0 | 0 | used |
| 727 | POKEMOD ATLAS SEAL 20 | 4 | 1 | 0 | 0 | used |
| 728 | POKEMOD ATLAS SEAL 21 | 4 | 1 | 0 | 0 | used |
| 729 | POKEMOD ATLAS SEAL 22 | 4 | 1 | 0 | 0 | used |
| 730 | POKEMOD ATLAS SEAL 23 | 4 | 1 | 0 | 0 | used |
| 731 | POKEMOD ATLAS SEAL 24 | 4 | 1 | 0 | 0 | used |
| 732 | POKEMOD ATLAS SEAL 25 | 4 | 1 | 0 | 0 | used |
| 733 | POKEMOD ATLAS SEAL 26 | 4 | 1 | 0 | 0 | used |
| 734 | POKEMOD ATLAS SEAL 27 | 4 | 1 | 0 | 0 | used |
| 735 | POKEMOD ATLAS SEAL 28 | 4 | 1 | 0 | 0 | used |
| 736 | POKEMOD ATLAS SEAL 29 | 4 | 1 | 0 | 0 | used |
| 737 | POKEMOD ATLAS SEAL 30 | 4 | 1 | 0 | 0 | used |

## Variables 1–133

| ID | Nombre | Lecturas | Escrituras | Script | Estado |
|---:|---|---:|---:|---:|---|
| 1 | Temp Pokemon Choice | 3776 | 85 | 4 | used |
| 2 | Temp Move Choice | 78 | 36 | 2 | used |
| 3 | Temp Pokemon Name | 33 | 20 | 0 | used |
| 4 | Temp Move Name | 75 | 4 | 38 | used |
| 5 | Temp Text Entry | 65 | 29 | 2 | used |
| 6 | Poké Center healing ball count | 1344 | 225 | 0 | used |
| 7 | Starter choice | 10 | 4 | 0 | used |
| 8 | Apricorn being converted | 3 | 2 | 0 | used |
| 9 | Fossil being revived | 3 | 2 | 0 | used |
| 10 | Elevator current floor | 26 | 43 | 0 | used |
| 11 | Elevator new floor | 20 | 2 | 0 | used |
| 12 | Rival name | 0 | 0 | 0 | no literal use |
| 13 | E4 defeated count | 0 | 1 | 0 | write only/static |
| 14 | -----RESERVED----- | 1 | 0 | 0 | read/access only |
| 15 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 16 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 17 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 18 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 19 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 20 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 21 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 22 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 23 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 24 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 25 | -----RESERVED----- | 0 | 0 | 0 | no literal use |
| 26 | Fortree Ladder Direction | 5 | 8 | 0 | used |
| 27 | Indigo Rematch | 20 | 10 | 0 | used |
| 28 | Silver Conf. Rematch | 23 | 7 | 0 | used |
| 29 | Ever Grande Rematch | 26 | 14 | 0 | used |
| 30 | Lily Rematch | 27 | 9 | 0 | used |
| 31 | Vetress Rematch | 29 | 10 | 0 | used |
| 32 | Lumiose Rematch | 29 | 9 | 0 | used |
| 33 | Manalo Rematch | 93 | 44 | 0 | used |
| 34 | Masters 8 Rematch | 7 | 4 | 0 | used |
| 35 | PWC Rand Var | 0 | 0 | 1 | read/access only |
| 36 | PWC Progress | 17 | 1 | 1 | used |
| 37 | PWC Trainers | 0 | 0 | 0 | no literal use |
| 38 | — | 0 | 0 | 0 | no literal use |
| 39 | — | 0 | 0 | 0 | no literal use |
| 40 | — | 0 | 0 | 0 | no literal use |
| 41 | — | 0 | 0 | 0 | no literal use |
| 42 | — | 0 | 0 | 0 | no literal use |
| 43 | — | 0 | 0 | 0 | no literal use |
| 44 | — | 0 | 0 | 0 | no literal use |
| 45 | — | 0 | 0 | 0 | no literal use |
| 46 | — | 0 | 0 | 0 | no literal use |
| 47 | HISUI ACH | 2 | 2 | 0 | used |
| 48 | GALAR ACH | 2 | 2 | 0 | used |
| 49 | ACTIVE ENEMY BUFFS | 0 | 0 | 0 | no literal use |
| 50 | SYNC ENEMY BUFFS | 0 | 0 | 0 | no literal use |
| 51 | follower_iterator | 54 | 108 | 0 | used |
| 52 | follower_count | 54 | 1 | 0 | used |
| 53 | CLUB TEAM | 0 | 2 | 0 | write only/static |
| 54 | TRAINER BAG | 0 | 0 | 0 | no literal use |
| 55 | TRAINER OUTFIT | 0 | 0 | 0 | no literal use |
| 56 | DUET BATTLE TRIGGER | 1 | 421 | 0 | used |
| 57 | SYGNA BUFF ENERGY | 0 | 0 | 0 | no literal use |
| 58 | SYGNA UNLOCKED BUFFS | 0 | 0 | 0 | no literal use |
| 59 | SYGNA ACTIVE BUFFS | 0 | 0 | 0 | no literal use |
| 60 | SYGNA TRAINERS | 0 | 0 | 0 | no literal use |
| 61 | SYGNA CREDITS | 6 | 15 | 0 | used |
| 62 | SYGNA SHOP BUFFS | 0 | 0 | 0 | no literal use |
| 63 | DUET TEXT | 0 | 0 | 0 | no literal use |
| 64 | DUET OPTIONS | 0 | 0 | 0 | no literal use |
| 65 | DUET PARTNER | 0 | 0 | 0 | no literal use |
| 66 | DUET TRAINER 2 | 218 | 8 | 0 | used |
| 67 | MAX TRAINERS IN CHALLENGE | 0 | 0 | 0 | no literal use |
| 68 | MAYHEM BEATEN | 0 | 0 | 0 | no literal use |
| 69 | MAYHEM JOY | 30 | 1 | 0 | used |
| 70 | MAYHEM ROOM | 26 | 130 | 0 | used |
| 71 | MAYHEM NUM | 0 | 0 | 0 | no literal use |
| 72 | MAYHEM KEY | 6 | 20 | 0 | used |
| 73 | MAYHEM ENTRANCE | 7 | 1 | 0 | used |
| 74 | GAUNTLET LVL | 0 | 0 | 0 | no literal use |
| 75 | VEND CHOICE | 23 | 0 | 0 | read/access only |
| 76 | GAUNTLET MOD | 2 | 2 | 0 | used |
| 77 | LOUNGE BGM | 18 | 0 | 0 | read/access only |
| 78 | GAUNTLET HOF COUNT | 0 | 1 | 3 | used |
| 79 | RAND POOL | 0 | 0 | 0 | no literal use |
| 80 | GC CREDIT | 13 | 30 | 0 | used |
| 81 | GAUNTLET WINCOUNT | 15 | 5 | 2 | used |
| 82 | UNLOCK FLR | 4 | 2 | 0 | used |
| 83 | FRONTIER ACH | 2 | 2 | 0 | used |
| 84 | ALOLA ACH | 2 | 2 | 0 | used |
| 85 | KALOS ACH | 2 | 2 | 0 | used |
| 86 | UNOVA ACH | 2 | 2 | 0 | used |
| 87 | SINNOH ACH | 2 | 2 | 0 | used |
| 88 | HOENN ACH | 2 | 2 | 0 | used |
| 89 | JOHTO ACH | 2 | 2 | 0 | used |
| 90 | KANTO ACH | 2 | 2 | 0 | used |
| 91 | PRAC LVL | 5 | 3 | 0 | used |
| 92 | CLUB LVL | 7 | 4 | 0 | used |
| 93 | GAUNTLET HIGH COUNT | 1 | 3 | 0 | used |
| 94 | MAYHEM LVL | 6 | 3 | 0 | used |
| 95 | SYGNA LVL | 11 | 5 | 0 | used |
| 96 | TITAN LVL | 5 | 4 | 0 | used |
| 97 | DUET LVL | 5 | 4 | 0 | used |
| 98 | REGION | 115 | 17 | 0 | used |
| 99 | TRAINER NUM | 105 | 618 | 0 | used |
| 100 | RANDOMIZER | 1342 | 17 | 0 | used |
| 101 | POKEMOD HORIZONS COMPLETED | 0 | 500 | 1000 | used |
| 102 | POKEMOD ATLAS MIL COMPLETED | 0 | 500 | 1000 | used |
| 103 | POKEMOD ATLAS NARRATIVE SEALS | 0 | 30 | 0 | write only/static |
| 104 | POKEMOD ATLAS DECISION 01 | 0 | 2 | 0 | write only/static |
| 105 | POKEMOD ATLAS DECISION 02 | 0 | 2 | 0 | write only/static |
| 106 | POKEMOD ATLAS DECISION 03 | 0 | 2 | 0 | write only/static |
| 107 | POKEMOD ATLAS DECISION 04 | 0 | 2 | 0 | write only/static |
| 108 | POKEMOD ATLAS DECISION 05 | 0 | 2 | 0 | write only/static |
| 109 | POKEMOD ATLAS DECISION 06 | 0 | 2 | 0 | write only/static |
| 110 | POKEMOD ATLAS DECISION 07 | 0 | 2 | 0 | write only/static |
| 111 | POKEMOD ATLAS DECISION 08 | 0 | 2 | 0 | write only/static |
| 112 | POKEMOD ATLAS DECISION 09 | 0 | 2 | 0 | write only/static |
| 113 | POKEMOD ATLAS DECISION 10 | 0 | 2 | 0 | write only/static |
| 114 | POKEMOD ATLAS DECISION 11 | 0 | 2 | 0 | write only/static |
| 115 | POKEMOD ATLAS DECISION 12 | 0 | 2 | 0 | write only/static |
| 116 | POKEMOD ATLAS DECISION 13 | 0 | 2 | 0 | write only/static |
| 117 | POKEMOD ATLAS DECISION 14 | 0 | 2 | 0 | write only/static |
| 118 | POKEMOD ATLAS DECISION 15 | 0 | 2 | 0 | write only/static |
| 119 | POKEMOD ATLAS DECISION 16 | 0 | 2 | 0 | write only/static |
| 120 | POKEMOD ATLAS DECISION 17 | 0 | 2 | 0 | write only/static |
| 121 | POKEMOD ATLAS DECISION 18 | 0 | 2 | 0 | write only/static |
| 122 | POKEMOD ATLAS DECISION 19 | 0 | 2 | 0 | write only/static |
| 123 | POKEMOD ATLAS DECISION 20 | 0 | 2 | 0 | write only/static |
| 124 | POKEMOD ATLAS DECISION 21 | 0 | 2 | 0 | write only/static |
| 125 | POKEMOD ATLAS DECISION 22 | 0 | 2 | 0 | write only/static |
| 126 | POKEMOD ATLAS DECISION 23 | 0 | 2 | 0 | write only/static |
| 127 | POKEMOD ATLAS DECISION 24 | 0 | 2 | 0 | write only/static |
| 128 | POKEMOD ATLAS DECISION 25 | 0 | 2 | 0 | write only/static |
| 129 | POKEMOD ATLAS DECISION 26 | 0 | 2 | 0 | write only/static |
| 130 | POKEMOD ATLAS DECISION 27 | 0 | 2 | 0 | write only/static |
| 131 | POKEMOD ATLAS DECISION 28 | 0 | 2 | 0 | write only/static |
| 132 | POKEMOD ATLAS DECISION 29 | 0 | 2 | 0 | write only/static |
| 133 | POKEMOD ATLAS DECISION 30 | 0 | 2 | 0 | write only/static |

## Switches críticos revisados

- **429 – Postgame:** conserva el acceso postgame del contenido aditivo.
- **674 – NO ITEM INBATT:** los eventos originales pueden seguir activándolo, pero `pbItemMenu` ya no lo consulta en combates internos.
- **675 – NO ITEM OUTBATT:** no fue modificado.
- **701–707:** misión de Hypno, Horizontes y Atlas Mil.
- **708–737:** 30 sellos narrativos Tier 1 aprobados, verificados sin colisión.
- **Variables 101–103:** contadores separados de Horizontes, Atlas Mil y sellos narrativos.
- **Variables 104–133:** decisiones persistentes de los 30 episodios Tier 1.

## Indicadores que requieren cautela

- Switches con nombre sin uso literal: 14.
- Switches usados sin nombre: 1.
- Switches con escritura estática sin lectura literal: 10.
- Switches con lectura/acceso sin escritura estática: 19.

El detalle de ubicaciones (hasta 30 por ID), self-switches y expresiones dinámicas está en:

`pokemon_fire_ash/PokeModBackups/auditoria_flags_total.json`
