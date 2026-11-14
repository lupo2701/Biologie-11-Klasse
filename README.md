# Zell-Quest · Biologie Klasse 11

Lern-App zur Klausurvorbereitung: **Zellbiologie, Biomembranen, Diffusion und Osmose**.
Die Inhalte folgen der Lerncheckliste des Kurses.

## Was die App kann

- **4 Lernmodule** mit Quizfragen (Multiple Choice, Richtig/Falsch, Zuordnen, Reihenfolge, Lückentext), jeweils mit Erklärung nach jeder Antwort
  1. Zelle & Mikroskopie
  2. Biomembran
  3. Diffusion & Osmose
  4. Plasmolyse & Zelltypen
- **Erklär-Aufgaben** im Klausurstil: Antwort selbst schreiben, dann mit den Punkten der Musterlösung vergleichen
- **Karteikarten** mit allen wichtigen Fachbegriffen
- **Osmose-Labor**: Pflanzenzelle und rote Blutzelle in Lösungen unterschiedlicher Konzentration beobachten
- **Gamification**: XP, 6 Level, Combo-Bonus, Lernserie in Tagen, 13 Abzeichen und ein Abschluss-Boss, der nach allen vier Modulen freigeschaltet wird

Der Fortschritt wird nur im Browser des jeweiligen Geräts gespeichert (localStorage). Es gibt keinen Server, keine Anmeldung und keine Datenübertragung.

## Online stellen (GitHub Pages)

1. Im Repository auf **Settings → Pages** gehen.
2. Unter *Build and deployment* bei **Source** „Deploy from a branch“ wählen, Branch **main** und Ordner **/ (root)**, dann **Save**.
3. Nach ein bis zwei Minuten ist die App unter `https://lupo2701.github.io/Biologie-11-Klasse/` erreichbar. Diesen Link an die Schülerinnen und Schüler weitergeben.

Hinweis: GitHub Pages funktioniert bei einem **privaten** Repository nur mit einem kostenpflichtigen GitHub-Konto. Mit einem kostenlosen Konto muss das Repository auf **öffentlich** gestellt werden (Settings → General → Danger Zone → Change visibility).

Lokal ausprobieren: einfach `index.html` im Browser öffnen.

## Inhalte bearbeiten

Alle Fragen, Karteikarten, Level und Abzeichen stehen in [`js/data.js`](js/data.js). Neue Fragen können direkt im passenden Modul ergänzt werden. Die verfügbaren Fragetypen sind oben in der Datei beschrieben.

## Aufbau

```
index.html      Startseite
css/style.css   Gestaltung
js/data.js      Lerninhalte
js/app.js       App-Logik
```
