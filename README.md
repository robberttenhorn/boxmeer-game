# Locals: Boxmeer

Een browsergame die zich afspeelt in het echte Boxmeer (Noord-Brabant): het noordoosten van het dorp, van het Wieldijkje tot de Steenstraat, het Weijerpark, de basiliek en het kasteel. De wereld is opgebouwd uit open overheidsdata: elk huis staat op de goede plek met de echte dakvorm, de straten hebben hun echte namen en de hoogte van het terrein klopt.

Dit is een losse kopie van [Locals: Gulpen](https://github.com/robberttenhorn/gulpen-game). De motor (gebouwen, verkeer, poppetjes, minigames) is dezelfde; de plekken, winkels en missies zijn voor Boxmeer.

## Spelen

```bash
npm install
npm run dev
```

Open daarna de link die Vite toont (meestal http://localhost:5173). Online: https://robberttenhorn.github.io/boxmeer-game/ (na het aanzetten van GitHub Pages).

**Besturing**
- Computer: WASD of pijltjes om te bewegen, Shift om te rennen, muis slepen om te kijken, E om te praten of in en uit te stappen, F voor fiets of skateboard, spatie als handrem, M voor de kaart.
- Mobiel: joystick links, slepen op de rechterhelft om te kijken, knoppen rechtsonder. Tik op de minikaart voor de grote kaart.

Je begint voor je huis aan het Wieldijkje 9. De fiets heb je altijd bij je.

## Eigen plekken

- **Achtertuin van Wieldijkje 9** (`src/boxmeer-wereld.js`): het zwembad staat op de plek en in de richting van het afgedekte bad op de luchtfoto van PDOK, binnen het kadasterperceel. Gazon, ligbedden, parasol, duikplank en flamingo zijn verzonnen aankleding.
- **Kabouterboom in het Weijerpark**: een oude knoestige boom met deurtjes, raampjes, trapjes en lampjes. De precieze plek in het park is een benadering.
- **Straat-BBQ op het Wieldijkje**: partytent met spandoek, lange tafel, vlaggetjes en een kogelbarbecue op straat, een paar huizen verder dan nummer 9.
- **Wieldijkje 9** (`src/wieldijkje.js`): nagebouwd naar een foto van de maker (Street View, maart 2025): crèmewitte baksteen, lichtblauwe kozijnen, een wit entreeblok met glasblokken en een blauwe voordeur, een erker met zinken kapje, zonnepanelen, een grindtuin met buxus en coniferen, een klinkeroprit en een witte camper. De maten komen uit de 3D BAG; de verdeling van ramen en deur is geschat.
- **Voortuinen aan het Wieldijkje**: oprit, gras of grind, een haagje, struiken, een tegelpad, een brievenbus en een container. Per huis anders, maar verzonnen: de echte tuinen zijn niet nagemaakt.
- **Skatebowl in het Weijerpark**: op de plek en in de vorm van de luchtfoto van PDOK (een ondiepe bak, een diepe ronde kom en een uitloper). De dieptes zijn geschat. Je kunt erin lopen, fietsen en skaten.
- **Sint-Petrusbasiliek** (`src/basiliek.js`): roodbruine baksteen, hoge smalle ramen met gebrandschilderd glas, de toren met vier uurwerken (die de echte tijd aangeven), galmgaten, een leien tentdak en de hoofdingang aan de Steenstraat. Bronnen: Reliwiki, Wikipedia, BHIC en Monumenten in Nederland (wederopbouwkerk uit 1950-1952 van H.W. Valk, Bossche School, toren met vier uurwerken en lei). De kleur van de baksteen komt van de luchtfoto; plek en maat van ramen, galmgaten en deuren zijn geschat.
- **Steenstraat** (`src/steenstraat.js`): stoepborden en uitstallingen voor de winkels, bloembakken met fietsen, bloemenmanden aan de lantaarnpalen, vlaggenlijnen boven de straat, winkelend publiek en een straatmuzikant bij de basiliek.

## Missies

Alle missies staan tegelijk open. Op de grote kaart zie je ze allemaal, met hun status en je beste tijd of score.

| Missie | Waar |
| --- | --- |
| Bommetje in de achtertuin: drie sprongen van de duikplank, de buren zijn de jury | Wieldijkje 9 |
| Straat-BBQ Wieldijkje: acht burgers bakken, hooguit twee verbrand | Wieldijkje |
| Feest in de kabouterboom: de neefjes van Klutje liggen na het feest overal in het park; met de warm/koud-meter terugvinden | Weijerpark |
| Sterke armen bij FysioHolland: biceps pompen om een paard in toom te houden op het Metworstrennen | Rembrandt van Rijnstraat 3 |
| Tuutjes trekken: condooms uit de automaat halen zonder dat de Steenstraat het ziet | Kruidvat, Steenstraat |
| IJsjes scheppen: bolletjes in de goede volgorde | IJssalon Rembrandt, Steenstraat |
| Tappen bij Nog'us: acht biertjes tot de streep, daarna een pilsje (wordt avond of weer ochtend) | Café Nog'us, Steenstraat |
| Gyros snijden bij Kapadokya: alleen het krokante vlees van de spies | Kapadokya, Steenstraat |
| Daags na de Tour: fietswedstrijd door de Steenstraat, heen en terug, met rondemissen bij de finish | Steenstraat |
| Het Heilig Bloed: vier flessen misswijn van de Albert Heijn naar de basiliek dragen zonder ergens tegenaan te lopen | Sint-Petrusbasiliek |
| Plat kalle: opa overhoort je in het Boksmèrs | Bankje bij het Raadhuisplein |
| Het gevolg van de prins: met een polonaise naar het Raadhuisplein | Raadhuisplein |
| Het Metworstrennen: paardenrace in drie afvalrondes (tik in de maat van de galop), word Koning van de Metworst | Oefenbaan aan de rand van het dorp |
| Boodschappen voor oma: langs Etos, HEMA, Bruna en Sylle Lingerie | Steenstraat |

Na de laatste missie nodigt de waard van Nog'us je uit op het Raadhuisplein voor de finale: je wordt Ereburger van Boksmèr, met vuurwerk, muziek en een polonaise.

## Data

Alle data staat in `public/data/`. Opnieuw ophalen (achter een proxy met `NODE_USE_ENV_PROXY=1`):

```bash
node tools/fetch-data.mjs     # gebouwen, BGT, wegen, hoogte, plekken
python3 tools/fetch-ortho.py  # luchtfoto
node tools/fetch-trees.mjs    # bomen, lantaarnpalen en bankjes (zie hieronder)
```

De BGT van Boxmeer bevat geen bomen, lantaarnpalen of bankjes. Die maakt `tools/fetch-trees.mjs` zelf: bomen uit de AHN (hoogte van alles min de hoogte van de grond, plaatselijke toppen boven 4 meter buiten gebouwen), lantaarnpalen om de 30 meter langs de straten en bankjes en fietsenrekken bij het park, de pleinen en de winkels.

| Bron | Wat | Licentie |
| --- | --- | --- |
| [3D BAG](https://3dbag.nl) (TU Delft / 3DGI) | Gebouwen in 3D | CC BY 4.0 |
| [AHN](https://www.ahn.nl) via PDOK | Hoogte van maaiveld en bomen | CC0 |
| [BGT](https://www.pdok.nl) via PDOK | Wegen, water, groen | CC0 |
| [NWB](https://www.pdok.nl) via PDOK | Wegennet met straatnamen | CC0 |
| [Luchtfoto](https://www.beeldmateriaal.nl) via PDOK | Kleur van groen en daken, plek van het zwembad | CC BY 4.0 |
| [ez-tree](https://github.com/dgreenheck/ez-tree) | Boommodellen | MIT |
| [Poly Haven](https://polyhaven.com) | Fototexturen en luchten | CC0 |

## Nog te controleren

- **Boksmèrs**: de woorden (joe, erpel, plat, mien, wöölese, klutje, ingsullu, boks, mik, schik, huus, neije, snèj, gin) en de uitdrukking "liever schik as un neije boks" komen uit openbare woordenlijsten van het Boxmeers die ik via zoeken vond (onder andere mijnwoordenboek.nl, door bezoekers samengesteld). Laat ze nakijken door een echte Boksmèrse of Boksmèrs.
- **Winkels en cafés**: de adressen komen uit online gidsen en de PDOK Locatieserver. Gidsen kunnen verouderd zijn: controleer of de zaken er nog zitten. FysioHolland aan de Rembrandt van Rijnstraat 3 is opgegeven door de maker. Borden, kleuren en etalages zijn verzonnen, zonder echte logo's.
- **Historie**: het Heilig Bloed (rond 1400, een twijfelende priester) en het criterium Daags na de Tour komen uit online bronnen. De personen en grappen in de missies zijn verzonnen.
- **Metworstrennen** (Immaterieel Erfgoed, Wikipedia, Omroep Brabant): een eeuwenoude paardenrace op carnavalsmaandag op het Vortums Veld tussen Sambeek en Vortum-Mullem. Alleen ongehuwde jongemannen, geboren, getogen en wonend in Boxmeer, lid van De Metworst. Afvalrondes over bijna 800 meter; de winnaar is een jaar Koning van de Metworst en krijgt zeven el metworst, wittebrood, bier en een half varkenskop. In de game is het een oefenrace op een rechte weg in het speelgebied, niet op het echte Vortums Veld. De ruiters zijn verzonnen.
- **Noblesse**: naam opgegeven door de maker. De flyers, de bus en de codes zijn verzonnen.
- **Kabouterboom**: de maker gaf aan dat er een kabouterboom in het Weijerpark staat; online kon ik de precieze plek niet vinden.
- **Echte personen**: bewust weggelaten. De mensen in de missies zijn verzonnen rollen.
- **Merken** (Kruidvat, Albert Heijn, HEMA, Bruna, Rabobank, ABN AMRO, Blokker, Etos, Intertoys, Scapino, Willy Arts Schoenmode, Sylle Lingerie, Het Juweliershuis Van Pampus, ICI Paris XL, Van Os tassen en koffers, Phone House, FysioHolland en de horeca) worden bij naam genoemd. Vraag toestemming voordat de game breed gedeeld wordt.

## Techniek

Vite + Three.js, geen game-engine. Gebouwen krijgen in een shader baksteen, pleisterwerk, kozijnen en dakpannen; wegen, stoepen en water zijn losse meshes uit de BGT; etalages tonen een kamer erachter; er loopt verkeer over het echte wegennet en er lopen dorpsbewoners rond.
