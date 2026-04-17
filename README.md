# Teqball Teamgenerator

Eine mobile Web-App zum Verwalten von Teqball-Spieltagen in der Freundesgruppe — mit automatischer Teamauslosung, Spielplan, Livetabelle und Langzeitstatistiken.

🌐 **Live:** https://ff2710.github.io/teqball-app/

---

## So funktioniert ein Spieltag

### 1. Spieler hinzufügen
- Namen einzeln eintippen und auf **+** drücken (oder Enter)
- Wer schon mal gespielt hat, erscheint als Chip unter dem Eingabefeld → einfach antippen zum Hinzufügen
- Spieler können per **×** wieder entfernt werden

### 2. Teams generieren
- Klick auf **Teams generieren** → die Spieler werden zufällig in 2er-Teams aufgeteilt
- Bei **ungerader Spielerzahl** bekommt ein Spieler ein Allein-Team (gekennzeichnet mit „Einzel")
- Jedes Team bekommt eine feste Farbe für den gesamten Spieltag

### 3. Spielplan generieren
- Klick auf **Spielplan generieren** → jedes Team spielt gegen jedes andere Team genau einmal
- Die Reihenfolge ist so optimiert, dass kein Team zweimal hintereinander spielt

#### Aushilfe-Regel (bei Einzel-Team)
Wenn ein Allein-Spieler an der Reihe ist, springt automatisch ein zufälliger Spieler aus einem **pausierenden** Team als Aushilfe ein. Dieser wechselt bei jedem Spiel, damit es fair bleibt.

### 4. Ergebnisse eintragen
- Unter jedem Spiel gibt es zwei Zahlenfelder für das Ergebnis
- Einfach die Punkte beider Teams eintragen — die **Livetabelle** aktualisiert sich sofort

### 5. Livetabelle
Die Tabelle sortiert nach:
1. **Siege** (jeder Sieg = 1 Punkt)
2. **Direkter Vergleich** (bei Gleichstand)
3. **Punktedifferenz** (letzter Tiebreaker)

### 6. Spieltag speichern
- Klick auf **Spieltag speichern** → der Spieltag wird lokal gespeichert
- Die Ergebnisse fließen ab jetzt in die Langzeitstatistiken ein

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

Die App speichert alles lokal im Browser. Um die Daten auf einem anderen Gerät weiterzunutzen oder zu sichern:

- **Exportieren** → lädt eine `.json`-Datei herunter
- **Importieren** → lädt eine zuvor exportierte `.json`-Datei wieder ein

> **Tipp:** Nach jedem Spieltag exportieren und die Datei in der Gruppe teilen, damit alle den gleichen Stand haben.

---

## Hinweise

- Die App funktioniert komplett **ohne Internet** (nach dem ersten Laden)
- Daten werden im Browser gespeichert — beim Löschen des Browser-Caches gehen sie verloren → regelmäßig exportieren!
- Optimiert für **Mobilgeräte**
