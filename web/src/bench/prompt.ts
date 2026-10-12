// Fixed speed-test input. Changing any of this changes what the numbers mean,
// so bump SPEED_PROMPT_VERSION whenever it is edited.

export const SPEED_PROMPT_VERSION = 1

export const SPEED_MAX_TOKENS = 128

// Long enough (a few hundred tokens) that prompt reading time is measurable
// rather than lost in per-request overhead.
export const SPEED_PROMPT = `Read the following passage about lighthouses and then write a short summary of it.

Lighthouses were built to warn ships away from dangerous coasts and to guide them into safe harbours. The earliest known lighthouse, the Pharos of Alexandria, stood on a small island off the coast of Egypt and was finished around 280 BC. Ancient writers described a fire burning at its top, with polished metal used to reflect the light out to sea. For many centuries afterwards, most lighthouses were simple towers with open fires or candles, and their light could only be seen from a short distance.

The great change came in the early nineteenth century. In 1822 the French physicist Augustin Fresnel designed a lens made of many glass rings arranged around a central lamp. Each ring bent the light so that it left the lens as a narrow, powerful beam. A Fresnel lens could send light more than twenty miles, and it used far less fuel than older mirror systems. Within a few decades these lenses were installed in lighthouses across Europe and North America.

Each lighthouse also needed a way to be recognised. Keepers used different patterns of flashes, colours, and periods of darkness, so that a sailor who saw a light at night could look it up on a chart and know exactly where the ship was. Some towers were painted with stripes or bands so that they could be identified in daylight as well. In fog, when no light could be seen, many stations used bells, horns, or sirens instead.

Life for a lighthouse keeper was often lonely and hard. Keepers had to climb the tower many times each night to trim wicks, refill oil, and wind the clockwork that turned the lens. On remote rocks, supplies could be delayed for weeks by storms. During the twentieth century, electric lamps, automatic timers, and later radio and satellite navigation removed the need for most keepers. Today nearly all lighthouses are automated, and many old towers have become museums that tell the story of the people who once kept the lights burning.

Summary:`
