# Teqball Teamgenerator

Eine mobile Web-App zum Verwalten von Teqball-Spieltagen in der Freundesgruppe — mit automatischer Teamauslosung, Spielplan, Livetabelle, Mehrrunden-Support und Langzeitstatistiken.

🌐 **Live:** https://ff2710.github.io/teqball-app/

---

## So funktioniert ein Spieltag

### 1. Datenbank importieren (Home-Tab)
- Die aktuellste `.json`-Datei aus dem Gruppen-Chat laden (ggf. zuerst aus der Cloud herunterladen)
- Auf **Importieren** drücken — die Kachel zeigt danach Dateiname und Datum des letzten Imports
- Ohne Import startet man mit einer leeren Datenbank — bisherige Langzeitstatistiken werden nicht berücksichtigt

### 2. Spieltag starten
- Auf **Spieltag starten** drücken
- Falls keine Datenbank geladen: kurze Warnung mit Option zum Importieren oder Weiterfahren ohne DB
- → Weiterleitung zum Tab **Spieltag**

### 3. Spieler hinzufügen
- Wer schon mal gespielt hat, erscheint als Chip — **diesen antippen** statt neu eintippen! Nur so werden die Langzeitstatistiken korrekt zugeordnet.
- Spieler können per **×** wieder entfernt werden

### 4. Teams generieren
- Klick auf **Teams generieren** → Spieler werden in 2er-Teams aufgeteilt
- Ab der zweiten Runde werden bereits gespielte Paarungen dieses Spieltags automatisch vermieden
- Bei **ungerader Spielerzahl** bekommt ein Spieler ein Allein-Team (mit automatischer Aushilfe im Spielplan)
- Solange noch kein Spielplan erstellt wurde, kann jederzeit neu generiert werden
- Wenn bereits ein aktiver Spielplan läuft: **Bestätigungsdialog** zum Zurücksetzen

### 5. Spielplan generieren
- Klick auf **Spielplan generieren** → jedes Team spielt gegen jedes andere genau einmal
- Die Reihenfolge ist so optimiert, dass kein Team zweimal hintereinander spielt
- Wenn bereits ein aktiver Spielplan läuft: **Bestätigungsdialog** zum Zurücksetzen

#### Aushilfe-Regel (bei Einzel-Team)
Wenn ein Allein-Spieler spielt, springt automatisch ein zufälliger Spieler aus einem pausierenden Team als Aushilfe ein. Dieser wechselt bei jedem Spiel.

### 6. Ergebnisse eintragen
- Unter jedem Spiel gibt es zwei Zahlenfelder für das Ergebnis
- Die **Livetabelle** aktualisiert sich sofort

### 7. Runde beenden
- Klick auf **Runde beenden** → die Runde wird intern gespeichert (noch nicht in der Datenbank!)
- Die Livetabelle zeigt immer nur die aktuelle Runde

### 8. Neue Runde oder Spieltag beenden
Nach jeder Runde erscheinen drei Optionen:

- **Gleiche Teams** → selbe Spielerpaare, neuer zufälliger Spielplan, zurückgesetzte Livetabelle
- **Neu mischen** → gleiche Spieler (vorauswählbar/änderbar), neue zufällige Teams — bereits gespielte Paarungen dieses Spieltags werden dabei vermieden. Wenn alle möglichen Paarungen erschöpft sind, wird automatisch zurückgesetzt.
- **Spieltag beenden** → Bestätigungsdialog, danach werden alle Runden in der Datenbank gespeichert → Weiterleitung zu **Statistiken**

### 9. Exportieren
- Im Tab **Statistiken** auf **Exportieren** → lädt eine `.json`-Datei mit Datum und Uhrzeit im Namen (z. B. `teqball_2026-04-17_2130.json`)
- Datei in die Gruppe schicken, damit alle den gleichen Stand haben

---

## Statistiken

Im Tab **Statistiken** werden alle gespeicherten Spieltage ausgewertet:

| Spalte | Bedeutung |
|--------|-----------|
| ST | Anzahl Spieltage |
| Sp | Anzahl Einzelspiele |
| S | Siege |
| N | Niederlagen |
| Quote | Siegquote in % |
| Diff | Punktedifferenz gesamt |

Die Tabelle ist nach Siegquote sortiert.

---

## Datenbank (Export / Import)

- **Importieren**: auf der Home-Seite oder im Tab „Statistiken"
- **Exportieren**: im Tab „Statistiken"; Dateiname enthält automatisch Datum + Uhrzeit

> **Tipp:** Nach jedem Spieltag exportieren und die Datei in die Gruppe schicken, damit alle den gleichen Stand haben.

---

## Hinweise

- Die App funktioniert komplett **ohne Internet** (nach dem ersten Laden)
- Daten werden lokal im Browser gespeichert — beim Löschen des Browser-Caches gehen sie verloren → **Exportieren nicht vergessen!**
- Optimiert für **Mobilgeräte**
