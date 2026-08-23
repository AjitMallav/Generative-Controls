type AxisVariants = Partial<Record<number, string>>;
type PromptVariants = Record<string, AxisVariants>;

const normalizePromptKey = (prompt: string) => prompt.replace(/\s+/g, ' ').trim();

const PROMPT_1 = normalizePromptKey(
  'Describe the chaotic energy of a packed night market in a bustling city.'
);
const PROMPT_2 = normalizePromptKey(
  'Describe a sudden thunderstorm hitting a quiet, open field during a hot afternoon.'
);
const PROMPT_3 = normalizePromptKey(
  'Write a brief, encouraging announcement message for a team channel celebrating a successful project launch.'
);
const PROMPT_4 = normalizePromptKey(
  'Write a brief, urgent Slack message asking teammates to hop onto a bridge call to fix a sudden production crash.'
);
const PROMPT_5 = normalizePromptKey(
  'Can you write me a message asking my professor to extend a deadline for a homework assignment.'
);
const PROMPT_6 = normalizePromptKey(
  'Write an email to my manager asking if they would be willing to write a recommendation letter for future product management roles.'
);
const PROMPT_7 = normalizePromptKey(
  'Write an email about how my security key was shipped to the wrong address, and how I would need to retreive a new one.'
);

const PRECOMPUTED_STEERING_VARIANTS: Record<string, PromptVariants> = {
  [PROMPT_1]: {
    Vivid: {
      [-50]: `The air is full of food smells: spicy peppercorns, sizzling pork belly, and grilled charcoal. The night market is loud and crowded, with little room for quiet.

Cobblestone streets are packed with people. A motorbike moves slowly through the crowd, its headlight cutting through smoke and noise. Neon signs for wings and hot pot glow above vendors, tourists, and people bargaining at the stalls.

A vendor's cart tips as a child pulls too hard, sending people laughing and stepping aside. Steam rises from noodle bowls, and the sounds of woks, music, engines, and overlapping conversations fill the street. The market feels busy, noisy, and alive.`,
      [-25]: `The air is thick with spice, sizzling pork belly, and grilled charcoal. It is a crowded, noisy place where silence feels out of reach.

Every stretch of cobblestone is busy. A motorbike threads through the crowd, its headlight cutting through smoke and shouting. Neon signs flicker above the stalls, coloring the faces of vendors, tourists, and people bargaining for food.

A vendor's cart tips as a child pulls too hard, setting off laughter and quick steps. Steam rises from bowls of noodles. Metal woks clatter, music thumps from behind a stall, and many conversations overlap at once. The night market moves with restless energy.`,
      [25]: `The air here is a thick, intoxicating stew: **spicy Sichuan peppercorns** prickling the tongue, **sizzling pork belly** sending glossy waves of steam into the humid night, and the sharp, smoky tang of **grilled charcoal** clinging to every breath. It's a sensory riot where silence feels almost impossible.

Every inch of cobblestone becomes a small stage for motion. A **motorbike weaves through the crowd like a silver needle**, its headlight carving a bright path through smoke, steam, and shouting. Above, neon signs flicker—*Crispy Wings*, *Szechuan Hot Pot*—washing the faces of haggling vendors and laughing tourists in purple, blue, and hot electric pink.

A vendor's cart tips as a child tugs too hard, setting off a **domino effect of laughter, spilled napkins, and scrambling feet**. Steam rises from bowls of noodles until the edges of the street blur. The rhythm is frantic: clattering woks, roaring voices, the *thump-thump-thump* of a hidden speaker, and conversations colliding from every direction. Here, order dissolves into bright, unfiltered life.`,
      [50]: `The air here is a dense, intoxicating stew: **Sichuan peppercorns** sparking like static on the tongue, **pork belly** snapping and hissing on metal grills, and **charcoal smoke** curling through the humid night in bitter black ribbons. Silence is not merely absent here; it has been swallowed whole.

Every inch of cobblestone erupts into motion. A **motorbike slices through the crowd like a silver needle through fabric**, its headlight flashing through smoke, steam, and shouting faces. Above, neon signs stutter and flare—*Crispy Wings*, *Szechuan Hot Pot*—painting the market in bruised purple, electric blue, and feverish red.

A vendor's cart tilts sharply as a child pulls too hard, sending sauce cups rattling and triggering a **cascade of laughter, flailing hands, and scrambling feet**. Steam billows from noodle bowls until people seem to appear and vanish inside it. The rhythm is relentless: woks crashing, engines coughing, bass pounding from a hidden speaker, and a thousand voices colliding into one wild, multilingual roar. Here, order does not simply dissolve; it burns away into pure, pulsing life.`,
    },
    Sensational: {
      [-50]: `The night market is crowded and energetic. The air smells of peppercorns, pork belly, and charcoal, while vendors call out from their stalls.

Cobblestone paths are full of people. A motorbike moves through the crowd, and neon signs for wings and hot pot shine over vendors and tourists. People bargain, laugh, and move from one stall to another.

A vendor's cart tips slightly as a child pulls at it, causing a brief burst of laughter. Steam rises from bowls of noodles. The sounds of woks, music, and conversation fill the market, giving it a lively but manageable rhythm.`,
      [-25]: `The air is thick with peppercorns, sizzling pork belly, and grilled charcoal. The market is loud and crowded, but the energy remains lively rather than overwhelming.

Cobblestone streets are full of movement. A motorbike weaves through the crowd, and neon signs flicker above stalls selling wings and hot pot. Vendors bargain with customers while tourists laugh and move through the smoke.

A vendor's cart tips as a child pulls too hard, causing people nearby to laugh and step aside. Steam rises from noodle bowls. Woks clatter, music thumps from behind a stall, and many conversations overlap into a busy nighttime rhythm.`,
      [25]: `The air here is an overpowering stew: **Sichuan peppercorns** sting the tongue, **pork belly** snaps and spits on hot metal, and **charcoal smoke** cuts sharply through the humid night. It is a sensory riot where silence has no place to survive.

Every inch of cobblestone pulses with chaos. A **motorbike weaves through the crowd like a silver needle**, its headlight slicing through smoke, steam, and shouting. Neon signs flicker above—*Crispy Wings*, *Szechuan Hot Pot*—throwing garish purple and electric blue over vendors, tourists, and hands waving money in the air.

A vendor's cart tips as a child tugs too hard, setting off a burst of laughter, stumbling feet, and startled shouts. Steam surges from noodle bowls, blurring faces as they pass. The rhythm is frantic: metal woks clanging, engines growling, bass thumping behind a stall, and a thousand voices crashing into one another. Here, order dissolves into noise, heat, and appetite.`,
      [50]: `The air is almost violent: **Sichuan peppercorns** bite, **pork belly** hisses, oil spits, and **charcoal smoke** scrapes the throat in the humid night. The market is not just loud; it attacks every sense at once.

Every inch of cobblestone thrashes with motion. A **motorbike needles through the crowd**, horn barking, headlight flashing through smoke and shouting. Neon signs strobe—*Crispy Wings*, *Szechuan Hot Pot*—drenching vendors, tourists, and bargaining hands in purple, blue, and harsh electric glare.

A vendor's cart tips, bowls rattle, a child yelps, and the crowd bursts into a wave of laughter and scrambling bodies. Steam blinds passersby as noodles are lifted from boiling broth. Woks crash, engines snarl, speakers pound, vendors shout, tourists laugh, and languages collide until the market becomes one immense, feverish roar. Here, order is devoured by heat, sound, and hunger.`,
    },
    Atmosphere: {
      [-50]: `The night market is crowded and active. The air smells of peppercorns, pork belly, and charcoal, and the street is filled with vendors, customers, and tourists.

Cobblestone paths run between food stalls. A motorbike moves through the crowd, and neon signs advertise wings and hot pot. People bargain, laugh, and carry bowls of noodles through the street.

A vendor's cart tips when a child pulls on it, causing people nearby to laugh and move aside. Woks clatter, music plays from behind a stall, and many conversations overlap. The market is busy and full of life.`,
      [-25]: `The air is thick with peppercorns, pork belly, and charcoal. The night market is crowded, noisy, and full of people moving between stalls.

Cobblestone streets hold vendors, tourists, and customers bargaining under neon signs. A motorbike weaves slowly through the crowd, its headlight passing through smoke and steam.

A vendor's cart tips when a child tugs too hard, and nearby people laugh and step back. Steam rises from noodle bowls. The sounds of woks, music, engines, and conversation create a lively street scene.`,
      [25]: `The air here hangs like a thick, intoxicating stew: **spicy Sichuan peppercorns**, **sizzling pork belly**, and the sharp tang of **grilled charcoal** folding together under the humid night. The market feels less like a street than a world of its own, where silence has been replaced by heat, smoke, and appetite.

Every inch of cobblestone becomes part of the scene. A **motorbike weaves through the crowd like a silver needle**, its headlight cutting through the fog of steam and shouting. Above, neon signs flicker—*Crispy Wings*, *Szechuan Hot Pot*—casting purple and electric blue across haggling vendors, laughing tourists, and faces half-lost in smoke.

A vendor's cart tips as a child tugs too hard, sending laughter and scrambling feet through the crowd. Steam rises from noodle bowls, blurring the edges of the street. The clatter of woks, the roar of voices, the hidden beat of a DJ speaker, and the overlap of languages create a restless nighttime atmosphere where order dissolves into pure, unfiltered life.`,
      [50]: `The air here feels almost enchanted, a thick, intoxicating stew of **Sichuan peppercorns**, **sizzling pork belly**, and **charcoal smoke** drifting through the humid night. The market glows like a city dreaming with its eyes open, too alive for silence to enter.

Every cobblestone seems lit from within by motion. A **motorbike weaves through the crowd like a silver needle**, its headlight vanishing and reappearing in the fog of smoke and voices. Above, neon signs flicker—*Crispy Wings*, *Szechuan Hot Pot*—washing vendors, tourists, and haggling hands in garish purple and electric blue.

A vendor's cart tips as a child tugs too hard, and laughter ripples outward through the crowd. Steam rises from noodle bowls until the market seems to breathe in clouds. Woks clatter, bass pulses behind a stall, engines mutter, and a thousand languages overlap in a chaotic symphony. Here, order dissolves into a glowing, feverish atmosphere of hunger, movement, and life.`,
    },
  },
  [PROMPT_2]: {
    Vividness: {
      [-50]: `The air is hot and still over the open field. Dry grass stretches under the afternoon sun, and a cicada buzzes in the silence.

Then the sky darkens.

Clouds move in quickly, the air cools, and the wind begins to rise. Thunder sounds in the distance before the first drops of rain hit the dry ground.

Lightning flashes, followed by a loud crack of thunder. The wind bends the grass, and heavy rain begins to fall across the field.

Soon the ground turns muddy, the horizon disappears behind rain, and the quiet afternoon is replaced by the noise of the storm.`,
      [-25]: `The air hangs hot and still, smelling of dust and sun as heat shimmers above the golden grass. A lone cicada buzzes through the silence.

Then the sky changes.

The blue overhead darkens into purple-gray. The pressure drops, the heat fades, and a cool wind moves across the field. A distant rumble vibrates through the ground before rain begins to strike the dry earth.

Lightning flashes, followed by a sharp crack of thunder. The wind tears through the grass, and heavy rain pours down. The field quickly becomes muddy and loud, filled with the smell of wet grass and ozone.`,
      [25]: `The air hangs heavy and still, smelling of dry dust, scorched grass, and sun-baked earth as heat waves ripple above the field. A lone cicada buzzes in an endless loop, its thin cry stretched across the oppressive silence.

Then, the sky shudders.

In a heartbeat, the clear blue dome fractures into bruised purple. The pressure drops like an invisible hand pressing down, stealing the breath from the air and chilling the sweat on your skin. The heat vanishes, replaced by a sharp, electric cold.

A distant rumble trembles through the soles of your boots before the first drops fall. They strike the dry earth in hard, staccato taps, kicking up dust like tiny bursts of smoke. Then the sky boils into black and gray.

Lightning tears the field open in a blinding white flash, followed by a crack that seems to split the afternoon in half. Wind roars through the grass, flattening it in wild waves. Then the heavens open, and rain crashes down in a blinding sheet, turning dust to mud and filling the air with wet grass, ozone, and the storm's metallic bite.`,
      [50]: `The air hangs heavy and airless, thick with dry dust, scorched grass, and the baked smell of sun-struck earth. Heat waves shimmer above the field until the golden grass appears to melt at the edges. A lone cicada drills its thin, endless buzz into the silence.

Then, the sky shudders.

In a heartbeat, the blue dome overhead ruptures into bruised purple and charcoal black. The pressure drops so violently it feels like the whole field has inhaled and forgotten how to breathe. Sweat chills on your skin. The heat vanishes, replaced by a cold, electric bite that raises gooseflesh.

A distant rumble rolls up through the soles of your boots before the first drops strike. They hit the dry earth like thrown gravel, sharp and staccato, bursting dust upward in tiny puffs. Then the sky twists into a violent vortex of black, gray, and greenish light.

Lightning detonates across the field, a blinding white seam ripping the world open. Thunder follows with a crack so huge it seems to split the horizon. Wind howls through the grass, flattening it in silver-green waves. Then rain hammers down in a solid, roaring sheet, churning the soil into mud and filling the air with ozone, wet grass, and the metallic taste of the storm's fury. The quiet field does not merely change; it is consumed.`,
    },
    Sensory: {
      [-50]: `The afternoon is hot and still over the field. The grass is dry, and a cicada buzzes in the quiet.

The sky darkens suddenly. The air cools, the wind rises, and thunder sounds in the distance. Rain begins to fall on the dry ground.

Lightning flashes, thunder cracks, and heavy rain moves across the field. The grass bends in the wind, and the ground turns muddy as the storm takes over.`,
      [-25]: `The air is hot and still, with the smell of dry dust and sun over the grass. A cicada buzzes in the quiet.

Then the sky darkens. The pressure drops, the heat fades, and a cool wind moves across the field. Thunder rumbles before the first drops hit the ground.

Lightning flashes, and the wind grows stronger. Rain falls heavily, turning the field muddy and filling the air with the smell of wet grass.`,
      [25]: `The air hangs heavy and still, smelling of dry dust, baked grass, and scorching sun as heat shimmers off the field. A lone cicada buzzes in an endless loop, thin and sharp against the oppressive silence.

Then, the sky shudders.

The blue overhead fractures into bruised purple. The pressure drops hard, pressing against your chest, and the sweat on your skin turns cold. The heat vanishes, replaced by an electric chill that tastes faintly metallic.

A distant rumble vibrates through your boots before the first drops fall. They strike the dry earth with hard, staccato taps, releasing the smell of dust just before rain. The sky turns black and gray.

Lightning flashes white, and thunder cracks through the field. Wind tears through the tall grass with a dry hiss, then rain crashes down in a blinding sheet. Mud splashes, water pounds the grass flat, and the air fills with wet earth, ozone, and the storm's sharp metallic tang.`,
      [50]: `The air hangs heavy and suffocating, thick with dry dust, scorched grass, and the hot mineral smell of sun-baked earth. Heat wavers above the field, and a lone cicada saws at the silence until the sound feels lodged in your ears.

Then, the sky shudders.

The blue overhead bruises purple and black. The pressure drops so sharply your chest tightens, and sweat chills instantly on your skin. The heat disappears, replaced by a biting electric cold that tastes metallic on the tongue.

A distant rumble vibrates up through the soles of your boots before the first drops fall. They hit the dry ground like pistol shots, kicking dust into the air and releasing a sudden raw smell of earth. The sky churns into black and gray.

Lightning blinds the field. Thunder cracks so loudly it seems to rattle your bones. Wind lashes the grass into frantic waves, hissing and snapping through the stems. Then rain slams down in a solid sheet, soaking your clothes, splashing mud against your legs, and filling every breath with wet grass, ozone, and the storm's sharp electric bite.`,
    },
    Dissonance: {
      [-50]: `The air is hot and still over the open field, with dry grass stretching under the sun. A cicada buzzes in the quiet.

Clouds gather quickly, and the sky darkens. The air cools, the wind rises, and rain begins to fall. Thunder follows soon after.

The storm moves across the field, bringing heavy rain, wind, lightning, and mud. The quiet afternoon becomes stormy.`,
      [-25]: `The air hangs hot and still, smelling of dry dust and sun as heat shimmers above the grass. A cicada buzzes through the silence.

Then the weather shifts.

The blue sky darkens into purple-gray. The pressure drops, the heat fades, and a cool wind moves across the field. Thunder rumbles before rain begins to hit the dry ground.

Lightning flashes, followed by a sharp crack. Wind tears through the grass, and heavy rain turns the field to mud. The quiet afternoon gives way to the storm.`,
      [25]: `The air hangs heavy and still, smelling of dry dust and scorching sun as heat shimmers off the golden grass. A lone cicada buzzes in an endless loop, making the field feel almost too quiet.

Then, the sky shudders.

In a heartbeat, the calm breaks. The blue sky fractures into bruised purple, and the pressure drops so suddenly it feels wrong, as if the afternoon has been turned inside out. Sweat freezes on your skin where heat had been only seconds before.

A distant rumble vibrates through your boots before the first drops fall. They do not feel like rain at first, but like hard interruptions striking the dry earth. The sky erupts into black and gray.

Lightning splits the quiet apart, followed by thunder that seems far too large for the empty field. Wind tears through the grass, replacing stillness with violence. Then rain crashes down, turning silence into a roaring sheet of water. The field, once open and peaceful, becomes hostile and unrecognizable.`,
      [50]: `The air hangs heavy and still, smelling of dry dust and scorching sun as heat shimmers above the golden grass. A lone cicada buzzes in an endless loop, making the silence feel sealed and complete.

Then, the sky shudders.

In a heartbeat, the world contradicts itself. The clear blue dome fractures into bruised purple, the heat vanishes, and a cold electric pressure drops over the field like a lid. What had been open and quiet now feels trapped.

A distant rumble rises through your boots before the first drops strike the dry earth. They sound too sharp to be rain, like small impacts breaking the afternoon apart. The sky erupts into black and gray.

Lightning turns the field white, and thunder follows with a crack that seems impossible in so much empty space. Wind tears through the grass, transforming stillness into panic. Then the heavens open. Rain does not fall so much as attack, flattening the field and swallowing the horizon. The quiet afternoon becomes its opposite: a screaming, violent rupture where calm had been only moments before.`,
    },
  },
  [PROMPT_3]: {
    Formality: {
      [-50]: `🎉 **We did it!** 🚀

The launch was a huge success! Thanks for all the hard work, creativity, and teamwork that got us here.

Take a moment to celebrate this win—you all crushed it. Let’s keep the momentum going into the next one! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
      [-25]: `🎉 **Huge congrats, team!** 🚀

Our project launch was a big success! Thanks to everyone’s hard work, creativity, and collaboration, we pulled off something really special.

Take a moment to celebrate this win—it shows what this team can do together. Let’s keep the momentum going! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
      [25]: `🎉 **Congratulations, Team!** 🚀

Our recent project launch was a significant success. Thanks to your hard work, creativity, and collaboration, we have achieved an excellent outcome together.

Please take a moment to celebrate this win—it is a strong reflection of what this team can accomplish. Let’s continue this momentum as we move into our next challenge. Well done! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
      [50]: `🎉 **Congratulations to the Team** 🚀

Our recent project launch was a significant success. Your hard work, creativity, and collaboration were essential to achieving this outcome.

Please take a moment to recognize and celebrate this accomplishment. It is a clear testament to what this team can achieve together. Let us carry this momentum forward as we approach our next challenge. Excellent work.

#TeamSuccess #ProjectLaunch #WellDone`,
    },
    Enthusiasm: {
      [-50]: `**Congratulations**

Our recent project launch was successful. Thank you for the hard work, creativity, and collaboration that contributed to this outcome.

Please take a moment to recognize the achievement. It reflects the team’s effort and sets us up well for the next challenge.

#TeamSuccess #ProjectLaunch #WellDone`,
      [-25]: `🎉 **Congratulations!**

Our recent project launch was a success. Thanks to your hard work, creativity, and collaboration, we achieved a strong result.

Take a moment to appreciate this win—it reflects what the team can do together. Let’s keep the momentum going.

#TeamSuccess #ProjectLaunch #WellDone`,
      [25]: `🎉 **Huge, huge congratulations, team!** 🚀

Our recent project launch was a massive success! Thanks to your hard work, creativity, and collaboration, we’ve achieved something truly special.

Take a moment to really celebrate this win—it’s an exciting reminder of what this team can do together. Let’s keep this amazing momentum going and tackle the next challenge with the same energy. You did it! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
      [50]: `🎉 **HUGE Congratulations, Team!** 🚀✨

Our recent project launch was an incredible success! Thanks to your hard work, creativity, and collaboration, we’ve achieved something truly special and worth celebrating.

Please take a moment to enjoy this win—you earned it! This is a powerful reminder of what this team can accomplish together. Let’s keep this momentum going and bring the same energy to the next challenge. You absolutely crushed it! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
    },
    Tone: {
      [-50]: `**Project Launch Update**

Our recent project launch was successful. Thank you to everyone for the hard work, creativity, and collaboration that contributed to this result.

Please take a moment to acknowledge the win. It reflects the team’s collective effort and provides momentum for our next challenge.

#TeamSuccess #ProjectLaunch #WellDone`,
      [-25]: `🎉 **Congratulations!**

Our recent project launch was a success. Thank you for your hard work, creativity, and collaboration in making this happen.

Take a moment to celebrate the win—it reflects what this team can accomplish together. Let’s keep the momentum going for the next challenge.

#TeamSuccess #ProjectLaunch #WellDone`,
      [25]: `🎉 **Huge Congratulations, Team!** 🚀

Our recent project launch was a massive success! Thanks to your hard work, creativity, and collaboration, we’ve achieved something truly special together.

Take a moment to celebrate this win—it’s a meaningful reminder of what this team can do when we support each other and stay focused. Let’s keep the momentum going and bring that same spirit to our next challenge. You did it! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
      [50]: `🎉 **Huge Congratulations, Team!** 🚀

Our recent project launch was a massive success, and it is worth taking a real moment to celebrate. Thanks to your hard work, creativity, collaboration, and care for one another, we achieved something truly special.

This win is a testament not only to what this team can deliver, but to how we show up together. Let’s carry that momentum, confidence, and shared pride into the next challenge. You did it! 💪✨

#TeamSuccess #ProjectLaunch #WellDone`,
    },
  },
  [PROMPT_4]: {
    Urgency: {
      [-50]: `**Prod Issue Detected**

Our services appear to be down. Please join the bridge when you can so we can triage and restore stability.

Link: [Insert Bridge Link]
Start time: 2 mins ago

Let’s work on getting this fixed.`,
      [-25]: `🚨 **Prod Crash Detected** 🚨

Our services just went down. Please hop on the bridge as soon as possible so we can triage and restore stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s get this fixed quickly. 🛠️`,
      [25]: `🚨 **URGENT: Critical Prod Crash Detected** 🚨

Our services just went down. Please hop on the bridge immediately so we can triage and restore stability now.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s get this fixed ASAP. 🛠️`,
      [50]: `🚨 **URGENT: PROD CRASH IN PROGRESS** 🚨

Our services are down. Please join the bridge immediately—this needs active triage and restoration now.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Drop in ASAP so we can get this fixed. 🛠️`,
    },
    Formality: {
      [-50]: `🚨 **Prod is down** 🚨

Services just went down. Can everyone hop on the bridge now so we can figure out what happened and get things stable?

Link: [Insert Bridge Link]
Started: 2 mins ago

Let’s get it fixed ASAP. 🛠️`,
      [-25]: `🚨 **Prod Crash Detected** 🚨

Our services just went down. Please jump on the bridge right away so we can triage and get things stable again.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s get this fixed ASAP. 🛠️`,
      [25]: `🚨 **Critical Production Crash Detected** 🚨

Our services just went down. Please join the bridge immediately to triage the incident and restore system stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s resolve this as quickly as possible. 🛠️`,
      [50]: `🚨 **Critical Production Incident Detected** 🚨

Our services have just gone down. Please join the bridge immediately so we can coordinate triage efforts and restore service stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Your immediate attention is appreciated. 🛠️`,
    },
    Directness: {
      [-50]: `🚨 **Potential Prod Crash Detected** 🚨

It looks like our services may have just gone down. Please hop on the bridge when possible so we can triage and work toward restoring stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s try to get this fixed ASAP. 🛠️`,
      [-25]: `🚨 **Prod Crash Detected** 🚨

Our services just went down. Please hop on the bridge as soon as you can so we can triage and restore stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Let’s get this fixed ASAP. 🛠️`,
      [25]: `🚨 **CRITICAL: Prod Crash Detected** 🚨

Services are down. Join the bridge immediately to triage and restore stability.

Link: [Insert Bridge Link]
⏰ Start time: 2 mins ago

Fix ASAP. 🛠️`,
      [50]: `🚨 **PROD DOWN** 🚨

Join the bridge now.

Link: [Insert Bridge Link]
⏰ Started: 2 mins ago

Fix ASAP. 🛠️`,
    },
  },
  [PROMPT_5]: {
    Formality: {
      [-50]: `Subject: Extension Request for [Course Name]

Hi Professor [Last Name],

I hope you’re doing well.

I wanted to ask if I could get an extension on the upcoming assignment for [Topic/Assignment Name]. Because of [briefly state reason], I won’t be able to submit it by the original due date of [Date].

I’d like to turn it in by [Proposed New Date] if possible. Would that be okay?

Thank you for understanding.

Best,

[Your Name]
[Student ID Number]`,
      [-25]: `Subject: Request for Assignment Extension – [Course Name]

Hello Professor [Last Name],

I hope you are having a good week.

I wanted to ask if it would be possible to receive an extension for the upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason], I may not be able to submit my work by the original due date of [Date].

I would like to submit the assignment by [Proposed New Date]. Would that be possible?

Thank you for your time and understanding.

Best regards,

[Your Name]
[Student ID Number]`,
      [25]: `Subject: Formal Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I remain committed to submitting high-quality work and would like to request permission to submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you very much for your time and understanding. I sincerely appreciate your consideration.

Best regards,

[Your Name]
[Student ID Number]`,
      [50]: `Subject: Formal Request for Extension of Assignment Deadline – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope this message finds you well.

I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I am committed to submitting work that reflects the standards of the course, and I would be grateful for the opportunity to submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you very much for your time, understanding, and consideration.

Respectfully,

[Your Name]
[Student ID Number]`,
    },
    Persuasiveness: {
      [-50]: `Subject: Request for Deadline Extension – [Course Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to ask for an extension on the upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason], I will be unable to submit it by [Date].

I would like to submit it by [Proposed New Date]. Would that be possible?

Thank you for your time.

Best regards,

[Your Name]
[Student ID Number]`,
      [-25]: `Subject: Request for Deadline Extension – [Course Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason], I will be unable to submit my work by the original due date of [Date].

I would like to submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you for your time and understanding.

Best regards,

[Your Name]
[Student ID Number]`,
      [25]: `Subject: Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I want to ensure that I submit work that reflects my best effort and understanding of the material, rather than rushing an incomplete assignment. I would therefore like to submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you for your time and understanding. I appreciate your consideration.

Best regards,

[Your Name]
[Student ID Number]`,
      [50]: `Subject: Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I care about doing well in your course and want to submit work that accurately reflects my understanding of the material. With the current deadline, I am concerned that I would not be able to produce work at the level expected for the assignment. If granted an extension until [Proposed New Date], I would be able to complete the assignment more carefully and thoroughly.

Thank you for your time and understanding. I sincerely appreciate your consideration.

Best regards,

[Your Name]
[Student ID Number]`,
    },
    Politeness: {
      [-50]: `Subject: Deadline Extension – [Course Name]

Professor [Last Name],

I need an extension for the upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason], I will not be able to submit it by [Date].

I can submit it by [Proposed New Date]. Please let me know if that works.

Best,

[Your Name]
[Student ID Number]`,
      [-25]: `Subject: Request for Deadline Extension – [Course Name]

Hi Professor [Last Name],

I hope you are having a good week.

I am writing to ask for an extension on the upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason], I will be unable to submit my work by [Date].

I would like to submit it by [Proposed New Date]. Would that be possible?

Thank you,

[Your Name]
[Student ID Number]`,
      [25]: `Subject: Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I apologize for the inconvenience, but I am writing to respectfully request an extension of the deadline for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I am committed to ensuring high quality and would be very grateful if I could submit the assignment by [Proposed New Date]. Would it be possible to extend the deadline until then?

Thank you very much for your time and understanding. I truly appreciate your consideration.

Best regards,

[Your Name]
[Student ID Number]`,
      [50]: `Subject: Request for Deadline Extension – [Course Name] – [Your Name]

Dear Professor [Last Name],

I hope you are having a good week.

I apologize for the inconvenience, and I am writing to kindly and respectfully ask whether it might be possible to receive an extension for our upcoming assignment on [Topic/Assignment Name]. Due to [briefly state reason, e.g., an unexpected personal matter / a scheduling conflict], I will be unable to submit my work by the original due date of [Date].

I am committed to ensuring high quality and would be extremely grateful for the opportunity to submit the assignment by [Proposed New Date], if that would be acceptable.

Thank you very much for your time, understanding, and consideration. I sincerely appreciate it.

Best regards,

[Your Name]
[Student ID Number]`,
    },
  },
  [PROMPT_6]: {
    Formality: {
      [-50]: `Subject: Recommendation Letter Request

Hi [Manager's Name],

Hope you're having a great week.

I'm starting to look at future product management opportunities and wanted to ask if you'd be willing to write me a recommendation letter. Since we worked together on [mention specific project or achievement], I think your perspective would be really helpful.

If you're open to it, I can send over my resume and some talking points to make it easier.

No pressure if you're too busy, but I'd really appreciate it.

Thanks so much,

[Your Name]`,
      [-25]: `Subject: Request for Recommendation – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I wanted to ask if you'd be willing to write a recommendation letter for me. Given our work together on [mention specific project or achievement], I think your perspective would be valuable to my application.

If so, I'd be happy to share my resume and a draft of talking points to make the process easier.

No pressure at all if you're too busy right now, but I'd really appreciate your thoughts.

Thanks so much,

[Your Name]`,
      [25]: `Subject: Request for Recommendation Letter – Product Management Roles

Dear [Manager's Name],

I hope you are having a great week.

As I look ahead to exploring new opportunities in product management, I would be grateful to have your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application.

Would you be open to writing a formal recommendation letter for future product leadership roles? If so, I would be happy to share my resume and a draft of potential talking points to help ensure it highlights the key skills we developed during our time working together.

I completely understand if your schedule is too full right now, but I would sincerely appreciate your thoughts if you might be able to take this on.

Thank you very much for your continued mentorship.

Best regards,

[Your Name]`,
      [50]: `Subject: Formal Request for Recommendation Letter – Product Management Roles

Dear [Manager's Name],

I hope this message finds you well.

As I look ahead to exploring new opportunities in product management, I would be grateful for your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application.

Would you be willing to write a formal recommendation letter on my behalf for future product leadership roles? If so, I would be happy to provide my resume and a draft of potential talking points to help ensure the letter reflects the key skills and experiences we developed during our time working together.

I completely understand if your current schedule does not allow for this, but I would sincerely appreciate your consideration.

Thank you very much for your continued mentorship and support.

Best regards,

[Your Name]`,
    },
    Deference: {
      [-50]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

I'm exploring new opportunities in product management and would like your support. Given our work together on [mention specific project or achievement], your perspective would add value to my application.

Can you write a formal recommendation letter for future product leadership roles? I can share my resume and talking points to help highlight the key skills we developed while working together.

Let me know if you can take this on.

Thanks,

[Your Name]`,
      [-25]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd like your support. Given our work together on [mention specific project or achievement], I believe your perspective would add value to my application.

Would you be open to writing a formal recommendation letter for future product leadership roles? I can share my resume and draft talking points to help highlight the key skills we developed during our time working together.

Please let me know if you might be able to take this on.

Thanks,

[Your Name]`,
      [25]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd be very grateful to have your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application.

Would you be open to writing a formal recommendation letter for future product leadership roles? If so, I'd be happy to share my resume and a draft of potential talking points to make the process as easy as possible and to help ensure it highlights the key skills we developed during our time working together.

I completely understand if you're too busy right now, but I would really appreciate your thoughts if you might be able to take this on.

Thanks so much for your continued mentorship!

Best regards,

[Your Name]`,
      [50]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I would be extremely grateful for your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application.

If you would be comfortable doing so, would you be willing to write a formal recommendation letter for future product leadership roles? I would be happy to share my resume and a draft of potential talking points to make the process as easy as possible and to help ensure it highlights the key skills we developed during our time working together.

I completely understand if you're too busy right now, so no pressure at all. I would sincerely appreciate your thoughts if this is something you might be able to take on.

Thank you so much for your continued mentorship and support.

Best regards,

[Your Name]`,
    },
    Persuasion: {
      [-50]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

I'm exploring new opportunities in product management and wanted to ask if you would write a recommendation letter for future product leadership roles.

If so, I can share my resume and a draft of talking points.

No pressure if you're too busy right now.

Thanks,

[Your Name]`,
      [-25]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd love to have your support. Given our work together on [mention specific project or achievement], your perspective would be helpful to my application.

Would you be open to writing a formal recommendation letter for future product leadership roles? If so, I'd be happy to share my resume and a draft of potential talking points.

No pressure at all if you're too busy right now, but I'd appreciate your thoughts.

Best regards,

[Your Name]`,
      [25]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd love to leverage your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application by speaking directly to my product judgment, collaboration, and ability to contribute to cross-functional work.

Would you be open to writing a formal recommendation letter for future product leadership roles? If so, I'd be happy to share my resume and a draft of potential talking points to make the process easy and to help ensure it highlights the key skills we developed during our time working together.

No pressure at all if you're too busy right now, but I'd really appreciate your thoughts if you might be able to take this on.

Thanks so much for your continued mentorship!

Best regards,

[Your Name]`,
      [50]: `Subject: Request for Reference – Product Management Roles

Hi [Manager's Name],

I hope you're having a great week.

As I look ahead to exploring new opportunities in product management, I'd love to leverage your support. Given our work together on [mention specific project or achievement], I believe your perspective would add significant value to my application by highlighting my product judgment, cross-functional collaboration, communication, and ability to drive work forward.

A recommendation from you would be especially meaningful because you have seen my contributions directly and can speak to the skills that are most relevant for future product leadership roles. If you would be open to writing a formal recommendation letter, I'd be happy to share my resume and a draft of potential talking points to make the process as easy as possible and to ensure it reflects the key strengths we developed during our time working together.

No pressure at all if you're too busy right now, but I'd really appreciate your thoughts if you might be able to take this on.

Thanks so much for your continued mentorship!

Best regards,

[Your Name]`,
    },
  },
  [PROMPT_7]: {
    Formality: {
      [-50]: `Subject: Security Key Sent to Wrong Address

Hi Support Team,

My security key was shipped to the wrong address. Could you help me get a replacement or tell me how to retrieve it?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Please let me know what you need from me.

Thanks,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
      [-25]: `Subject: Security Key Delivery Issue

Hello Support Team,

I hope you're doing well.

I recently noticed that my security key order was shipped to the wrong address. After checking my order details, it looks like the package was sent somewhere other than my registered shipping address.

Could you please help me confirm what happened and let me know how I can retrieve the key or receive a replacement?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Thank you for your help.

Best,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
      [25]: `Subject: Request for Assistance with Incorrect Security Key Delivery

Dear Support Team,

I hope you are doing well.

I am writing to report that my recent security key order appears to have been shipped to the wrong address. After reviewing my order details, I realized that the package was sent to a location different from my registered shipping address.

Could you please assist me by confirming whether the key was delivered incorrectly, advising whether it can be retrieved, and explaining the process for receiving a replacement unit if needed?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Please let me know if you need any additional information from me to move this forward. Thank you for your time and assistance.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
      [50]: `Subject: Formal Request for Replacement Security Key Due to Incorrect Delivery Address

Dear Support Team,

I hope this message finds you well.

I am writing to formally report an issue with the delivery of my recent security key order. Upon reviewing the order and shipping information, I found that the package appears to have been sent to an address other than my registered shipping address.

I would appreciate your assistance in determining whether the key can be retrieved or whether a replacement unit should be issued. If a replacement is required, please let me know what verification steps, documentation, or fees may be necessary to complete the process.

My order number is [Insert Order Number], and the order was placed on [Insert Date].

Thank you very much for your attention to this matter. I appreciate your assistance and look forward to your guidance on the next steps.

Sincerely,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
    },
    Detail: {
      [-50]: `Subject: Security Key Delivery Issue

Dear Support Team,

My security key was shipped to the wrong address. I need help retrieving it or getting a replacement sent to my correct address.

Order number: [Insert Order Number]
Order date: [Insert Date]

Please let me know what I should do next.

Best regards,

[Your Name]`,
      [-25]: `Subject: Security Key Delivered to Wrong Address

Dear Support Team,

I am writing because my security key order appears to have been shipped to the wrong address. I checked my order details and the delivery location does not match my registered shipping address.

Could you please confirm whether the package can be retrieved or whether I should request a replacement key?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Thank you,

[Your Name]
[Your Account Email/Username]`,
      [25]: `Subject: Issue with Security Key Delivery – Request for Replacement

Dear Support Team,

I am writing to report that my recent security key order appears to have been shipped to the wrong address. After checking my order confirmation and tracking details, I realized that the delivery location does not match my registered shipping address.

Could you please help me with the following:

1. Confirm whether the package was shipped to an incorrect address or marked delivered in error.
2. Let me know whether the original package can be retrieved or should be considered unavailable.
3. Provide instructions for receiving a replacement security key.
4. Confirm whether any identity verification, documentation, or replacement fee is required.

My order number is [Insert Order Number], and I placed the order on [Insert Date]. The correct shipping address on my account should be [Insert Correct Address].

Please let me know if there is any additional information I can provide to help resolve this.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
      [50]: `Subject: Detailed Request for Assistance with Misdelivered Security Key

Dear Support Team,

I am writing to request assistance with a security key order that appears to have been shipped to the wrong address. After reviewing my order confirmation, account shipping information, and delivery notification, I noticed that the package was sent to or marked delivered at a location that does not match my registered shipping address.

Because this item is used for account security, I would like to resolve the issue carefully and make sure the misplaced key cannot create any access or security concerns. Could you please help me confirm the status of the shipment and advise on the appropriate next steps?

For reference:

- Order number: [Insert Order Number]
- Order date: [Insert Date]
- Tracking number: [Insert Tracking Number]
- Correct shipping address: [Insert Correct Address]
- Incorrect delivery address or location shown: [Insert Incorrect Address or Delivery Location]

Specifically, I would appreciate guidance on whether the original package can be retrieved, whether the shipped key should be deactivated or invalidated, and whether a replacement security key can be issued. Please also let me know if you need additional verification, documentation, or payment information to process the replacement.

Thank you for your help. I appreciate your assistance in resolving this delivery issue as soon as possible.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
    },
    Urgency: {
      [-50]: `Subject: Security Key Delivery Question

Dear Support Team,

I noticed that my security key order may have been shipped to the wrong address. When you have a chance, could you please let me know whether it can be retrieved or whether I should request a replacement?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Thank you,

[Your Name]`,
      [-25]: `Subject: Security Key Shipped to Wrong Address

Dear Support Team,

I am writing because my security key appears to have been shipped to the wrong address. Could you please help me check the shipment and let me know the next steps for retrieving it or getting a replacement?

My order number is [Insert Order Number], and I placed the order on [Insert Date].

I would appreciate your help when possible.

Best regards,

[Your Name]
[Your Account Email/Username]`,
      [25]: `Subject: Urgent: Security Key Shipped to Wrong Address – Replacement Needed

Dear Support Team,

I am writing to report an urgent issue with my recent security key order. The package appears to have been shipped to an address that does not match my registered shipping address.

Because this key is tied to account access and security, I would appreciate prompt assistance confirming whether the package can be retrieved or whether a replacement key can be issued right away. Please also let me know if any verification steps are needed to protect my account while this is resolved.

My order number is [Insert Order Number], and I placed the order on [Insert Date].

Please let me know the fastest way to proceed.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
      [50]: `Subject: Urgent Action Required: Security Key Misdelivered – Replacement Needed Immediately

Dear Support Team,

I am contacting you urgently because my security key order appears to have been shipped to the wrong address. After checking my order and delivery details, I confirmed that the package was sent to a location other than my registered shipping address.

This is time-sensitive because the key is required for secure account access, and a misplaced security key may create an account security concern. Please help me immediately confirm whether the original key can be retrieved, whether it should be deactivated or invalidated, and how quickly a replacement can be shipped to my correct address.

My order number is [Insert Order Number], and I placed the order on [Insert Date]. My correct shipping address is [Insert Correct Address].

Please let me know what verification you need from me so we can resolve this as quickly as possible.

Best regards,

[Your Name]
[Your Account Email/Username]
[Phone Number]`,
    },
  },
};

const excerpt = (text: string | undefined) => {
  if (!text) return undefined;

  const line = text
    .split('\n')
    .map((part) => part.trim())
    .find((part) => part.length > 0);

  if (!line) return undefined;

  const cleaned = line.replace(/[*_`#]/g, '').replace(/\s+/g, ' ').trim();
  return cleaned.length > 110 ? `${cleaned.slice(0, 107)}…` : cleaned;
};

export function getPrecomputedPoleExamples(
  prompt: string,
  axisLabel: string | undefined
) {
  if (!axisLabel) {
    return { negative: undefined, positive: undefined };
  }

  const variants = PRECOMPUTED_STEERING_VARIANTS[normalizePromptKey(prompt)]?.[axisLabel];

  return {
    negative: excerpt(variants?.[-50]),
    positive: excerpt(variants?.[50]),
  };
}

export function getPrecomputedSteeredText(
  prompt: string,
  axisLabel: string | undefined,
  coefficient: number,
  baselineText: string
) {
  if (coefficient === 0) return baselineText;
  if (!axisLabel) return null;

  return (
    PRECOMPUTED_STEERING_VARIANTS[normalizePromptKey(prompt)]?.[axisLabel]?.[
      coefficient
    ] ?? null
  );
}
