# Club Friday Strength Ranking

Statyczna aplikacja pod GitHub Pages do pokazywania rankingu siłowego zawodników.

## Co jest w środku

- `index.html` — layout aplikacji
- `styles.css` — wygląd UI
- `config.js` — parametry systemu punktacji
- `athletes.js` — zawodnicy do rankingu
- `app.js` — logika obliczeń, ranking, eksport CSV, drawer, generator zawodnika
- `assets/athletes/` — wrzucasz tu zdjęcia zawodników

## Jak edytować zawodników

1. Otwórz `athletes.js`
2. Skopiuj blok istniejącego zawodnika
3. Wklej nowy blok
4. Zmień:
   - `id`
   - `name`
   - `photo`
   - `bodyweight_kg`
   - wszystkie 8 wyników
5. Dodaj nową stałą także do `window.ATHLETES = [...]`

## Jak dodać zdjęcie

1. Wrzuć plik np. `michal.jpg` do `assets/athletes/`
2. W rekordzie ustaw:

```js
photo: "assets/athletes/michal.jpg"
```

## Jak zmienić system liczenia

Edytuj `config.js`.

Najważniejsze pola:

- `allometric_exponent`
- `readability_scale`
- `rounding_precision`
- `multipliers`
- `warnings`

## Generator zawodnika

Na stronie jest sekcja **Generator zawodnika**.

Wpisujesz dane → aplikacja liczy preview → kopiujesz gotowy blok JS → wklejasz do `athletes.js`.

## Uwaga metodologiczna

Do overall liczą się tylko zawodnicy z kompletem 8 wyników > 0.
Braki są oznaczane jako `Incomplete`.
