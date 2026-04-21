 > [!WARNING]
> **Diese App läuft auf einer echten, aktiv genutzten Datenbank.**
> Bitte keine Testdaten eingeben. Zum Ausprobieren: Repository klonen → [eigene Instanz aufsetzen](#-cloning--setup).

---

# ⚽ Teqball App

**Der digitale Spieltag-Assistent für eure Teqball-Runden.**

![Status](https://img.shields.io/badge/Status-Beta-orange?style=flat-square)
![Tech](https://img.shields.io/badge/Stack-Vanilla%20JS%20%2F%20HTML%20%2F%20CSS-blue?style=flat-square)
![Hosting](https://img.shields.io/badge/Hosting-GitHub%20Pages-222?style=flat-square&logo=github)
![Lizenz](https://img.shields.io/badge/Lizenz-MIT-green?style=flat-square)

🌐 **Live-App:** [ff2710.github.io/teqball-app](https://ff2710.github.io/teqball-app/)

---

## 🌟 Highlights

Eine Web App, um die Teqball-Saison zu organisieren:

- 📋 **Automatische Teamauslosung und Spielplangenerierung** — Nachdem Teilnehmer*innen hinzugefügt wurden, werden 2er-Teams gelost. Jedes Team spielt pro Runde einmal gegen jedes andere.
- 📊 **Livetabelle** — Während die Ergebnisse eingetippt werden, aktualisiert sich die Tabelle in Echtzeit.
- 🏆 **Langzeitstatistiken** — Individualstatistiken (automatisch per Cloud-Sync) bezüglich Siege, Gewinnquote, Punktedifferenz und die besten Duos zeigen über alle Spieltage hinweg, wer an der Platte dominiert.
- ⚡ **Quick Match** — Voller Spielbetrieb ohne Speichern. Ideal für lockere Runden, bei denen nichts in die Statistik einfließen soll.

---

## 🚀 Anleitung für die Spielgruppe

### Quick Start

1. App öffnen und warten, bis der Sync-Punkt **grün** leuchtet
2. **Spieltag starten** → Spieler per Chip antippen (oder neu erstellen) → **Teams generieren** → **Spielplan generieren**
3. Ergebnisse eintragen — Livetabelle aktualisiert sich automatisch
4. Nach jeder Runde wählen: gleiche Teams, neue Teams oder Spieltag beenden
5. Beim Beenden werden alle Runden automatisch gespeichert und in die Statistiken eingerechnet

> **Wichtig:** Bekannte Spieler immer über die **Chips** antippen — nicht neu eintippen, da sonst die Statistiken verfälscht werden.

---

## ℹ️ Das Projekt

### Funktionen im Detail

**Spielverwaltung**
- Beliebig viele Spieler pro Spieltag; Spieler aus der Datenbank erscheinen als antippbare Chips
- Smarte Teamauslosung: bis zu 30 Shuffle-Versuche, um bereits gespielte Paarungen zu vermeiden; automatischer Reset, wenn alle Kombinationen erschöpft sind
- Aushilfe-Regel: bei ungerader Spielerzahl erhält das Einzel-Team automatisch einen rotierenden Mitspieler aus den ruhenden Teams
- Spielplan-Optimierung via Queue-Rotation (kein Team zweimal hintereinander)

**Ergebnisse & Tabelle**
- Gültige Ergebnisse: 11:x (x ≤ 9) oder Deuce — z. B. 12:10, 13:11 …
- Ungültige oder fehlende Ergebnisse werden farblich markiert; Rundenabschluss wird blockiert
- Tabellensortierung: Siege → direkter Vergleich (H2H) → Punktedifferenz
- Livetabelle mit 🥇🥈🥉-Medaillen für die Plätze 1–3

**Statistiken**
- Spieler-Statistiken: Siege, Niederlagen, Spiele, Gewinnquote, Punktedifferenz
- Beste Duos: Top-3-Duos nach Siegen oder Gewinnquote sortierbar
- Spieltag-Historie: alle vergangenen Spieltage mit Rundendetails einsehbar
- Letzter Spieltag als Vorschau auf dem Home-Bildschirm

**Technische Features**
- Pull-to-Refresh & Reload-Button für manuellen Sync
- Session-Persistenz via `localStorage` — kein Datenverlust bei Verbindungsunterbrechung
- saveDB-Retry-Logik (3 Versuche, exponentiell) mit Nutzer-Feedback bei Fehlschlag
- Scoreboard-Modus mit `requestFullscreen()`

---

## 🛠️ Tech Stack

| Technologie | Zweck | Erläuterung |
|---|---|---|
| **Vanilla JS** | App-Logik, State-Management | Kein Overhead durch Frameworks; volle Kontrolle, null Build-Step |
| **HTML5 / CSS3** | Struktur & Styling | Native PWA-Features, eigene Design-Token ohne Präprozessor |
| **JSONBin.io** | Cloud-Datenbank (REST) | Kostenlos, sofort einsatzbereit, kein Backend nötig |
| **GitHub Pages** | Hosting | Kostenlos, automatisches Deployment per Push |

---

## 🔧 Cloning & Setup

Wer die App für eine eigene Spielgruppe nutzen möchte, braucht lediglich einen kostenlosen JSONBin-Account und fünf Minuten.

### 1. Repository klonen

```bash
git clone https://github.com/ff2710/teqball-app.git
cd teqball-app
```

### 2. JSONBin-Datenbank anlegen

1. Kostenlosen Account bei [jsonbin.io](https://jsonbin.io) erstellen
2. Neues Bin anlegen mit folgendem Inhalt:
   ```json
   { "players": [], "sessions": [] }
   ```
3. **Bin-ID** und **API-Key** notieren

### 3. Zugangsdaten eintragen

In `app.js` die folgenden Konstanten oben in der Datei ersetzen:

```js
const JSONBIN_ID  = 'DEINE_BIN_ID';
const JSONBIN_KEY = 'DEIN_API_KEY';
```

### 4. Lokal starten oder deployen

```bash
# Lokal (z. B. mit VS Code Live Server oder Python)
python3 -m http.server 8080

# Oder einfach index.html im Browser öffnen
```

Für dauerhaftes Hosting: Fork erstellen → GitHub Pages in den Repo-Einstellungen aktivieren → fertig.

---

## 📈 Roadmap

Die App befindet sich aktuell in der **Testphase** mit einer festen Spielgruppe.

**Aktuell im Fokus**
- Bugfixes und Stabilitätsverbesserungen auf Basis echtem Spielbetriebs
- Feinschliff bestehender Features (UX, Edge Cases, Performance)
- Designverfeinerungen und weitere UI-Verbesserungen

**Mittelfristig angedacht**
- Das Problem der geteilten, öffentlich zugänglichen Datenbank (JSONBin) steht noch aus.

**Nicht geplant**
- Ein öffentlicher Launch oder Multi-Gruppen-Betrieb ist in absehbarer Zukunft nicht geplant.

---

## 🤝 Kontakt & Lizenz

**Autor:** Fidel — Hobby-Entwickler, Teqball-Enthusiast

Entwickelt mit Unterstützung von [Claude Code](https://claude.ai/code) (Anthropic).

Bugs, Feedback oder Ideen gerne als [GitHub Issue](https://github.com/ff2710/teqball-app/issues).

MIT License