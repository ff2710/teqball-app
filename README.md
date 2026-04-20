# Teqball App

Mobile Web-App für Teqball-Spieltage — automatische Teamauslosung, Spielplan, Livetabelle und Langzeitstatistiken mit Cloud-Sync.

🌐 **Live:** https://ff2710.github.io/teqball-app/

---

## Funktionen

- **Spieltag** — Spieler auswählen, Teams auslosen, Spielplan generieren, Ergebnisse eintragen, Livetabelle live verfolgen; beliebig viele Runden pro Spieltag
- **Quick Match** — voller Spielbetrieb ohne Speichern; Statistiken bleiben unberührt
- **Smarte Auslosung** — bereits gespielte Paarungen des laufenden Spieltags werden automatisch vermieden
- **Aushilfe-Regel** — bei ungerader Spielerzahl springt automatisch ein Spieler als Aushilfe ein
- **Langzeitstatistiken** — Siege, Quote, Punktedifferenz; Beste Duos
- **Cloud-Sync** — alle Daten werden automatisch synchronisiert; jedes Gerät sieht denselben Stand

---

## Ablauf

1. App öffnen, warten bis der Sync-Punkt **grün** ist
2. **Spieltag starten** → Spieler antippen → Teams generieren → Spielplan generieren → Ergebnisse eintragen
3. Nach jeder Runde: gleiche Teams, neue Teams oder Spieltag beenden
4. Beim Beenden werden alle Runden automatisch gespeichert

**Wichtig:** Bekannte Spieler immer per **Chip antippen** — nie neu eintippen. Tippfehler erzeugen Duplikate in der Statistik.

---

## Technik

- Vanilla JS / HTML / CSS — kein Framework, kein Build-Step
- [JSONBin.io](https://jsonbin.io) als Cloud-Datenbank
- Hosting via GitHub Pages
