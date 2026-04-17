# Teqball Teamgenerator

Eine mobile Web-App zum Verwalten von Teqball-Spieltagen in der Freundesgruppe — mit automatischer Teamauslosung, Spielplan, Livetabelle, Mehrrunden-Support und Langzeitstatistiken.

🌐 **Live:** https://ff2710.github.io/teqball-app/

---

## So funktioniert ein Spieltag

### 1. Datenbank importieren
- Ganz oben auf der Spieltag-Seite befindet sich die **Datenbank-Kachel**
- Auf **Importieren** drücken und die aktuellste `.json`-Datei aus dem Gruppen-Chat laden
- Die Kachel zeigt danach Dateiname und Importdatum an
- Ohne Import startet man mit einer leeren Datenbank — Langzeitstatistiken gehen verloren

### 2. Spieler hinzufügen
- Namen einzeln eintippen und auf **+** drücken (oder Enter)
- Wer schon mal gespielt hat, erscheint als Chip — **diesen antippen** statt neu eintippen! Nur so werden die Langzeitstatistiken korrekt zugeordnet.
- Spieler können per **×** wieder vom Spieltag entfernt werden

### 3. Teams generieren
- Klick auf **Teams generieren** → die Spieler werden zufällig in 2er-Teams aufgeteilt
- Bei **ungerader Spielerzahl** bekommt ein Spieler ein Allein-Team (gekennzeichnet mit „Einzel")
- Jedes Team bekommt eine feste Farbe für den gesamten Spieltag

### 4. Spielplan generieren
- Klick auf **Spielplan generieren** → jedes Team spielt gegen jedes andere Team genau einmal
- Die Reihenfolge ist so optimiert, dass kein Team zweimal hintereinander spielt

#### Aushilfe-Regel (bei Einzel-Team)
Wenn ein Allein-Spieler an der Reihe ist, springt automatisch ein zufälliger Spieler aus einem **pausierenden** Team als Aushilfe ein. Dieser wechselt bei jedem Spiel, damit es fair bleibt.

### 5. Ergebnisse eintragen
- Unter jedem Spiel gibt es zwei Zahlenfelder für das Ergebnis
- Einfach die Punkte beider Teams eintragen — die **Livetabelle** aktualisiert sich sofort

### 6. Livetabelle
Die Tabelle sortiert nach:
1. **Siege** (jeder Sieg = 1 Punkt)
2. **Direkter Vergleich** (bei Gleichstand)
3. **Punktedifferenz** (letzter Tiebreaker)

### 7. Neue Runde starten (optional)
Nach Abschluss der ersten Runde kann eine weitere Runde gespielt werden, ohne den Spieltag zu beenden:

- Klick auf **Neue Runde starten** → die aktuelle Runde wird im Hintergrund gespeichert
- Es öffnet sich eine Übersicht mit den aktuellen Spielern (Spieler können geändert werden)
- **Gleiche Teams** → Spielplan mit denselben Teams neu auslosen (nur aktiv, wenn Spieler unverändert)
- **Teams neu auslosen** → Spieler werden zufällig neu verteilt
- Die Livetabelle wird **zurückgesetzt** und zeigt nur die aktuelle Runde
- Alle Runden fließen am Ende gemeinsam in die Langzeitstatistiken ein

### 8. Spieltag speichern & exportieren
- Klick auf **Spieltag speichern** → alle Runden werden zusammen gespeichert
- Im Tab **Statistiken** auf **Exportieren** → lädt eine `.json`-Datei mit Datum und Uhrzeit im Dateinamen herunter (z. B. `teqball_2026-04-17_2130.json`)
- Die Datei in die Gruppe schicken, damit alle den gleichen Stand haben

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

Die App speichert alles lokal im Browser. Daten auf andere Geräte übertragen oder sichern:

- **Importieren** → auf der Spieltag-Seite (oben) oder im Tab „Statistiken"
- **Exportieren** → im Tab „Statistiken"; Dateiname enthält automatisch Datum + Uhrzeit

> **Tipp:** Nach jedem Spieltag exportieren und die Datei in die Gruppe schicken, damit alle den gleichen Stand haben.

---

## Hinweise

- Die App funktioniert komplett **ohne Internet** (nach dem ersten Laden)
- Daten werden lokal im Browser gespeichert — beim Löschen des Browser-Caches gehen sie verloren → Exportieren nach jeder Session nicht vergessen!
- Optimiert für **Mobilgeräte**
