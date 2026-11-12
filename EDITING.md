# Website kaise badlein (bina code ke)

Site ke address ke aakhir mein `?edit` lagaiye, jaise:

```
https://aapki-site/?edit
```

Ek **Website Editor** khulega. Usme ye sab badal sakte hain:

| Section | Kya badlega |
|---|---|
| Dulha-dulhan, tareekh aur parents | naam, kiska naam pehle aaye, shaadi ki tareekh/muhurat, parents ki lines, hashtag |
| Illustrations aur backgrounds | darwaza, Ganpati (dono), invitation scene, couple scene, Thank You couple, RSVP couple, venue, aasmaan background, scratch card ki patti, laptop background |
| Events | har event ka naam, Marathi naam, samay, jagah, map link, vivaran, photo; naya event jodna/hatana/upar-neeche karna |
| Families | dono families ki heading, surname, parents, message, parivaar ki line, photo |
| Gallery photos | photos, caption; nayi photo jodna/hatana (kam se kam 3) |
| Venue aur travel | venue ka naam, shahar, pata, map link, note, "Getting there" cards |
| Contacts | naam, rishta, phone; naya contact jodna/hatana |
| Messages | Thank You message, footer ki aakhri line |

## Teen buttons

- **Preview**: naye tab mein site khulti hai aapke badlav ke saath. Ye sirf aapke browser mein dikhta hai.
- **Publish**: sab guests ke liye live. Iske liye Google Sheet juda hona chahiye aur Editor password chahiye (`backend/SETUP.md`, steps 6–8).
- **Download content.json**: ek settings file. Use project ke `public/` folder mein rakh ke site dobara deploy kijiye. Google Sheet ki zaroorat nahi.

## Photo badalna

"Photo chuno" dabaiye aur phone/computer se tasveer chuniye. Badi tasveer apne aap chhoti ho jaati hai (1600px tak).
Google Sheet judi ho to photo aapki Google Drive ke "Wedding site photos" folder mein jaati hai; warna settings file ke andar.
Kisi tasveer ka link (https://...) bhi daal sakte hain. "Pehle wali" dabane se original tasveer wapas aa jaati hai.

**Achhe result ke liye:** nayi tasveer purani jaisi shape ki ho (lambi ki jagah lambi, chaudi ki jagah chaudi).
RSVP couple ke liye transparent background wali PNG chahiye.

## Background music

`public/audio/bgm.mp3` naam se koi gaana rakhiye; site wahi bajayegi. Na ho to halka tanpura bajta hai.
