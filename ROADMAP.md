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
- [x] **0.2 Patch-Updates und `npm audit fix`** (S)
  - Angular 21.2.4 → 21.2.25, NgRx 21.0.1 → 21.1.1, typescript-eslint 8.71, ESLint 9.39.5; die Mindestversionen in der `package.json` sind angehoben.
  - Behoben: alle Schwachstellen in Produktionsabhängigkeiten (u. a. XSS in `@angular/compiler`, DoS in `@angular/common`); `npm audit --omit=dev` meldet 0.
  - Offen: 13 Funde in Dev-Tooling (`braces`/`chokidar` über Karma und `webpack-dev-server`, `uuid` über `sockjs`). Dafür gab es keinen nicht-brechenden Fix; sie sind mit 7.2 entfallen (`npm audit`: 0).
- [x] **0.3 CI-Workflow (GitHub Actions)** (S)
  - `npm ci`, `ng lint`, `ng test --watch=false`, `ng build` bei jedem PR (seit 7.2 mit Vitest statt ChromeHeadless).
  - Warum: Jeder folgende Schritt wird automatisch geprüft.

- [x] **0.4 `ng serve` reparieren** (S), erledigt in #93
  - Seit #90 bricht `npm start` mit „Configuration 'development' for target 'serve' … is not set“ ab: `serve` verweist auf `memo:build:development`, unter `build.configurations` gibt es aber nur `production`.
  - Lösung: Eine Konfiguration `development` unter `build` ergänzen (`optimization: false`, `sourceMap: true`, `extractLicenses: false`) und sie unter `serve.configurations` eintragen.
  - Fertig, wenn: `npm start` die App unter `localhost:4200` ausliefert.

## Phase 1: Aufräumen von Altlasten

- [x] **1.1 Protractor-Reste entfernen** (S)
  - Ordner `e2e/` löschen, devDependencies `jasmine-spec-reporter` und `ts-node` entfernen.
  - Warum: Protractor wurde in `714a801` entfernt, die Dateien sind liegen geblieben.
- [x] **1.2 Ungenutzte Abhängigkeiten entfernen** (S), erledigt in #90
  - `@angular/animations` und `@angular/forms` wurden entfernt. `@angular/forms` kommt wieder dazu, sobald Reactive Forms (README-Ziel) umgesetzt werden.
- [x] **1.3 Coverage-Reporter ersetzen** (S)
  - `karma-coverage-istanbul-reporter` (veraltet, nicht einmal unter `reporters` eingetragen) durch `karma-coverage` ersetzen und in `karma.conf.js` aktivieren.
  - Seit 7.2 übernimmt Vitest (`@vitest/coverage-v8`) die Coverage: `ng test --watch=false --coverage`.
  - Aufruf: `ng test --code-coverage`, Bericht unter `coverage/memo/` (HTML, lcov, Zusammenfassung). Stand: 100 % Statements, Branches, Functions und Lines.
- [x] **1.4 Veraltete Kommentare und Konfiguration bereinigen** (S)
  - Kommentare zu Zone.js und `--prod` in `src/environments/environment.ts` sowie den Kommentar in `src/test.ts`.
  - `.browserslistrc` löschen, damit Angulars Standard-Browserliste gilt (beseitigt die Build-Warnungen).
  - Tippfehler „threreafter“ im README korrigieren.
  - `fullTemplateTypeCheck` aus `tsconfig.json` entfernen (überflüssig neben `strictTemplates`).

## Phase 2: Fehler in der Spiellogik

Alle betreffen `src/app/teaching-phase/teaching-phase.component.ts`.

- [x] **2.1 Intervall beim Verlassen der Seite stoppen** (S), erledigt in #90
  - `ngOnDestroy` ruft `stopTrainingTimer()` auf.
  - Der Test dafür (Komponente zerstören, Uhr weiterlaufen lassen) kam mit 2.2 dazu.
- [x] **2.2 Restlichen toten Code entfernen** (S)
  - Erledigt in #90: `time`-Observable, `hitCount`, `iconClass`, `colorClass`.
  - `getTrainedIconName`/`getTrainedColorName` sind entfernt; das Template nutzt die `@for`-Variable und `usedColors[idx]`. Den Test für 2.1 gibt es jetzt.
- [x] **2.3 `restart()` und die Action `reset` klären** (S)
  - `restart()` stoppt nur noch den Timer und navigiert nach Hause; das wirkungslose Zurücksetzen des Zustands ist entfernt.
  - Entscheidung: Option B. In der Ergebnisansicht löst der Button „Reset statistics“ die Action `reset` aus.
- [x] **2.4 Kein verschachteltes `detectChanges()` in `ngOnInit`** (S)
  - `teachNext()` ruft jetzt `markForCheck()` statt `detectChanges()` auf; der zoneless Scheduler rendert danach selbst.
  - Ein Test prüft, dass die Anzeige nach dem Timer-Tick ohne manuelles `detectChanges()` aktualisiert wird. Mit 5.1 (Signals) entfällt auch `markForCheck()`.

## Phase 3: Typsicherheit

- [x] **3.1 `strict: true` aktivieren** (M), erledigt in #90
  - `strict`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noImplicitReturns`, `strictTemplates`; `lib` steht auf `es2022`.
  - Offen (klein): `fullTemplateTypeCheck` ist neben `strictTemplates` überflüssig und kann entfallen. Wird in 1.4 mitgemacht.

## Phase 4: Build

- [x] **4.1 Auf den `application`-Builder (esbuild) migrieren** (M), erledigt in #90
  - `@angular-devkit/build-angular` ist mit 7.2 durch `@angular/build` ersetzt.
- [x] **4.2 Produktions-Build als Standard** (S), erledigt in #90
  - Dabei ist der Dev-Server kaputtgegangen, siehe 0.4.

## Phase 5: Modernisierung des Codes

- [x] **5.1 Teaching-Phase auf Signals umstellen** (M)
  - Spielzustand als `signal`, abgeleitete Werte (`roundsCount`, `displayIcon`/`displayColor`, verfügbare Icons und Farben, `solution`) als `computed`.
  - Store-Werte über `store.selectSignal()` statt `AsyncPipe`; `ChangeDetectorRef` und `markForCheck()` sind entfernt, der Timer wird über `DestroyRef` gestoppt.
  - Der Test-Helper `render()` ist entfernt.
- [x] **5.2 Spiellogik in einen Service auslagern** (M, optional)
  - `src/app/game/`: `GameService` (Rundenverwaltung, Timer, Zufallsauswahl, Auswertung, Meldung an den Store) und `game.model.ts` (Icons, Farben, Spielzustand).
  - Der Service wird pro Komponente bereitgestellt (`providers: [GameService]`): jedes Spiel startet mit frischem Zustand, der Timer endet mit der Komponente. Nach außen gibt er nur lesbare Signals heraus.
  - Die Komponente kümmert sich nur noch um Anzeige, Navigation und Statistik; die Spiellogik hat eine eigene Spec.

## Phase 6: Bedienung und Barrierefreiheit

- [x] **6.1 Bessere Eingabe beim Raten** (M)
  - Gewählte Icons und Farben sind deaktiviert; der `GameService` ignoriert doppelte Auswahl sowie Eingaben außerhalb der passenden Testphase.
  - Fortschritt („2 of 3 selected“) und die bisher gewählte Reihenfolge werden angezeigt; in der Farbphase bekommen die Icons ihre gewählte Farbe.
  - „Undo“ nimmt die letzte Auswahl zurück. Ohne gewählte Farbe führt es von der Farb- zurück in die Icon-Phase.
- [x] **6.2 Barrierefreiheit** (S)
  - Icon-Buttons haben `aria-label` und Tooltip, Farb-Buttons ein `aria-label` mit dem Farbnamen.
  - Entscheidung: Farbnamen werden **nicht sichtbar** angezeigt (weder als Text noch als Tooltip). Der Lerneffekt beruht auf der sensorischen Wahrnehmung der Farben; sichtbare Namen würden ihn unterlaufen. Screenreader bekommen die Namen weiterhin.
  - Reine Anzeigen (Lernphase, Vorschau, Ergebnis-Symbol, Lösung) sind keine Buttons mehr, sondern `role="img"` mit Beschreibung („Bell on Red“); Icon-Glyphen sind `aria-hidden`, die Lösung ist eine geordnete Liste.
  - Lernphase und Fortschritt werden über `aria-live` angesagt; der Hinweistext nennt die laufende Testphase (Icons oder Farben).

## Phase 7: Größere Umbauten

- [ ] **7.1 Semantic UI ablösen** (L) ⚖️
  - Semantic UI wird nicht mehr gepflegt und liegt als 470 kB großes minifiziertes CSS samt Fonts im Repo.
  - Ziel laut README: Angular Material. Die Icons brauchen dann ein Ersatz-Set (z. B. Material Symbols).
- [x] **7.2 Karma durch Vitest ersetzen** (M)
  - `ng test` läuft über `@angular/build:unit-test` mit Vitest in Node (jsdom), ohne Browser; Coverage über `@vitest/coverage-v8`.
  - Karma, Jasmine, `karma.conf.js`, `src/test.ts` und `@angular-devkit/build-angular` sind entfernt; alle Targets nutzen `@angular/build`.
  - Specs: `jasmine.clock` → `vi.useFakeTimers` (nur `setInterval`/`clearInterval`, damit der zoneless Scheduler weiterläuft), `spyOn` → `vi.spyOn` usw.
  - Die restlichen Audit-Funde aus 0.2 sind damit weg (`npm audit`: 0).

---

## Offene Entscheidungen (⚖️)

| Schritt | Frage |
|---|---|
| 7.1 | Angular Material einführen oder bei Semantic UI (bzw. Fomantic UI) bleiben? |
