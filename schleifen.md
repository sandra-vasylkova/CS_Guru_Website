# Schleifen

Schleifen sind praktisch, weil du einen Codeblock einmal schreibst und ihn dann beliebig oft wiederholen kannst. Statt dieselbe Zeile zehnmal zu tippen, geh lieber raus und fass mal Gras an. Glaub mir.

In Python gibt es zwei Arten von Schleifen: `for` und `while`.

Die `for`-Schleife könnte man einen Iterator nennen. Mit ihr kannst du zum Beispiel jedes Element einer Liste durchgehen.

Beispiel:

```python
lebensziele = ["Schule beenden", "Programmieren", "Code schreiben", "Python lernen", "Wasser trinken"]

for ziel in lebensziele:
    print(ziel)
```

Ausgabe:

```
Schule beenden
Programmieren
Code schreiben
Python lernen
Wasser trinken
```

Kurz übersetzt: Für jedes Ziel aus der Liste `lebensziele` wird das Ziel ausgegeben.

`ziel` ist eine Variable, der bei jedem Durchgang ein neuer Wert aus der Liste zugewiesen wird, bis die Elemente ausgehen. Du kannst sie nennen, wie du willst, meinetwegen auch Shrek, aber dann wünsche ich deinem Lehrer schon mal viel Kraft und Geduld.

Also: Nimm dir den Rat aus dem ersten Thema zu vernünftigen Variablennamen zu Herzen und mach dir und allen anderen das Leben leichter.

Wie schon bei den Bedingungen brauchst du einen Doppelpunkt und eine Einrückung von vier Leerzeichen. Alles, was eingerückt ist, wird bei jedem Durchgang wiederholt. Code ohne Einrückung läuft erst weiter, nachdem die Schleife beendet ist.

Wichtig: Python liest den Code von oben nach unten.

Da ein String genau wie eine Liste eine Datenstruktur ist, funktioniert die Iteration auch mit ihm.

Beispiel:

```python
fach = "Mathe"

for char in fach:
    print(char)
```

Ausgabe:

```
M
a
t
h
e
```

Falls du dich fragst: `char` ist die Abkürzung für character 😉

## Funktion range()

Das ist wohl die meistgenutzte Funktion in Verbindung mit einer `for`-Schleife.

Wenn du eine Folge von Zahlen brauchst (ich frag gar nicht erst, wozu) oder eine bestimmte Aktion n-mal wiederholen willst, ist `range()` genau das Richtige für dich.

Beispiel:

```python
for i in range(5):
    print(i)
```

Ausgabe:

```
0
1
2
3
4
```

`range(5)` erzeugt die Zahlen von 0 bis 4. Die angegebene Endzahl 5 ist also nicht mehr enthalten. Da bei 0 angefangen wird, entstehen trotzdem genau fünf Zahlen.

Wenn du auch die Zahl 5 ausgeben möchtest, erhöhst du das Ende um 1.

Beispiel:

```python
n = 5

for i in range(n + 1):
    print(i)
```

Ausgabe:

```
0
1
2
3
4
5
```

So ist die in der Variable gespeicherte Zahl ebenfalls enthalten.

Weitere Anwendungen der Funktion:

`range(n, k)`, wobei `n` der Start und `k` das Ende ist. So kannst du einen konkreten Bereich festlegen. `k` selbst ist nicht mehr enthalten.

Beispiel:

```python
for i in range(2, 5):
    print(i)
```

Ausgabe:

```
2
3
4
```

`range(n, k, m)`, wobei `m` die Schrittweite ist.

Beispiel:

```python
for i in range(0, 10, 2):
    print(i)
```

Ausgabe:

```
0
2
4
6
8
```

Aber warum steht hier `i`, fragst du, wie war das noch mit den „vernünftigen Namen“?

`i` wird oft als Abkürzung für `index` verwendet. Bei kurzen Schleifen hat sich dieser Name einfach eingebürgert. Statt jedes Mal ein längeres Wort zu tippen, nutzen Programmierer diesen Shortcut. Finde dich einfach damit ab.

Wenn du nur markieren willst, dass eine Aktion mehrmals ausgeführt wird, kannst du den Unterstrich verwenden.

Beispiel:

```python
lieblingsort = "Schule"

for _ in range(3):
    print(lieblingsort)
```

Ausgabe:

```
Schule
Schule
Schule
```

Hier steht dieses Zeichen einfach nur, damit die Schleife läuft, nicht weil die Variable selbst wichtig wäre.

## enumerate()

Jetzt wird's schon interessanter. Sagen wir, du baust ein Alphabet und willst wissen, welcher Buchstabe an welcher Stelle kommt. Klar, du könntest ein Dictionary erstellen und jedem Buchstaben seine Nummer zuweisen, aber das wäre nur die nächste Ausrede, bloß nicht rauszugehen und Gras anzufassen.

Wie du schon weißt, hat jedes Element einer Liste seinen eigenen Index. Jetzt musst du Python nur noch dazu bringen, das mit dir zu teilen, statt den Geizhals zu spielen. Und genau dafür ist `enumerate()` da.

Beispiel:

```python
alphabet = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]

for index, letter in enumerate(alphabet):
    print(index, letter)
```

Ausgabe:

```
0 a
1 b
2 c
3 d
…
```

Aber das ist doch nicht der nullte, sondern der erste Buchstabe des Alphabets, sagst du, und damit hast du recht.

Das war eine hinterhältige Überleitung zum nächsten Beispiel, und du bist voll drauf reingefallen.

Beispiel:

```python
for index, letter in enumerate(alphabet, start=1):
    print(f"{index}. {letter}")
```

Ausgabe:

```
1. a
2. b
3. c
4. d
…
```

Mit dem f-String haben wir das Ganze auch noch hübsch gemacht. Aber mit `break` und `continue` geht's noch hübscher.

`break` beendet die Schleife sofort. Nehmen wir an, du brauchst alle Buchstaben bis `m` aus dem Alphabet.

Beispiel:

```python
for index, letter in enumerate(alphabet, start=1):
    if letter == "m":
        print(f"{letter} ist der {index}. Buchstabe im Alphabet")
        break
    print(letter)
```

Ausgabe:

```
a
b
c
…
k
l
m ist der 13. Buchstabe im Alphabet
```

Die restlichen Buchstaben werden gar nicht erst durchgegangen, weil die Schleife ihr Ziel erreicht hat. Sei wie die Schleife, erreiche deine Ziele!

`continue` überspringt ein bestimmtes Element und macht ohne anzuhalten mit der Schleife weiter.

Beispiel:

```python
for i in range(5):
    if i == 2:
        continue
    print(i)
```

Ausgabe:

```
0
1
3
4
```

## While

Hier ist im Vergleich zu `for` alles ganz einfach. `while` wiederholt einen Codeblock so lange, wie eine Bedingung wahr ist. Im Grunde ist das der gute alte `if`, der sich immer und immer wieder wiederholt.

Beispiel:

```python
count = 0

while count < 5:
    print(count)
    count += 1
```

Ausgabe:

```
0
1
2
3
4
```

Was hier passiert: Anfangs ist `count` gleich 0. Vor jedem Durchgang prüft `while`, ob `count < 5` wahr ist. Danach wird `count` ausgegeben und durch `count += 1` um 1 erhöht. Sobald `count` den Wert 5 erreicht, ist die Bedingung falsch und die Schleife endet.

## Endlosschleife

Die Zeile `count += 1` ist nichts anderes als `count = count + 1`. Das ist hier das entscheidende Detail, denn ohne sie bleibt die Bedingung in jeder neuen Runde wahr. `count` bleibt dann 0, was ganz klar kleiner als 5 ist, und die Schleife spammt deine Konsole mit Nullen zu. Ich rate dir, das nicht auszuprobieren, sondern mir einfach aufs Wort zu glauben.

Falls du es dennoch gewagt hast, mir nicht zu gehorchen, und so eine Schleife aus Spaß gestartet hast, benutz die Tastenkombination Strg + C — auch auf dem Mac Control + C —, um sie abzubrechen.

Trotzdem ist eine Endlosschleife manchmal sogar nötig. Bei `while True` benutzt man häufig `break`, sobald die gewünschte Bedingung erfüllt ist.

Als Beispiel schreiben wir ein Mini-Spiel „Zahl erraten“.

```python
zahl = 5

while True:
    versuch = int(input("Rate die Zahl: "))
    if versuch == zahl:
        print("Richtig!")
        break
    elif versuch < zahl:
        print("höher")
    else:
        print("niedriger")
```

So fragt die Konsole den Benutzer so lange nach einer Zahl, bis er sie errät. An diesem Beispiel kannst du dich gleich auf all die vorherigen Themen testen.

Für alle Fälle lass ich dir noch eine ausführliche Erklärung da, die du garantiert nicht brauchen wirst 😀

> **[Button: Antwort anzeigen]**
>
> *ausführliche Erklärung*

## Woher weiß ich, welche Schleife ich brauche?

`for` wählst du, wenn du die Elemente einer Datenstruktur durchgehen oder eine Aktion eine bestimmte Anzahl von Malen wiederholen möchtest.

`while` wählst du, wenn der Code so lange laufen soll, wie eine bestimmte Bedingung wahr ist. Dabei weißt du oft vorher nicht genau, wie viele Durchgänge nötig sein werden.

Ich verrat dir ein Geheimnis: Bei vielen Anfängeraufgaben brauchst du `for`. Aber sobald die Wiederholung von einer Bedingung abhängt, ist `while` dein Kandidat.
