# Teqball App

Mobile Web-App für Teqball-Spieltage in der Freundesgruppe — automatische Teamauslosung, Spielplan, Livetabelle, Mehrrunden-Support und Langzeitstatistiken mit Cloud-Sync.

🌐 **Live:** https://ff2710.github.io/teqball-app/

---

## Features

- **Cloud-Sync** — alle Daten werden automatisch über JSONBin.io synchronisiert; jedes Gerät sieht denselben Stand, ohne dass Dateien ausgetauscht werden müssen
- **Spieltag** — Spieler auswählen, Teams generieren, Spielplan erstellen, Ergebnisse eintragen, Livetabelle beobachten; beliebig viele Runden pro Spieltag
- **Schnelle Runde** — voller Spielbetrieb ohne Speichern; Statistiken bleiben unberührt
- **Smarte Teamauslosung** — bereits gespielte Paarungen des aktuellen Spieltags werden automatisch vermieden; nach Ausschöpfung aller Kombinationen wird zurückgesetzt
- **Aushilfe-Regel** — bei ungerader Spielerzahl bekommt ein Team nur einen Spieler; im Spielplan springt automatisch ein Spieler aus einem pausierenden Team als Aushilfe ein
- **Spielerstatistiken** — Siege, Quote, Punktedifferenz über alle gespeicherten Spieltage; Sortierung umschaltbar (Quote / Siege)
- **Beste Duos** — welche 2er-Konstellation hat die meisten Siege / die beste Quote?
- **Spieltag-Historie** — alle gespeicherten Spieltage mit Rundenergebnissen auf einen Blick

---

## Ablauf

### Home
Beim Öffnen verbindet sich die App automatisch mit der Cloud. Erst wenn der Punkt **grün** ist, sind die Daten synchronisiert — dann erst Spieltag starten.

Ein laufender Spieltag wird als Banner angezeigt; über „Weiterspielen →" gelangt man direkt zurück.

### Spieltag starten
Im Tab **Spieltag** zwischen zwei Modi wählen:

| Modus | Beschreibung |
|---|---|
| **Spieltag starten** | Runden werden gespeichert, Langzeitstatistik wird aktualisiert |
| **⚡ Schnelle Runde** | Voller Spielbetrieb, aber nichts wird gespeichert |

### Spieler
Bereits bekannte Spieler erscheinen als Chips — **antippen statt neu eintippen**. Nur über Chips werden Namen korrekt mit der Langzeitstatistik verknüpft.

Neue Namen können über das Textfeld hinzugefügt werden; sie werden automatisch in die Datenbank übernommen.

### Teams generieren
Klick auf **Teams generieren** → zufällige 2er-Teams. Bei ungerader Spielerzahl entsteht ein Einzel-Team mit automatischer Aushilfe.

Die Auslosung vermeidet Wiederholungen: Paarungen, die im aktuellen Spieltag schon gespielt wurden, werden übersprungen. Sind alle Kombinationen erschöpft, wird der Verlauf zurückgesetzt.

Teams können jederzeit neu generiert werden, solange noch kein Spielplan läuft (danach Bestätigungsdialog).

### Spielplan
Klick auf **Spielplan generieren** → jedes Team spielt einmal gegen jedes andere. Die Reihenfolge verhindert, dass dasselbe Team zweimal hintereinander antritt.

Bei aktiver Runde werden Spieler- und Teamkarten ausgeblendet — nur Spielplan, Livetabelle und der Beenden-Button sind sichtbar.

### Ergebnisse & Livetabelle
Ergebnisse direkt in die Felder eintragen. Die **Livetabelle** aktualisiert sich sofort.

**Gültige Ergebnisse:** 11:x mit x ≤ 9, oder Deuce (12:10, 13:11, …). Ungültige Eingaben werden markiert und blockieren das Rundenende.

### Runde beenden
Sobald alle Ergebnisse eingetragen und gültig sind, auf **✓ Runde beenden** klicken. Es erscheint ein Modal mit:

- Rundensieger und Abschlussrangliste
- **Gleiche Teams** — selbe Paarungen, neuer Spielplan
- **Neue Teams** — gleiche Spieler, neue Auslosung
- **Spieltag beenden** — alle Runden werden in der Cloud gespeichert

### Spieltag beenden
Beim Beenden wird der komplette Spieltag (alle Runden) in der Cloud gespeichert und steht sofort auf allen Geräten zur Verfügung. Laufende, noch nicht abgeschlossene Runden werden verworfen.

---

## Statistiken

### Spielerstatistiken
Zählt alle gespeicherten Spieltage. Sortierung per Dropdown umschaltbar zwischen **Quote** (Standard) und **Siege**.

| Spalte | Bedeutung |
|---|---|
| Sp | Gespielte Matches |
| S / N | Siege / Niederlagen |
| Quote | Siege ÷ Spiele |
| Diff | Erzielte − kassierte Punkte |

### Beste Duos
Welche 2er-Konstellation spielt am besten zusammen?

- **Meiste Siege** — Top 3 nach absoluten Siegen
- **Beste Quote** — Top 3 nach Siegquote (mind. 3 gemeinsame Spiele nötig)

---

## Livetabelle — Rangfolge

1. Meiste Siege
2. Direkter Vergleich
3. Punktedifferenz

---

## Technik

- Vanilla JS / HTML / CSS — kein Framework, kein Build-Step
- [JSONBin.io](https://jsonbin.io) als Cloud-Datenbank (REST API)
- Hosting via GitHub Pages
- Optimiert für Mobilgeräte; funktioniert im Browser ohne Installation
