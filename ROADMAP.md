# Fahrplan: Fehler, Risiken und Altlasten

Ergebnis der initialen Projektanalyse (Oktober 2026), abgeglichen mit dem Stand nach #90 und #91. Jeder Schritt ist als eigener kleiner PR gedacht.
Die Reihenfolge berücksichtigt Abhängigkeiten: erst Grundlage und Aufräumen, dann Bugs, dann Typsicherheit, Build und Modernisierung.

Ausgangslage: [#91](https://github.com/mwawrowsky/memo/pull/91) (grüne Unit-Tests) ist gemergt, jeder weitere Schritt ist also durch Tests abgesichert.
Mehrere Punkte hatte [#90](https://github.com/mwawrowsky/memo/pull/90) bereits erledigt; sie sind unten abgehakt.

Legende: **S** = klein (< 30 min), **M** = mittel, **L** = groß · ⚖️ = vorher Entscheidung nötig

---

## Phase 0: Grundlage

- [x] **0.1 `package-lock.json` versionieren** (S)
  - Eintrag `/package-lock.json` aus `.gitignore` entfernen, Lockfile committen.
  - Warum: Builds sind ohne Lockfile nicht reproduzierbar.
  - Fertig, wenn: `npm ci` auf einem frischen Checkout funktioniert.
- [ ] **0.2 Patch-Updates und `npm audit fix`** (S)
  - Angular 21.2.4 → 21.2.x (neueste), NgRx 21.0 → 21.1, typescript-eslint Patch-Updates.
  - Fertig, wenn: `npm audit` keine hohen Schwachstellen mehr meldet und Build, Lint und Tests grün sind.
- [x] **0.3 CI-Workflow (GitHub Actions)** (S)
  - `npm ci`, `ng lint`, `ng build`, `ng test --watch=false --browsers=ChromeHeadless` bei jedem PR.
  - Warum: Jeder folgende Schritt wird automatisch geprüft.

- [ ] **0.4 `ng serve` reparieren** (S) 🔥 dringend
  - Seit #90 bricht `npm start` mit „Configuration 'development' for target 'serve' … is not set“ ab: `serve` verweist auf `memo:build:development`, unter `build.configurations` gibt es aber nur `production`.
  - Lösung: Eine Konfiguration `development` unter `build` ergänzen (`optimization: false`, `sourceMap: true`, `extractLicenses: false`) und sie unter `serve.configurations` eintragen.
  - Fertig, wenn: `npm start` die App unter `localhost:4200` ausliefert.

## Phase 1: Aufräumen von Altlasten

- [ ] **1.1 Protractor-Reste entfernen** (S)
  - Ordner `e2e/` löschen, devDependencies `jasmine-spec-reporter` und `ts-node` entfernen.
  - Warum: Protractor wurde in `714a801` entfernt, die Dateien sind liegen geblieben.
- [x] **1.2 Ungenutzte Abhängigkeiten entfernen** (S), erledigt in #90
  - `@angular/animations` und `@angular/forms` wurden entfernt. `@angular/forms` kommt wieder dazu, sobald Reactive Forms (README-Ziel) umgesetzt werden.
- [ ] **1.3 Coverage-Reporter ersetzen** (S)
  - `karma-coverage-istanbul-reporter` (veraltet, nicht einmal unter `reporters` eingetragen) durch `karma-coverage` ersetzen und in `karma.conf.js` aktivieren.
  - Entfällt, falls 7.2 (Vitest) vorgezogen wird.
- [ ] **1.4 Veraltete Kommentare und Konfiguration bereinigen** (S)
  - Kommentare zu Zone.js und `--prod` in `src/environments/environment.ts` sowie den Kommentar in `src/test.ts`.
  - `.browserslistrc` löschen, damit Angulars Standard-Browserliste gilt (beseitigt die Build-Warnungen).
  - Tippfehler „threreafter“ im README korrigieren.

## Phase 2: Fehler in der Spiellogik

Alle betreffen `src/app/teaching-phase/teaching-phase.component.ts`.

- [x] **2.1 Intervall beim Verlassen der Seite stoppen** (S), erledigt in #90
  - `ngOnDestroy` ruft `stopTrainingTimer()` auf.
  - Offen: ein Test dafür (Komponente zerstören, Uhr weiterlaufen lassen, dabei darf kein Fehler auftreten). Wird in 2.2 mitgemacht.
- [ ] **2.2 Restlichen toten Code entfernen** (S)
  - Erledigt in #90: `time`-Observable, `hitCount`, `iconClass`, `colorClass`.
  - Offen: `getTrainedIconName`/`getTrainedColorName` durch `usedIcons[idx]`/`usedColors[idx]` im Template ersetzen und den Test für 2.1 ergänzen.
- [ ] **2.3 `restart()` und die Action `reset` klären** (S) ⚖️
  - Das Zurücksetzen in `restart()` ist wirkungslos, weil die Komponente direkt danach zerstört wird (nur das Stoppen des Timers ist sinnvoll), und `reset` wird nirgends ausgelöst.
  - Option A: Zurücksetzen und `reset` entfernen. Option B: Einen Button „Statistik zurücksetzen“ anbieten, der `reset` auslöst.
- [ ] **2.4 Kein verschachteltes `detectChanges()` in `ngOnInit`** (S)
  - `startTraining()` ruft über `teachNext()` noch während der ersten Change Detection `cdr.detectChanges()` auf. Das ist in den Tests aufgefallen.
  - Erledigt sich weitgehend mit 5.1 (Signals). Falls 5.1 später kommt: `markForCheck()` statt `detectChanges()` verwenden.

## Phase 3: Typsicherheit

- [x] **3.1 `strict: true` aktivieren** (M), erledigt in #90
  - `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates`; `lib` steht auf `es2022`.
  - Offen (klein): `fullTemplateTypeCheck` ist neben `strictTemplates` überflüssig und kann entfallen. Wird in 1.4 mitgemacht.

## Phase 4: Build

- [x] **4.1 Auf den `application`-Builder (esbuild) migrieren** (M), erledigt in #90
  - Offen: `@angular-devkit/build-angular` durch `@angular/build` ersetzen, sobald Karma nicht mehr gebraucht wird (siehe 7.2).
- [x] **4.2 Produktions-Build als Standard** (S), erledigt in #90
  - Dabei ist der Dev-Server kaputtgegangen, siehe 0.4.

## Phase 5: Modernisierung des Codes

- [ ] **5.1 Teaching-Phase auf Signals umstellen** (M)
  - Spielzustand als `signal`/`computed`, Store-Werte über `store.selectSignal()` statt `AsyncPipe`.
  - Ersetzt `ChangeDetectorRef` und alle manuellen `detectChanges()`-Aufrufe.
  - Den Test-Helper `render()` brauchen die Specs danach nicht mehr.
- [ ] **5.2 Spiellogik in einen Service auslagern** (M, optional)
  - Zufallsauswahl, Rundenverwaltung und Auswertung landen in einem `GameService`, die Komponente kümmert sich nur noch um die Anzeige.
  - Erleichtert Tests und passt zum README-Ziel „DI“.

## Phase 6: Bedienung und Barrierefreiheit

- [ ] **6.1 Bessere Eingabe beim Raten** (M)
  - Verhindern, dass dasselbe Icon oder dieselbe Farbe doppelt gewählt wird (Button nach der Auswahl deaktivieren).
  - Fortschritt anzeigen („2 / 3 gewählt“) und die letzte Auswahl rückgängig machen können.
- [ ] **6.2 Barrierefreiheit** (S)
  - `aria-label` für alle Icon- und Farb-Buttons.
  - Farbnamen als Text oder Tooltip anzeigen, damit die Farbauswahl auch ohne Farbwahrnehmung funktioniert.

## Phase 7: Größere Umbauten

- [ ] **7.1 Semantic UI ablösen** (L) ⚖️
  - Semantic UI wird nicht mehr gepflegt und liegt als 470 kB großes minifiziertes CSS samt Fonts im Repo.
  - Ziel laut README: Angular Material. Die Icons brauchen dann ein Ersatz-Set (z. B. Material Symbols).
- [ ] **7.2 Karma durch Vitest ersetzen** (M) ⚖️
  - Karma ist veraltet, Angular 21 bringt Vitest-Unterstützung mit (`@angular/build:unit-test`).
  - Setzt 4.1 voraus. Danach kann `@angular-devkit/build-angular` ganz entfallen.

---

## Offene Entscheidungen (⚖️)

| Schritt | Frage |
|---|---|
| 2.3 | Action `reset` entfernen oder als „Statistik zurücksetzen“ nutzen? |
| 7.1 | Angular Material einführen oder bei Semantic UI (bzw. Fomantic UI) bleiben? |
| 7.2 | Auf Vitest umsteigen oder bei Karma bleiben? |
