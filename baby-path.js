/* The Baby path: stages and exercises. First slice: Stages 0 to 2.
   Each exercise: id, title, mins, work (no instrument needed), do (steps), goal, checks (yes/no), widget (what to show), real (tunes to hear for real). */
const BABY_PATH = {
  stages: [
    {
      id: 0, title: 'Feel', blurb: 'A baby hears the beat and the shape of speech long before words.',
      expect: ['Feel beats 2 and 4 without a recording.', 'Know where each tune starts over and where its sections change.', 'Say the rhythm of each word on “da”.'],
      notyet: 'Singing notes. That starts in Stage 1.',
      checkin: [
        'I can feel beats 2 and 4 without a recording.',
        'I know where each tune starts over without looking at a chart.'
      ],
      exercises: [
        {
          id: '0.0', title: 'Pick your three recordings', mins: 5, work: true,
          do: [
            'Pick one recording of each tune: Pent-Up House (Rollins), Billie’s Bounce (Parker), There Will Never Be Another You (Baker).',
            'Put them on your phone. These are your three voices for the next weeks.',
            'Play them while you work, walk or cook. Just let them play. You do not need to do anything.'
          ],
          goal: 'You have three recordings ready, so listening is always one tap away.',
          checks: [
            'I picked one recording of each tune.',
            'They are on my phone and I can start them in one tap.'
          ],
          widget: { k: 'recs' }
        },
        {
          id: '0.1', title: 'Walk the pulse', mins: 9, work: true,
          do: [
            'Press play. Snap or tap on beats 2 and 4 for one whole round.',
            'Then step the beat with your feet for one more round.',
            'Do this for each tune. Try a slower and a faster tempo too.',
            'Turn on “Drop out”. The music goes silent for 4 bars. Keep going. Come back in when it returns.'
          ],
          goal: 'Your body keeps the swing pulse by itself, at three different tempos.',
          checks: [
            'I stayed on 2 and 4 for a whole round of each tune.',
            'I can say which tune is fastest and which is slowest.',
            'I kept the pulse while the music was silent for 4 bars, and came back in together.'
          ],
          widget: { k: 'tune', tune: 'pent', pick: true, layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['pent', 'bounce', 'twnbay']
        },
        {
          id: '0.2', title: 'Count the sentences', mins: 8, work: true,
          do: [
            'Listen and count in groups of 4 bars. Say “new” out loud on the first beat of each group.',
            'First with the group markers visible. Then hide them and do it by ear.',
            'Pent-Up House has 16 bars (4 groups). Billie’s Bounce has 12 (3 groups). There Will Never has 32 bars (A, B, A, C, with 8 bars each).'
          ],
          goal: 'You feel where each tune starts over and where its sections change.',
          checks: [
            'I said “new” on the right beat in each tune for a whole round.',
            'In There Will Never, I can tell the B section (bar 9) from the A sections without counting.',
            'I know where each tune starts over without looking at a chart.'
          ],
          widget: { k: 'tune', tune: 'pent', pick: true, layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'groups'], chart: 'bars', groups: true },
          real: ['pent', 'bounce', 'twnbay']
        },
        {
          id: '0.3', title: 'Speak the rhythm', mins: 8, work: true,
          do: [
            'Press play and say the rhythm out loud on “da”. Keep it swung.',
            'Do it three times in a row without stopping or rushing.',
            'No notes yet. Only the rhythm.'
          ],
          goal: 'The rhythm is already in your mouth, so the notes land on something you know.',
          checks: [
            'I can say each rhythm three times in a row without stopping or speeding up.',
            'I can tap one rhythm while saying another one’s “da”s in my head.',
            'I said them on top of the pulse, not just on my own.'
          ],
          widget: { k: 'rhythm' },
          real: ['pent', 'bounce', 'twnbay']
        }
      ]
    },
    {
      id: 1, title: 'Sounds', blurb: 'Babies learn the sounds of their language before words. Your sounds: home, the home triad, the away triad and one blue note.',
      expect: ['Sing 1 (home) from silence and land close to it.', 'Know whether you are at home (1 3 5) or away (5 7 2).', 'Sing the blue ♭3 and tell it from the bright 3.'],
      notyet: 'Naming chord tones (root, 3rd, 5th, 7th). That starts in Stage 5.',
      checkin: [
        'I can sing 1 from silence and land close to it.',
        'I can tell home from away (1 3 5 or 5 7 2) before I think about it.'
      ],
      exercises: [
        {
          id: '1.1', title: 'Home note', mins: 8, work: false,
          do: [
            'Turn on the drone. Sing 1 (the drone note) and hold it for 10 seconds. Find it on your instrument.',
            'Then press “Test me”. It plays a chord in another key. Wait. Sing 1 from memory. Press “Check” to hear the real 1.'
          ],
          goal: '1 feels like home in your body, even when nothing is playing.',
          checks: [
            'I sang 1 from silence and found it within a half step, 4 times out of 5.',
            'I can hum 1 over a 5⁷ (the 5 chord) and feel that it wants to go home.',
            'I can sing 1, stop for 5 seconds, and come back to the same note.'
          ],
          widget: { k: 'homenote' }
        },
        {
          id: '1.2', title: 'The home triad (1 3 5)', mins: 8, work: false,
          do: [
            'Play the chord first. Then sing 1 3 5 up and down, slowly.',
            'Then sing each note alone. Then in random order.',
            'Press “Random note”. Sing it. Say 1, 3 or 5. Then reveal.'
          ],
          goal: 'You hear 1 3 5 as one sound with three parts.',
          checks: [
            'I can sing 1 3 5 up and down in tune without the instrument.',
            'I can start on 3 or on 5 and sing the triad from there.',
            'I can say which note I am singing (1, 3 or 5) before checking.'
          ],
          widget: { k: 'triad' }
        },
        {
          id: '1.3', title: 'The away triad (5 7 2)', mins: 8, work: false,
          do: [
            'Play the 1 chord, then the 5 chord. Go back and forth.',
            'Sing 5 7 2 up and down. Notice that 5 belongs to both chords.',
            'Hold 5 and listen: the same note feels different when the chord underneath changes.'
          ],
          goal: 'You hear 5 7 2 as away from home and 1 3 5 as home.',
          checks: [
            'I can sing 5 7 2 up and down without the instrument.',
            'After hearing the 1 chord, I can sing 5, then 7, then 2.',
            'I can hold 5 and feel it change meaning when the chord changes from the 1 chord to the 5 chord.'
          ],
          widget: { k: 'away' }
        },
        {
          id: '1.4', title: 'Home or away?', mins: 8, work: false,
          do: [
            'Press “Next”. A triad plays cold. Say “home” or “away” out loud before you tap.',
            'Then sing the triad back, before you look at the answer.',
            'For more of the same, Triad Home Base in the Lab works too.'
          ],
          goal: 'You know home from away instantly, with no thinking.',
          checks: [
            'I got 9 out of 10 right, two rounds in a row.',
            'I sang the triad back (not just named it) before checking.',
            'I can do it slower and faster without it falling apart.'
          ],
          widget: { k: 'homeaway' }
        },
        {
          id: '1.5', title: 'The blue third', mins: 8, work: false,
          do: [
            'Over the drone, sing 3 (bright). Then ♭3 (blue). Then slide from ♭3 up to 3.',
            'Do the same over a 1⁷ chord. Hear how the blue note rubs against the chord.',
            'Then sing the Pent-Up House riff shape: 5 3, 5 ♭3, 5 3.'
          ],
          goal: 'You hear and sing the bright third and the blue third. The Pent-Up House riff and Billie’s Bounce both use it.',
          checks: [
            'I can sing 3 and then ♭3 on demand over the drone.',
            'When I hear two notes, I can tell which one is the blue one.',
            'I can sing the riff shape 5 3, 5 ♭3, 5 3 (numbers only).'
          ],
          widget: { k: 'blue' },
          real: ['pent']
        }
      ]
    },
    {
      id: 2, title: 'The floor', blurb: 'The bass is the floor of the house. If you can sing it, you always know where you are.',
      expect: ['Sing the bass numbers of each tune, relative to home, as a shape.', 'Hear the bass (2 5 1) under the tune.', 'Know where you are in the form without a chart.'],
      notyet: 'Naming chord tones (root, 3rd, 5th, 7th). That starts in Stage 5.',
      checkin: [
        'I can sing the bass notes of a tune without the chart.',
        'I notice that 2 5 1 shows up in more than one tune.'
      ],
      exercises: [
        {
          id: '2.1', title: 'Pent-Up House floor', mins: 10, work: true,
          do: [
            'Press play. Sing the bass number of each bar: 2 5 1 1, 2 5 1 1, 5 1 4 ♭7, 2 5 1 1.',
            'First hum along while looking at the chart. Then hide the chart and close your eyes.',
            'Notice that most steps go up a fourth (2 to 5, 5 to 1). Bars 9 to 12 (5 1 4 ♭7) are all the same kind of step.',
            'Try “Start at bar”: pick a bar and jump in.'
          ],
          goal: 'You can sing the whole 16-bar floor without the chart.',
          checks: [
            'I sang all 16 bass numbers in tune with the music, eyes closed.',
            'I can sing bars 9 to 12 (5 1 4 ♭7) and hear that each step is the same kind of step.',
            'I can start the floor from any bar when someone names it.'
          ],
          widget: { k: 'tune', tune: 'pent', layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'startbar', 'reveal'], chart: 'roots' },
          real: ['pent']
        },
        {
          id: '2.2', title: 'Billie’s Bounce floor', mins: 10, work: true,
          do: [
            'Press play. Sing the bass numbers: 1 4 1 (5 1), 4 ♯4 1 (3 6), 2 5 (1 6) (2 5).',
            'Bars in brackets have two numbers. Look at bars 9 to 11 of Bounce: 2 5 1. That is the same trip as Pent-Up House.',
            'Hide the chart. Sing it with your eyes closed.'
          ],
          goal: 'You hear the blues floor, and you hear that 2 5 1 appears in two of your tunes.',
          checks: [
            'I sang all 12 bars of bass numbers in order, eyes closed.',
            'I can hear the ♯4 in bar 6 as a small step up to 5, then down to 1.',
            'I can say which bars of Bounce share the same 2 5 1 trip as Pent-Up House.'
          ],
          widget: { k: 'tune', tune: 'bounce', layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'startbar', 'reveal'], chart: 'roots' },
          real: ['bounce']
        },
        {
          id: '2.3', title: 'There Will Never Be Another You, A section', mins: 10, work: true,
          do: [
            'Press play. Sing the bass numbers of bars 1 to 8: 1 1 7 3 6 6 5 1.',
            'Notice the trip: stay home, step through 7 and 3, rest on 6, then 5 to 1 goes home.',
            'Hide the chart. Sing it with your eyes closed.'
          ],
          goal: 'You hear the first eight bars as a trip that ends back at home.',
          checks: [
            'I sang the eight bass numbers in tune without the chart.',
            'I can hear 3 to 6 as a fourth, the same step as 2 to 5.',
            'I can hear bar 8 (5, 1) arrive home and feel it as arriving.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [1, 8], layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'reveal'], chart: 'roots' },
          real: ['twnbay']
        },
        {
          id: '2.4', title: 'There Will Never Be Another You, B and C sections', mins: 12, work: true,
          do: [
            'B section bass numbers: 4 ♭7 1 6 2 2 2 5.',
            'C section bass numbers: 4 ♭7 1, ♯4 7, 1 4, 3 6, 2 5, 1 5.',
            'Do one section per sitting. Then try all four chunks in order (A, B, A, C).'
          ],
          goal: 'You can sing the whole 32-bar floor in four chunks of eight bars.',
          checks: [
            'I sang the B section’s eight bass numbers in tune, eyes closed.',
            'I sang the C section, including the pairs in bars 28 to 32.',
            'I can sing all four chunks in order (A, B, A, C) without stopping.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [9, 16], pick: 'sections', layers: { mel: false, chd: true, bass: true, pulse: true }, controls: ['tempo', 'sections', 'reveal'], chart: 'roots' },
          real: ['twnbay']
        }
      ]
    },
    {
      id: 3, title: 'First words', blurb: 'One tiny phrase from each tune, taken straight from the heads. These are your first words. Learn each one: listen, sing, find, play. Spend two or three days per word, not one evening.',
      expect: ['Sing the numbers of a word, relative to home, as a shape.', 'Know whether you are at home (1 3 5) or away (5 7 2).', 'Hear the bass (2 5 1) under the tune.'],
      notyet: 'Naming chord tones (root, 3rd, 5th, 7th). That starts in Stage 5.',
      checkin: [
        'I can sing all three words cold, with no recording and no chart.',
        'I can start a word on a different number and keep its shape.'
      ],
      exercises: [
        {
          id: '3.1', title: 'Pent-Up House: the riff', mins: 15, work: true,
          do: [
            'The word, over bars 1 and 2 (2m⁷, 5⁷): 5 3, rest, 5 ♭3, rest, 5 3. Press play and listen 10 times, melody on, eyes closed.',
            'Sing it on “da” with the swung rhythm from 0.3. Then sing it as numbers: five three, five flat-three, five three.',
            'Find it on your instrument by ear. Look at the numbers only if you are stuck for more than a minute.',
            'Play it over the drone, then over 2m⁷, then over 5⁷. Hear how the same notes change meaning.',
            'Cold test: turn off the sound, sing it, then press play to check yourself.'
          ],
          goal: 'You can say the riff as one gesture and hear the 3 turn into the ♭3.',
          checks: [
            'I sang the riff in time, three times in a row, without the instrument.',
            'I played it by ear and my version matches the recording.',
            'I can play it starting on a different number (starting on 2, for example), keeping the same shape.',
            'I can hear the 3 and the ♭3 every time.'
          ],
          widget: { k: 'tune', tune: 'pent', range: [1, 2], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo'], chart: 'bars' },
          real: ['pent']
        },
        {
          id: '3.2', title: 'Billie’s Bounce: the first bar', mins: 15, work: true,
          do: [
            'The word, over 1⁷ (bar 1): ♯4 5, 1, ♯2 3, 1, ♭7 1. Listen 10 times.',
            'Sing only the skeleton first: 5 1 3 1 ♭7 1. That is the home triad plus the flat seventh.',
            'Add the two little slides: ♯4 up into 5, and ♯2 up into 3.',
            'Find it on your instrument, then play it over the drone and over a 1⁷ chord.',
            'Cold test: sing the whole bar with no sound, then check.'
          ],
          goal: 'You hear the home triad with chromatic slides leading into two of its notes.',
          checks: [
            'I can sing the skeleton (5 1 3 1 ♭7 1) before adding the slides.',
            'I can sing the whole bar in time with the slides.',
            'I played it by ear and it matches the recording.',
            'I can say which two numbers the slides lead into (5 and 3).'
          ],
          widget: { k: 'tune', tune: 'bounce', range: [1, 1], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo'], chart: 'bars' },
          real: ['bounce']
        },
        {
          id: '3.3', title: 'There Will Never Be Another You: the climb', mins: 15, work: true,
          do: [
            'The word, over 1maj⁷: pickup 5, then 6 7 1 2, then 3 5 2 1. Listen 10 times (the pickup note sits just before bar 1).',
            'Sing it as one line on “da”, with the pickup leading in.',
            'Notice the three parts: a climb by step (6 7 1 2), a skip (3 to 5), then a step down home (2 to 1).',
            'Find it on your instrument and play it over the drone and over 1maj⁷.',
            'Cold test: sing the pickup and both bars with no sound, then check.'
          ],
          goal: 'You hear a climb, a skip and a landing, and you can sing them as one phrase.',
          checks: [
            'I sang the pickup and both bars in tune and in time.',
            'I played it by ear and it matches the recording.',
            'I can point to where the climb ends and where the skip begins.',
            'I can start the phrase from 5 or from 3 and keep the shape.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [1, 2], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo'], chart: 'bars' },
          real: ['twnbay']
        },
        {
          id: '3.4', title: 'Which word is which?', mins: 12, work: true,
          do: [
            'Press “Play a word”. Before you tap an answer, sing the next number you expect.',
            'Name the tune. Do not guess from the starting note: listen to the shape.',
            'Then sing all three words in a row from memory, in any order, with no sound.'
          ],
          goal: 'Each word belongs to its tune and you do not mix them up.',
          checks: [
            'I can sing all three words from memory, in any order.',
            'I named the tune for each word correctly, 7 times out of 10.',
            'I can sing each word slower and faster.'
          ],
          widget: { k: 'words' }
        }
      ]
    },
    {
      id: 4, title: 'The heads, in small pieces', blurb: 'The heads are your nursery rhymes. Every player knows them and every solo comes out of them. Learn each head in chunks of 4 bars. This stage is bigger than the others: do about one chunk a day, not all nine in one evening.',
      expect: ['Sing the numbers of a chunk, relative to home, as a shape.', 'Know whether you are at home (1 3 5) or away (5 7 2).', 'Hear the bass (2 5 1) under the tune.'],
      notyet: 'Naming chord tones (root, 3rd, 5th, 7th). That starts in Stage 5.',
      checkin: [
        'I can sing a whole head, in order, with no sound and no chart.',
        'I got through the silent drop-out bars and landed back in together.'
      ],
      exercises: [
        {
          id: '4.1', title: 'Pent-Up House, bars 1 to 4', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You can sing the opening chunk, from the pickup run through the riff to the landing, without the music.',
          checks: [
            'I sang bars 1 to 4 with no sound and matched the music afterwards.',
            'I can hear that bars 5 to 8 are the same as bars 1 to 4.',
            'I got through the drop-out bars and landed back in together.'
          ],
          widget: { k: 'tune', tune: 'pent', range: [1, 4], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['pent']
        },
        {
          id: '4.2', title: 'Pent-Up House, bars 9 to 12', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You hear that the middle chunk is the riff moved up a fourth, then walking down over the chords.',
          checks: [
            'I sang bars 9 to 12 with no sound.',
            'I can tell that the riff in bars 9 to 12 is the same shape as bars 1 to 4, moved up a fourth.',
            'I found it on my instrument and played it with the chords.'
          ],
          widget: { k: 'tune', tune: 'pent', range: [9, 12], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['pent']
        },
        {
          id: '4.3', title: 'Pent-Up House, the full head', mins: 15, work: true,
          do: [
            'Sing the full 16 bars in four chunks: 1 to 4, 5 to 8, 9 to 12, 13 to 16. Chunks 1 and 3 are the same riff in two places, and chunks 2 and 4 repeat chunk 1.',
            'Sing the whole head with no sound, then check against the music.',
            'Play it with the chords without stopping.',
            'Press “Drop out” and sing the silent bars. Then tap a bar and start from there.'
          ],
          goal: 'You can sing the whole 16-bar head from memory and play it with the chords.',
          checks: [
            'I sang the whole head, then played it with the chords, without stopping.',
            'I can start the head from bar 9 when I tap it.',
            'I got through the drop-out bars and landed back in together.'
          ],
          widget: { k: 'tune', tune: 'pent', range: [1, 16], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout', 'groups'], chart: 'bars' },
          real: ['pent']
        },
        {
          id: '4.4', title: 'Billie’s Bounce, bars 1 to 4', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You can sing the opening: the word from 3.2, a dropping figure, and the landing on 1.',
          checks: [
            'I sang bars 1 to 4 with no sound and matched the music afterwards.',
            'I can say where the opening lands (on 1, in bar 4).',
            'I got through the drop-out bars and landed back in together.'
          ],
          widget: { k: 'tune', tune: 'bounce', range: [1, 4], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['bounce']
        },
        {
          id: '4.5', title: 'Billie’s Bounce, bars 5 to 8', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You hear the middle chunk as the climb: it starts low on the IV chord and reaches the high point.',
          checks: [
            'I sang bars 5 to 8 with no sound.',
            'I can say where the head reaches its highest note.',
            'I found it on my instrument and played it with the chords.'
          ],
          widget: { k: 'tune', tune: 'bounce', range: [5, 8], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['bounce']
        },
        {
          id: '4.6', title: 'Billie’s Bounce, bars 9 to 12', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You hear the last chunk as the fall home, with the 2 5 1 trip underneath.',
          checks: [
            'I sang bars 9 to 12 with no sound.',
            'I sang all 12 bars in order, three chunks, without stopping.',
            'I played the whole head with the chords.'
          ],
          widget: { k: 'tune', tune: 'bounce', range: [9, 12], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout', 'groups'], chart: 'bars' },
          real: ['bounce']
        },
        {
          id: '4.7', title: 'There Will Never Be Another You, A section (bars 1 to 8)', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You can sing the first eight bars as two four-bar halves.',
          checks: [
            'I sang bars 1 to 4 with no sound, then bars 5 to 8.',
            'I can hear that the second half is the first half’s shape, moved.',
            'I got through the drop-out bars and landed back in together.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [1, 8], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['twnbay']
        },
        {
          id: '4.8', title: 'There Will Never Be Another You, B section (bars 9 to 16)', mins: 15, work: true,
          do: [
            'Listen to the chunk 5 times with the melody on, eyes closed.',
            'Sing it one bar at a time with the music, adding one bar each round. Sing on “da” or in numbers.',
            'Sing the whole chunk with no sound. Then check yourself against the music.',
            'Find it on your instrument by ear. Then play it with the chords.',
            'Drop-out test: turn on “Drop out”. Sing through the 4 silent bars in your head and land back in together.'
          ],
          goal: 'You can sing the second eight bars, which move to the IV and wander before coming back.',
          checks: [
            'I sang bars 9 to 12 with no sound, then bars 13 to 16.',
            'I can say which chords are the 4 and the 2 5 in this section.',
            'I found it on my instrument and played it with the chords.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [9, 16], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['twnbay']
        },
        {
          id: '4.9', title: 'There Will Never Be Another You, C section (bars 25 to 32)', mins: 15, work: true,
          do: [
            'Listen to bars 25 to 32 five times. Notice that bars 25 to 27 match bars 9 to 11, and bar 28 is different.',
            'Sing it one bar at a time with the music, then with no sound.',
            'Find it on your instrument by ear, then play it with the chords.',
            'Then play the whole tune: A, B, A, C. Use “Drop out” once, on the A section.'
          ],
          goal: 'You can sing the whole 32-bar head as four chunks of 8 bars.',
          checks: [
            'I can hear that bars 25 to 27 match bars 9 to 11, and bar 28 differs.',
            'I sang each 8-bar chunk with no sound.',
            'I sang the whole head in order (A, B, A, C) without stopping.'
          ],
          widget: { k: 'tune', tune: 'twnbay', range: [25, 32], layers: { mel: true, chd: true, bass: true, pulse: true }, controls: ['tempo', 'dropout'], chart: 'bars' },
          real: ['twnbay']
        }
      ]
    }
  ]
};
BABY_PATH.all = BABY_PATH.stages.flatMap(s => s.exercises.map(e => Object.assign(e, { stage: s.id })));
BABY_PATH.byId = Object.fromEntries(BABY_PATH.all.map(e => [e.id, e]));
