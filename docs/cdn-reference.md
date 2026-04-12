# Brawlify CDN & API Reference

Base CDN host: `https://cdn.brawlify.com`
Base API host: `https://api.brawlify.com`

---

## CDN URL Patterns

### Brawlers

```
https://cdn.brawlify.com/brawlers/borderless/{id}.png
```

| Example ID | Brawler | Full URL |
|------------|---------|----------|
| `16000000` | Shelly | `https://cdn.brawlify.com/brawlers/borderless/16000000.png` |
| `16000001` | Colt | `https://cdn.brawlify.com/brawlers/borderless/16000001.png` |
| `16000002` | Bull | `https://cdn.brawlify.com/brawlers/borderless/16000002.png` |
| `16000006` | Spike | `https://cdn.brawlify.com/brawlers/borderless/16000006.png` |
| `16000015` | Leon | `https://cdn.brawlify.com/brawlers/borderless/16000015.png` |

---

### Maps

```
https://cdn.brawlify.com/maps/regular/{id}.png
```

| Example ID | Map | Full URL |
|------------|-----|----------|
| `15000001` | Gem Fort | `https://cdn.brawlify.com/maps/regular/15000001.png` |
| `15000006` | Backyard Bowl | `https://cdn.brawlify.com/maps/regular/15000006.png` |
| `15000010` | Sneaky Fields | `https://cdn.brawlify.com/maps/regular/15000010.png` |
| `15000219` | Hard Rock Mine | `https://cdn.brawlify.com/maps/regular/15000219.png` |

---

### Game Modes

```
https://cdn.brawlify.com/game-modes/regular/{id}.png
```

| Example ID | Game Mode | Full URL |
|------------|-----------|----------|
| `48000000` | Gem Grab | `https://cdn.brawlify.com/game-modes/regular/48000000.png` |
| `48000001` | Showdown | `https://cdn.brawlify.com/game-modes/regular/48000001.png` |
| `48000002` | Brawl Ball | `https://cdn.brawlify.com/game-modes/regular/48000002.png` |
| `48000003` | Bounty | `https://cdn.brawlify.com/game-modes/regular/48000003.png` |
| `48000004` | Heist | `https://cdn.brawlify.com/game-modes/regular/48000004.png` |

---

### Star Powers

```
https://cdn.brawlify.com/star-powers/borderless/{id}.png
```

| Example ID | Star Power | Full URL |
|------------|------------|----------|
| `23000076` | Shelly — Shell Shock | `https://cdn.brawlify.com/star-powers/borderless/23000076.png` |
| `23000138` | Colt — Slick Boots | `https://cdn.brawlify.com/star-powers/borderless/23000138.png` |
| `23000077` | Bull — Berserker | `https://cdn.brawlify.com/star-powers/borderless/23000077.png` |

---

### Gadgets

```
https://cdn.brawlify.com/gadgets/borderless/{id}.png
```

| Example ID | Gadget | Full URL |
|------------|--------|----------|
| `23000255` | Shelly — Fast Forward | `https://cdn.brawlify.com/gadgets/borderless/23000255.png` |
| `23000256` | Colt — Speedloader | `https://cdn.brawlify.com/gadgets/borderless/23000256.png` |
| `23000270` | Spike — Popping Pincushion | `https://cdn.brawlify.com/gadgets/borderless/23000270.png` |

---

### Gears

```
https://cdn.brawlify.com/gears/regular/{id}.png
```

| Example ID | Gear | Full URL |
|------------|------|----------|
| `29000000` | Health | `https://cdn.brawlify.com/gears/regular/29000000.png` |
| `29000001` | Damage | `https://cdn.brawlify.com/gears/regular/29000001.png` |
| `29000002` | Shield | `https://cdn.brawlify.com/gears/regular/29000002.png` |
| `29000003` | Speed | `https://cdn.brawlify.com/gears/regular/29000003.png` |

---

### Ranked Tiers

```
https://cdn.brawlify.com/ranked/tiered/{id}.png
```

| Example ID | Tier | Full URL |
|------------|------|----------|
| `1` | Bronze I | `https://cdn.brawlify.com/ranked/tiered/1.png` |
| `4` | Silver I | `https://cdn.brawlify.com/ranked/tiered/4.png` |
| `7` | Gold I | `https://cdn.brawlify.com/ranked/tiered/7.png` |
| `10` | Diamond I | `https://cdn.brawlify.com/ranked/tiered/10.png` |
| `13` | Mythic I | `https://cdn.brawlify.com/ranked/tiered/13.png` |
| `16` | Legendary I | `https://cdn.brawlify.com/ranked/tiered/16.png` |

---

## Brawlify API Endpoints

Base URL: `https://api.brawlify.com/v1`

All endpoints return JSON. No authentication required.

### GET /brawlers

Returns all brawlers with stats, star powers, gadgets, and gear data.

```
https://api.brawlify.com/v1/brawlers
```

Response shape:
```json
{
  "list": [
    {
      "id": 16000000,
      "name": "Shelly",
      "imageUrl": "https://cdn.brawlify.com/brawlers/borderless/16000000.png",
      "starPowers": [...],
      "gadgets": [...]
    }
  ]
}
```

### GET /maps

Returns all maps with associated game mode and environment data.

```
https://api.brawlify.com/v1/maps
```

Response shape:
```json
{
  "list": [
    {
      "id": 15000001,
      "name": "Gem Fort",
      "imageUrl": "https://cdn.brawlify.com/maps/regular/15000001.png",
      "gameMode": {
        "id": 48000000,
        "name": "Gem Grab"
      }
    }
  ]
}
```

### GET /gamemodes

Returns all game modes with icons and descriptions.

```
https://api.brawlify.com/v1/gamemodes
```

Response shape:
```json
{
  "list": [
    {
      "id": 48000000,
      "name": "Gem Grab",
      "imageUrl": "https://cdn.brawlify.com/game-modes/regular/48000000.png",
      "color": "#5654a2"
    }
  ]
}
```

---

## Notes

- All CDN assets are PNG images served over HTTPS.
- IDs used in the strategy schema (`mapId`, `brawlerId`) correspond directly to the numeric IDs returned by the API.
- The `gameMode` field in a strategy is stored as a slug string (e.g., `"gemGrab"`, `"brawlBall"`, `"showdown"`) rather than a numeric ID, for human readability.
- CDN images are publicly accessible with no authentication or rate limiting.
