 > [!WARNING]
> **Bitte die Live-App nicht mit eigenen Testdaten befüllen.**
> Diese Instanz läuft auf einer geteilten Datenbank, die von einer echten Spielgruppe aktiv genutzt wird. Fremde Eingaben gefährden die Datenintegrität und verfälschen langjährige Statistiken.
> Wer die App ausprobieren möchte, sollte das Repository klonen und eine eigene Instanz aufsetzen — [Anleitung weiter unten](#-cloning--setup).

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

Wer kennt das: Ihr steht am Teqball-Tisch, niemand weiß mehr, wer gegen wen gespielt hat, die Teampaarungen werden immer unfairer und am Ende erinnert sich keiner mehr ans Endergebnis.

Die Teqball App löst genau das:

- 🎲 **Faire Auslosung** — Teams werden zufällig gelost. Paarungen, die in diesem Spieltag bereits gespielt wurden, werden automatisch vermieden.
- 📋 **Automatischer Spielplan** — Jedes Team spielt genau einmal gegen jedes andere. Die Reihenfolge ist so optimiert, dass kein Team zweimal hintereinander spielen muss.
- 📊 **Livetabelle** — Während die Ergebnisse eingetippt werden, aktualisiert sich die Tabelle in Echtzeit — inklusive Medaillen für die Top 3.
- 🖥️ **Scoreboard-Modus** — Ein Tap öffnet eine Vollbild-Ansicht der Tabelle. Perfekt auf dem Tablet auf dem Tisch oder an einem gemeinsam sichtbaren Bildschirm.
- 🏆 **Langzeitstatistiken** — Siege, Gewinnquote, Punktedifferenz und die besten Duos — über alle Spieltage hinweg.
- ☁️ **Cloud-Sync** — Alle Ergebnisse werden automatisch synchronisiert. Jedes Gerät sieht denselben Stand, ohne manuelle Übertragung.
- ⚡ **Quick Match** — Voller Spielbetrieb ohne Speichern. Ideal für lockere Runden, bei denen nichts in die Statistik einfließen soll.
- 🔁 **Session-Recovery** — Wird die App unbeabsichtigt geschlossen (Browser-Reload, iOS-Hintergrundkill), stellt sie den laufenden Spieltag automatisch wieder her.

---

## 🚀 Anleitung für die Spielgruppe

### Quick Start

1. App öffnen und warten, bis der Sync-Punkt **grün** leuchtet
2. **Spieltag starten** → Spieler per Chip antippen → **Teams generieren** → **Spielplan generieren**
3. Ergebnisse eintragen — Livetabelle aktualisiert sich automatisch
4. Nach jeder Runde wählen: gleiche Teams, neue Teams oder Spieltag beenden
5. Beim Beenden werden alle Runden automatisch gespeichert und in die Statistiken eingerechnet

> **Wichtig:** Bekannte Spieler immer über die **Chips** antippen — niemals neu eintippen.
> Tippfehler oder Varianten eines Namens erzeugen Duplikate und verfälschen die Langzeitstatistik.

### Modi im Überblick

| Modus | Speichert Ergebnisse | Langzeitstatistik |
|---|---|---|
| ▶ Spieltag | ✅ Ja | ✅ Ja |
| ⚡ Quick Match | ❌ Nein | ❌ Nein |

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
- Beste Duos: Top-3-Partnerschaften nach Siegen oder Gewinnquote sortierbar
- Spieltag-Historie: alle vergangenen Spieltage mit Rundendetails einsehbar
- Letzter Spieltag als Vorschau auf dem Home-Bildschirm

**Technische Features**
- Pull-to-Refresh & Reload-Button für manuellen Sync
- Session-Persistenz via `localStorage` — kein Datenverlust bei Verbindungsunterbrechung
- saveDB-Retry-Logik (3 Versuche, exponentiell) mit Nutzer-Feedback bei Fehlschlag
- Scoreboard-Modus mit `requestFullscreen()`

---

## 🛠️ Tech Stack

| Technologie | Zweck | Warum |
|---|---|---|
| **Vanilla JS** | App-Logik, State-Management | Kein Overhead durch Frameworks; volle Kontrolle, null Build-Step |
| **HTML5 / CSS3** | Struktur & Styling | Native PWA-Features, eigene Design-Token ohne Präprozessor |
| **JSONBin.io** | Cloud-Datenbank (REST) | Kostenlos, sofort einsatzbereit, kein Backend nötig |
| **GitHub Pages** | Hosting | Kostenlos, automatisches Deployment per Push |

Die bewusste Entscheidung gegen Frameworks (React, Vue, etc.) war keine Einschränkung, sondern ein Designprinzip: Die App soll wartbar und verständlich bleiben, ohne dass ein Build-System oder Node-Ökosystem mitgeschleppt werden muss.

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
- 🐛 Bugfixes und Stabilitätsverbesserungen auf Basis echtem Spielbetriebs
- 🔍 Feinschliff bestehender Features (UX, Edge Cases, Performance)

**Mittelfristig angedacht**
- Designverfeinerungen und weitere UI-Verbesserungen
- Erweiterung der Statistiken (z. B. Head-to-Head-Übersicht)
- Das Problem der geteilten, öffentlich zugänglichen Datenbank (JSONBin) steht noch aus — Lösungsansätze wie Auth-Layer oder eigener Backend-Dienst werden evaluiert

**Nicht geplant**
- Öffentlicher Launch oder Multi-Gruppen-Betrieb in absehbarer Zukunft

---

## 🤝 Kontakt & Lizenz

**Autor:** Fidel — Hobby-Entwickler, Teqball-Enthusiast

Dieses Projekt ist ein persönliches Hobby-Projekt, entstanden aus einem echten Bedarf in einer echten Spielgruppe.

**Bugs gefunden? Idee für ein neues Feature?**
Issues und Feedback sind herzlich willkommen — am einfachsten per [GitHub Issue](https://github.com/ff2710/teqball-app/issues) oder direkt im Gespräch.

---

MIT License — siehe [LICENSE](LICENSE) für Details.
