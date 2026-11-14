# Kurs i praca z AI — robocze podsumowanie z perspektywy IT PM-a

> Dokument roboczy do przygotowania ewentualnego spotkania, wpisu lub komentarza na community AI. Zawiera zarówno obserwacje użytkownika, jak i ocenę współpracy z AI podczas budowy KeepInTouch.

**Data opracowania:** 2026-10-01  
**Projekt referencyjny:** KeepInTouch  
**Perspektywa:** IT PM z quasi-technicznym doświadczeniem  
**Status:** materiał do dalszej redakcji

## 1. Główna teza

Najważniejszą wartością kursu nie jest samo generowanie kodu przez AI. Największą wartością jest nauczenie się, jak prowadzić cały proces dostarczania oprogramowania z AI jako partnerem technicznym i wykonawczym.

Kurs pokazuje, że IT PM z ograniczonym doświadczeniem programistycznym może, korzystając z narzędzi AI, zbudować w kilkanaście wieczorów kompletną aplikację MVP. Nie oznacza to, że AI samodzielnie zastępuje zespół albo że PM nie musi podejmować decyzji. Oznacza to, że koszt implementacji, researchu, testowania i dokumentowania znacząco spada, a jedna osoba może objąć odpowiedzialnością znacznie większy fragment cyklu wytwarzania produktu.

AI nie przejmuje odpowiedzialności za produkt. Przejmuje dużą część pracy wykonawczej, ale człowiek nadal odpowiada za problem, zakres, priorytety, architekturę, ryzyko, kryteria akceptacji i decyzję, czy rezultat jest wystarczająco dobry.

## 2. KeepInTouch jako dowód pracy

KeepInTouch jest prywatną aplikacją do przechowywania informacji o relacjach i przygotowywania się do przyszłych rozmów. Użytkownik może zapisywać osoby i datowane interakcje, a następnie ręcznie uruchomić ekstrakcję tematów, które mogą być przydatne przed kolejną rozmową.

Aplikacja obejmuje między innymi:

- passwordless authentication;
- chroniony dashboard i chroniony endpoint ekstrakcji;
- tworzenie, odczyt, edycję i usuwanie osób;
- rejestrowanie i przeglądanie interakcji;
- lokalne, owner-scoped przechowywanie danych w IndexedDB;
- walidację domenową niezależną od samego UI;
- kontrolowany kontrakt dla wywołań AI;
- ograniczenia rozmiaru danych i odpowiedzi modelu;
- obsługę błędów i zachowanie poprzedniego briefingu po nieudanej ekstrakcji;
- testy jednostkowe, integracyjne i Playwright E2E;
- CI, build produkcyjny i deployment na Cloudflare Workers.

Dla technicznej osoby taka aplikacja może nie być szczególnie imponująca. Warto jednak pamiętać, że jeszcze kilka lat temu podobny zakres wymagałby prawdopodobnie współpracy backend developera, osoby odpowiedzialnej za bazę danych, frontend developera, DevOpsa, UI developera i QA. Teraz jedna osoba z minimalnym zapleczem technicznym może z pomocą AI zbudować taki produkt w kilkanaście wieczorów.

To nie jest dowód, że każda osoba bez doświadczenia może w ten sposób zbudować dowolny system. Jest to jednak mocny dowód na zmianę roli IT PM-a i na to, że przy ograniczonym zakresie można samodzielnie przejść od problemu do działającego, testowanego i wdrożonego MVP.

## 3. Kurs jako podejście procesowe

Kurs jest przede wszystkim podejściem procesowym. Prowadzi przez kolejne poziomy pracy:

```text
inicjalizacja
→ discovery i framing
→ PRD
→ wybór stacku
→ architektura i rozeznanie w repozytorium
→ roadmapa
→ research
→ plan
→ implementacja / TDD / E2E
→ review
→ archiwizacja i closeout
```

Poszczególne skille tworzą rodzaj systemu operacyjnego projektu:

- `shape` pomaga zrozumieć problem, użytkownika, ograniczenia i zakres MVP;
- `prd` zamienia ustalenia w sprawdzalny kontrakt produktu;
- `tech-stack-selector` pomaga dobrać stack i zapisać decyzję w sposób zrozumiały dla bootstrappera i kolejnych etapów;
- `roadmap` porządkuje kolejność dostarczania i dzieli produkt na pionowe slice’y;
- `research` sprawdza, jak naprawdę działa istniejący projekt;
- `plan` przekłada rozpoznanie na fazy implementacyjne i kryteria weryfikacji;
- `implement` prowadzi wykonanie planu i pilnuje dowodów;
- `tdd` pozwala prowadzić odpowiednie fragmenty przez red → green → refactor;
- `e2e` skupia się na ryzykach, które rzeczywiście trzeba sprawdzić w przeglądarce;
- `impl-review` sprawdza drift, zakres, bezpieczeństwo, architekturę i dowody;
- `archive` zamyka zmianę i zachowuje jej historię.

Największą wartością dodaną są nie pojedyncze komendy, ale skille pilnujące całego procesu. Pomagają nie pominąć dokumentacji, kontraktów, testów, ręcznej akceptacji, review i closeoutu.

## 4. Dokumentacja jako pamięć projektu i redukcja chaosu

Z perspektywy PM-a bardzo wartościowe jest to, że decyzje nie zostają wyłącznie w głowach uczestników projektu ani w rozproszonych wiadomościach.

W typowych projektach dokumentacja bywa niepełna, przestarzała albo tworzona dopiero wtedy, gdy ktoś jej potrzebuje. Po kilku tygodniach nie zawsze wiadomo:

- dlaczego wybrano konkretną architekturę;
- które funkcje są naprawdę wymagane;
- co zostało świadomie odłożone;
- jakie ryzyka zaakceptowano;
- jakie testy są dowodem działania;
- czy dana rzecz została wdrożona, tylko zaplanowana, czy jedynie zasugerowana;
- co było decyzją biznesową, a co technicznym kompromisem.

W podejściu opartym na planach, artefaktach i specyfikacji te informacje są zapisywane w toku pracy. PRD opisuje produkt, roadmapa opisuje kolejność, plan opisuje zmianę, test plan opisuje ryzyka, implementation review opisuje ocenę, a archiwum zachowuje historię.

Najważniejsza korzyść polega na tym, że automatycznie wiemy, co mamy. Można sprawdzić, jaki był cel, jakie były kryteria sukcesu, co zostało dostarczone, co pozostało poza zakresem i jakie ograniczenia nadal obowiązują.

To jest szczególnie ważne przy pracy z AI, bo model nie powinien być jedynym miejscem, w którym istnieje wiedza o projekcie. Jeśli decyzja znajduje się tylko w historii jednego czatu, jest trudna do odzyskania, ponownego użycia i zweryfikowania. Artefakty projektu stają się wspólną pamięcią dla człowieka, AI i przyszłych uczestników zespołu.

## 5. Czy to jest Waterfall?

Początkowo duża ilość pracy przed implementacją wydawała mi się krokiem wstecz. Jako osoba z zamiłowaniem do chaosu, a przynajmniej do zwinności, miałem wrażenie, że wracamy do Waterfallu: najpierw dużo dokumentacji, planów i architektury, a dopiero potem kod.

Po przejściu przez projekt oceniam to inaczej. Nie jest to klasyczny Waterfall, jeśli dokumenty są traktowane jako żywe artefakty, decyzje mogą być korygowane, a implementacja odbywa się w małych pionowych slice’ach z regularną weryfikacją.

To raczej połączenie upfront architecture z iteracyjnym delivery. Na początku trzeba wykonać pracę, która jest mniej przyjemna i mniej widoczna: zrozumieć problem, granice danych, auth, ryzyka, architekturę i sposób testowania. Później jednak ta praca redukuje liczbę powrotów do podstaw i pozwala skupić się na dowożeniu funkcjonalności.

W przypadku KeepInTouch miało to szczególny sens, ponieważ z góry adresowaliśmy takie tematy jak:

- czy dane są lokalne czy zdalne;
- jak identyfikujemy właściciela danych;
- co oznacza izolacja między użytkownikami;
- co dzieje się po błędzie ekstrakcji;
- jakie dane wolno przesyłać do modelu;
- jak ograniczyć odpowiedź modelu;
- które elementy są MVP, a które pozostają w roadmapie;
- jakie ryzyka sprawdzamy testami.

Kiedy te decyzje były już ustalone, późniejsze implementowanie funkcji było znacznie prostsze. Nie musieliśmy za każdym razem ponownie rozstrzygać, czym jest core aplikacji.

## 6. Architektura i rozeznanie w nowym projekcie

Wartościową częścią kursu jest potraktowanie architektury nie jako jednego dokumentu z diagramem, ale jako procesu rozpoznania systemu.

Przed zmianą należy zorientować się w:

- strukturze katalogów;
- granicach między UI, domeną, API i storage’em;
- istniejących kontraktach danych;
- sposobie uwierzytelniania;
- testach i ich rzeczywistym zakresie;
- konfiguracji builda i deploymentu;
- historii wcześniejszych decyzji;
- ograniczeniach, które trzeba zachować.

Istotne jest też to, jak to rozeznanie jest wykonywane. Nie chodzi o przekazanie całego repozytorium do jednego kontekstu AI. Research dzieli się na mniejsze obszary, może być wykonywany równolegle, a wynik jest syntezowany z odwołaniami do konkretnych plików i linii.

To pozwala poznać nowy projekt bez niekontrolowanego zużywania kontekstu. AI nie musi pamiętać całej aplikacji naraz. Wystarczy, że ma aktualny artefakt researchu i może wrócić do właściwego pliku wtedy, gdy konkretna zmiana tego wymaga.

Dla PM-a jest to ważne, ponieważ architektura przestaje być czarną skrzynką. Nie trzeba znać każdego szczegółu implementacji, żeby rozumieć najważniejsze granice i konsekwencje decyzji.

## 7. Harness — czym jest w praktyce

Harness można rozumieć jako całe środowisko pracy AI nad projektem. Nie jest to sam model.

Na harness składają się między innymi:

- instrukcje repozytorium, takie jak `AGENTS.md`;
- skille określające sposób prowadzenia konkretnych etapów;
- struktura katalogów i nazwy artefaktów;
- dostęp do repozytorium, terminala, testów i narzędzi;
- pamięć wcześniejszych decyzji;
- plan i aktualny status zmiany;
- mechanizmy ręcznej akceptacji;
- testy, lint, typecheck, build i review;
- zasady commitowania i archiwizacji.

Harness określa, jaki kontekst AI dostaje, czego ma szukać, jakie działania może wykonać, co powinno zostać zweryfikowane i kiedy powinien zatrzymać się po decyzję człowieka.

Bez harnessu AI może świetnie wygenerować fragment kodu, ale niekoniecznie wie, czy pasuje on do architektury, czy nie łamie prywatności, czy wymaga migracji i czy zostało to w ogóle przetestowane.

Można powiedzieć, że model dostarcza zdolność wykonawczą, a harness dostarcza kontekst, pamięć, ograniczenia i pętlę jakości.

## 8. Przekazywanie odpowiedzialności AI

Współpraca z AI polega na delegowaniu pracy, a nie na delegowaniu odpowiedzialności.

AI może przejąć:

- analizę plików;
- przygotowanie researchu;
- przygotowanie planu;
- implementację;
- pisanie testów;
- refaktoryzację;
- weryfikację mechanicznych warunków;
- dokumentowanie wyników.

Człowiek powinien zachować odpowiedzialność za:

- wybór problemu;
- decyzje produktowe;
- zakres i priorytety;
- decyzje architektoniczne o istotnych konsekwencjach;
- zgodę na ryzyko;
- sekrety, deployment i działania zewnętrzne;
- ręczną akceptację UX;
- końcową ocenę, czy rozwiązanie rzeczywiście rozwiązuje problem.

W tym modelu AI działa bardziej jak bardzo szybki, szeroki technicznie członek zespołu niż jak autonomiczny właściciel produktu.

## 9. Co odróżnia to od vibe codingu

Vibe coding kojarzę z podejściem, w którym zaczynamy od generowania interfejsu, dokładamy kolejne fragmenty i oceniamy sukces po tym, czy coś da się kliknąć.

W tym projekcie sukces był definiowany szerzej:

- czy użytkownik jest uwierzytelniony;
- czy dane są właściwie odizolowane;
- czy błędy nie niszczą istniejącego stanu;
- czy kontrakty wejścia i wyjścia są ograniczone;
- czy testy pokrywają najważniejsze ryzyka;
- czy aplikacja buduje się i wdraża;
- czy można odtworzyć, dlaczego podjęto daną decyzję;
- czy zakres i ograniczenia są jawne.

Dlatego lepszym określeniem jest AI-assisted product engineering: AI pomaga budować, ale proces nadal wymaga framingu, specyfikacji, architektury, testów, review i akceptacji.

## 10. Perspektywa IT PM-a

Największą zmianą było dla mnie przesunięcie roli PM-a.

PM nie musi znać szczegółów każdej biblioteki ani samodzielnie implementować każdej funkcji. Musi natomiast potrafić:

- dobrze zdefiniować problem;
- odróżnić wymaganie od pomysłu na rozwiązanie;
- rozpoznać granice i ryzyka;
- podejmować świadome trade-offy;
- utrzymać spójny zakres;
- wymagać dowodów zamiast deklaracji;
- rozumieć, co faktycznie zostało dostarczone;
- zadać właściwe pytania o bezpieczeństwo, dane i skalowanie.

To sprawia, że PM może objąć większy fragment procesu niż wcześniej. Zamiast przekazywać wymagania do kilku wyspecjalizowanych osób i czekać na integrację ich pracy, może wspólnie z AI przeprowadzić cały przepływ od problemu do wdrożonego MVP.

## 11. Moja ocena własnej pracy z AI

Z perspektywy historii projektu widzę u siebie kilka mocnych stron.

Jestem nastawiony na rezultat i czas. Często wracam do pytania, jaki jest najmniejszy użyteczny dowód, że dana funkcja ma sens.

Nie oddaję AI decyzji produktowych bez dyskusji. Pytam o konsekwencje, kwestionuję framing i próbuję rozdzielić obserwowany problem od proponowanego rozwiązania.

Mam też naturalną skłonność do zawężania zakresu, nawet jeśli czasami początkowo ciągnie mnie do dodatkowych pomysłów. W projekcie świadomie odłożone zostały między innymi synchronizacja między urządzeniami, voice notes, automatyczna ekstrakcja, rozbudowane zarządzanie wykluczonymi tematami i część funkcji rekomendacji.

Doceniam też uczciwość dowodów. Nie chcę nazywać czegoś ukończonym tylko dlatego, że wygląda dobrze w UI. Ważne jest dla mnie, czy zostało to przetestowane, czy istnieją ograniczenia i czy jakaś część wymaga jeszcze ręcznej akceptacji.

Moja rola w projekcie nie była rolą klasycznego developera. Była bliższa roli product/technical lead: podejmowałem decyzje dotyczące problemu, zakresu, ryzyka i akceptacji, a AI pomagało mi realizować techniczną część tych decyzji.

## 12. Ograniczenia i zastrzeżenia

Nie jestem w stanie na podstawie tego projektu ocenić, jak aplikacja zachowywałaby się przy dużej skali. Nie wiem, jakie problemy pojawiłyby się przy większej liczbie użytkowników, większym obciążeniu albo rozbudowie danych.

Produkt jest celowo browser-local. Nie ma synchronizacji między urządzeniami, backupu, eksportu ani pełnego mechanizmu odzyskiwania danych. To jest spójny wybór dla MVP, ale ogranicza dojrzałość produktu jako rozwiązania docelowego.

Automatyczne testy wykorzystują syntetyczny seam i nie zastępują pełnego, ciągłego testowania realnych magic links, produkcyjnych cookies, sekretów i zachowania wszystkich usług zewnętrznych.

Część bezpieczeństwa i infrastruktury została oddelegowana do dostawców, takich jak Cloudflare, Supabase i OpenRouter. Nie oznacza to automatycznie, że dowolna customowa implementacja zachowałaby taki sam poziom bezpieczeństwa. Jeśli system wymagałby własnej infrastruktury, należałoby osobno ocenić model zagrożeń, zarządzanie sekretami, monitoring, backupy, rate limiting, izolację danych i proces reagowania na incydenty.

Nie należy też mylić działającego MVP z produktem gotowym na każdy scenariusz. KeepInTouch jest dojrzałym, ryzyko-świadomym MVP, ale nie jest jeszcze dojrzałym produktem o pełnej odporności operacyjnej.

## 13. Czy dokumentacja i spec-driven development są wartościowe?

Podejście w KeepInTouch kojarzy mi się ze spec-driven development albo szerzej: plan-and-artifact-driven development. Nie rozstrzygam tutaj, czy należy przypisywać je konkretnie Amazonowi. Istotna jest sama idea: budujemy na podstawie specyfikacji, planu, kontraktów i sprawdzalnych artefaktów, a nie tylko na podstawie kolejnych promptów.

Z perspektywy PM-a ma to dużą wartość, bo artefakty dają wspólny obraz stanu projektu. Nie muszę pamiętać całej historii rozmów. Mogę sprawdzić PRD, roadmapę, plan, status, test plan i review.

To zmniejsza zależność od pojedynczych osób i pojedynczych sesji AI. Nowy członek zespołu albo nowy agent może wejść w projekt przez aktualne artefakty, zamiast rekonstruować wszystko z nieuporządkowanej historii.

Dokumentacja działa też jako mechanizm kontroli odpowiedzialności. Można sprawdzić, czy dana decyzja była podjęta, czy tylko zasugerowana; czy test został wykonany, czy jedynie zaplanowany; czy dana funkcja jest w zakresie, czy została odłożona.

W projektach, w których dokumentacja bywa różnej jakości, takie podejście automatycznie tworzy ślad decyzji i aktualny inwentarz tego, co faktycznie mamy. Dla PM-a jest to dużo bardziej wartościowe niż sama liczba commitów albo ekranów w aplikacji.

Nie oznacza to, że każdy projekt potrzebuje rozbudowanej dokumentacji. Przy małym bugfixie byłaby przesadą. Przy aplikacji z autoryzacją, danymi użytkownika, AI, prywatnością i deploymentem staje się jednak praktycznym narzędziem redukcji ryzyka.

## 14. Najważniejsze zastrzeżenie do samego procesu

Proces może stać się zbyt ciężki. Można zacząć produkować dokumenty, statusy i foldery zamiast dostarczać wartość.

Dlatego skille powinny być traktowane jako guardraile, a nie jako religia procesu. Nie każda zmiana wymaga pełnego framingu, researchu, planu i review. Wartość pojawia się wtedy, gdy poziom ceremonii jest proporcjonalny do ryzyka i złożoności.

Najlepszy model to nie „zawsze dużo dokumentacji”, ale „wystarczająco dużo dokumentacji, żeby decyzje były zrozumiałe, odwracalne lub świadomie zaakceptowane”.

## 15. Potencjalna teza na spotkanie

> AI nie sprawiło, że przestałem potrzebować procesu. Sprawiło, że mogłem samodzielnie przejść przez proces, który wcześniej wymagałby kilku wyspecjalizowanych osób.

> Największą wartością kursu nie było to, że AI pisało kod. Największą wartością było to, że skille pilnowały, abyśmy nie zgubili problemu, architektury, zakresu, testów, dowodów i historii decyzji.

> Dokumentacja nie była tylko formalnością. Stała się pamięcią projektu i sposobem na to, żeby automatycznie wiedzieć, co naprawdę mamy.

> Dla PM-a najważniejsza zmiana polega na przejściu od korzystania z AI do pisania pojedynczych fragmentów kodu do świadomego zarządzania całym systemem dostarczania produktu.

## 16. Pytania, które warto zostawić otwarte

- Gdzie kończy się bezpieczne delegowanie odpowiedzialności AI?
- Jak zmienia się ten proces przy większym zespole i wielu równoległych agentach?
- Ile dokumentacji jest optymalne dla małej, średniej i dużej zmiany?
- Jak skutecznie wykrywać rozjazd między żywym kodem a foundation docs?
- Jak wyglądałby pełny audyt bezpieczeństwa aplikacji z customową infrastrukturą?
- Jak sprawdzać skalowalność bez budowania od razu systemu o skali enterprise?
- Które elementy powinny pozostać w rękach człowieka nawet przy bardziej autonomicznym AI?
- Czy proces pozostaje efektywny, gdy trzeba obsługiwać wiele produktów, zespołów i repozytoriów?

## 17. Opcjonalna refleksja o współpracy

Cennym doświadczeniem było również zapytanie AI na koniec, jak wyglądała współpraca ze mną. Dzięki temu ocena nie dotyczyła wyłącznie kodu i aplikacji, ale także sposobu podejmowania decyzji, komunikacji i korzystania z narzędzi.

Z perspektywy AI moja praca przypominała raczej pracę product/technical leada niż osoby, która tylko zleca zadania. Byłem nastawiony na rezultat, pilnowałem zakresu, kwestionowałem założenia, wymagałem dowodów i zachowywałem kontrolę nad decyzjami o większych konsekwencjach.

Ta refleksja może być osobną częścią spotkania albo warto ją pominąć, jeśli wypowiedź ma dotyczyć przede wszystkim kursu i metodyki.
